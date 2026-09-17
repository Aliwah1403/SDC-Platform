import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { MMKV } from 'react-native-mmkv';
import { toLocalDateStr } from '@/utils/dateUtils';

export const HEALTH_LOG_ENCRYPTION_KEY = 'hemo.health-logs.encryption-key.v1';
export const HEALTH_LOG_STORAGE_KEY = 'hemo.health-logs.records.v1';

export class HealthLogStorageError extends Error {
  constructor(message, code = 'HEALTH_LOG_STORAGE_UNAVAILABLE') {
    super(message);
    this.name = 'HealthLogStorageError';
    this.code = code;
  }
}

let storePromise = null;
let operationChain = Promise.resolve();
const listenersByUser = new Map();

export function subscribeHealthLogRepository(userId, listener) {
  if (!userId || typeof listener !== 'function') return () => {};
  const listeners = listenersByUser.get(userId) ?? new Set();
  listeners.add(listener);
  listenersByUser.set(userId, listeners);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) listenersByUser.delete(userId);
  };
}

// Notifications carry no record or payload. Consumers read aggregate counts
// after the serialized write completes, so PHI never crosses the event API.
export function notifyHealthLogRepository(userId) {
  listenersByUser.get(userId)?.forEach((listener) => {
    try { listener(); } catch { /* observers must not affect persistence */ }
  });
}

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function getEncryptionKey() {
  let key;
  try {
    key = await SecureStore.getItemAsync(HEALTH_LOG_ENCRYPTION_KEY);
    if (!key) {
      key = bytesToHex(await Crypto.getRandomBytesAsync(32));
      if (!key) throw new Error('empty key');
      await SecureStore.setItemAsync(HEALTH_LOG_ENCRYPTION_KEY, key);
      // Verify the key was actually persisted. A device with unavailable or
      // misconfigured secure storage must fail visibly, never use plaintext.
      const persisted = await SecureStore.getItemAsync(HEALTH_LOG_ENCRYPTION_KEY);
      if (persisted !== key) throw new Error('key verification failed');
    }
  } catch (error) {
    throw new HealthLogStorageError(
      'Secure storage is unavailable. Your health log was not saved.',
      'SECURE_STORAGE_UNAVAILABLE',
    );
  }
  return key;
}

async function getStore() {
  if (!storePromise) {
    storePromise = getEncryptionKey()
      .then((encryptionKey) => new MMKV({ id: 'hemo-health-logs', encryptionKey }))
      .catch((error) => {
        storePromise = null;
        if (error instanceof HealthLogStorageError) throw error;
        throw new HealthLogStorageError(
          'Encrypted health-log storage is unavailable. Your health log was not saved.',
          'ENCRYPTED_STORAGE_UNAVAILABLE',
        );
      });
  }
  return storePromise;
}

function withOperationLock(operation) {
  const next = operationChain.then(operation, operation);
  operationChain = next.catch(() => {});
  return next;
}

async function readAll(store) {
  const raw = store.getString(HEALTH_LOG_STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('invalid shape');
    return parsed;
  } catch {
    throw new HealthLogStorageError(
      'Encrypted health-log storage could not be read. Your health log was not saved.',
      'ENCRYPTED_STORAGE_CORRUPT',
    );
  }
}

function writeAll(store, recordsByUser) {
  try {
    store.set(HEALTH_LOG_STORAGE_KEY, JSON.stringify(recordsByUser));
  } catch {
    throw new HealthLogStorageError(
      'Encrypted health-log storage could not be written. Your health log was not saved.',
      'ENCRYPTED_STORAGE_WRITE_FAILED',
    );
  }
}

function normalizeCapturedAt(value) {
  const date = value instanceof Date ? value : new Date(value ?? Date.now());
  if (Number.isNaN(date.getTime())) throw new Error('Invalid capturedAt');
  return date;
}

function clonePayload(payload) {
  try {
    return JSON.parse(JSON.stringify(payload ?? {}));
  } catch {
    throw new HealthLogStorageError(
      'This health log could not be prepared for encrypted storage.',
      'HEALTH_LOG_PAYLOAD_INVALID',
    );
  }
}

export async function enqueueHealthLog(userId, payload, options = {}) {
  if (!userId) throw new HealthLogStorageError('A signed-in account is required to save a health log.', 'AUTH_REQUIRED');
  return withOperationLock(async () => {
    const store = await getStore();
    const now = new Date().toISOString();
    const captured = normalizeCapturedAt(options.capturedAt);
    const record = {
      clientMutationId: options.clientMutationId ?? Crypto.randomUUID(),
      userId,
      capturedAt: captured.toISOString(),
      capturedLocalDate: options.capturedLocalDate ?? toLocalDateStr(captured),
      capturedTimezone: options.capturedTimezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC',
      payload: clonePayload(payload),
      attempts: 0,
      status: 'pending',
      retryable: true,
      lastError: null,
      nextAttemptAt: null,
      createdAt: now,
      updatedAt: now,
    };
    const recordsByUser = await readAll(store);
    const userRecords = Array.isArray(recordsByUser[userId]) ? recordsByUser[userId] : [];
    recordsByUser[userId] = [...userRecords, record];
    writeAll(store, recordsByUser);
    notifyHealthLogRepository(userId);
    return record;
  });
}

export async function listHealthLogRecords(userId, options = {}) {
  if (!userId) return [];
  return withOperationLock(async () => {
    const store = await getStore();
    const recordsByUser = await readAll(store);
    const records = Array.isArray(recordsByUser[userId]) ? recordsByUser[userId] : [];
    return records
      .filter((record) => !options.date || record.capturedLocalDate === options.date)
      .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  });
}

export async function listPendingHealthLogs(userId) {
  const records = await listHealthLogRecords(userId);
  // A process can terminate after marking a record syncing but before the
  // RPC acknowledgement. Treat that state as pending on the next launch;
  // the server RPC is idempotent by clientMutationId.
  return records.filter((record) => record.status === 'pending' || record.status === 'syncing' || (record.status === 'failed' && record.retryable));
}

export async function getHealthLogSyncCounts(userId) {
  const records = await listHealthLogRecords(userId);
  return records.reduce((counts, record) => {
    if (record.status === 'pending' || record.status === 'syncing') counts.pending += 1;
    if (record.status === 'failed') counts.failed += 1;
    return counts;
  }, { pending: 0, failed: 0 });
}

export async function markHealthLogAttempt(clientMutationId, userId) {
  return withOperationLock(async () => {
    const store = await getStore();
    const recordsByUser = await readAll(store);
    const records = Array.isArray(recordsByUser[userId]) ? recordsByUser[userId] : [];
    let updatedRecord = null;
    recordsByUser[userId] = records.map((record) => {
      if (record.clientMutationId !== clientMutationId) return record;
      updatedRecord = {
        ...record,
        attempts: (record.attempts ?? 0) + 1,
        status: 'syncing',
        updatedAt: new Date().toISOString(),
      };
      return updatedRecord;
    });
    if (updatedRecord) writeAll(store, recordsByUser);
    if (updatedRecord) notifyHealthLogRepository(userId);
    return updatedRecord;
  });
}

export async function markHealthLogFailure(clientMutationId, userId, {
  lastError = 'sync_failed',
  retryable = true,
  status = 'failed',
} = {}) {
  return withOperationLock(async () => {
    const store = await getStore();
    const recordsByUser = await readAll(store);
    const records = Array.isArray(recordsByUser[userId]) ? recordsByUser[userId] : [];
    let updatedRecord = null;
    recordsByUser[userId] = records.map((record) => {
      if (record.clientMutationId !== clientMutationId) return record;
      const attempts = record.attempts ?? 0;
      const backoffMs = Math.min(5 * 60 * 1000, 1000 * (2 ** Math.min(attempts, 8)));
      updatedRecord = {
        ...record,
        status,
        retryable,
        lastError,
        nextAttemptAt: retryable ? new Date(Date.now() + backoffMs).toISOString() : null,
        updatedAt: new Date().toISOString(),
      };
      return updatedRecord;
    });
    if (updatedRecord) writeAll(store, recordsByUser);
    if (updatedRecord) notifyHealthLogRepository(userId);
    return updatedRecord;
  });
}

export async function retryHealthLog(clientMutationId, userId) {
  return withOperationLock(async () => {
    const store = await getStore();
    const recordsByUser = await readAll(store);
    const records = Array.isArray(recordsByUser[userId]) ? recordsByUser[userId] : [];
    let updatedRecord = null;
    recordsByUser[userId] = records.map((record) => {
      if (record.clientMutationId !== clientMutationId) return record;
      updatedRecord = {
        ...record,
        status: 'pending',
        retryable: true,
        lastError: null,
        nextAttemptAt: null,
        updatedAt: new Date().toISOString(),
      };
      return updatedRecord;
    });
    if (updatedRecord) writeAll(store, recordsByUser);
    if (updatedRecord) notifyHealthLogRepository(userId);
    return updatedRecord;
  });
}

export async function acknowledgeHealthLog(clientMutationId, userId) {
  return withOperationLock(async () => {
    const store = await getStore();
    const recordsByUser = await readAll(store);
    const records = Array.isArray(recordsByUser[userId]) ? recordsByUser[userId] : [];
    recordsByUser[userId] = records.filter((record) => record.clientMutationId !== clientMutationId);
    writeAll(store, recordsByUser);
    notifyHealthLogRepository(userId);
  });
}

export async function purgeHealthLogs(userId) {
  if (!userId) return;
  return withOperationLock(async () => {
    const store = await getStore();
    const recordsByUser = await readAll(store);
    delete recordsByUser[userId];
    writeAll(store, recordsByUser);
    notifyHealthLogRepository(userId);
  });
}

export function toHealthLogView(record) {
  const payload = record.payload ?? {};
  const mood = payload.mood === 'excellent' ? 5
    : payload.mood === 'good' ? 4
    : payload.mood === 'fair' ? 3
    : payload.mood === 'poor' ? 2
    : typeof payload.mood === 'number' ? payload.mood
    : 1;
  return {
    id: record.clientMutationId,
    userId: record.userId,
    clientMutationId: record.clientMutationId,
    date: record.capturedLocalDate,
    capturedAt: record.capturedAt,
    capturedTimezone: record.capturedTimezone,
    painLevel: payload.painLevel ?? 0,
    bodyLocations: payload.bodyLocations ?? [],
    symptoms: payload.symptoms ?? [],
    mood,
    hydration: payload.hydration ?? 0,
    notes: payload.notes || null,
    triggers: payload.triggers ?? [],
    activities: payload.activities ?? [],
    createdAt: record.createdAt,
    isPending: record.status !== 'synced',
    syncStatus: record.status,
    syncError: record.lastError,
  };
}
