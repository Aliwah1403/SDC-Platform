// Fast Refresh re-evaluates JS modules but native views can only be registered
// once per app session. The global guard prevents duplicate registration on reload.
// After rebuilding the dev client with the @sentry/react-native/expo plugin,
// native crash reporting becomes active automatically.
if (global.__sentry_module === undefined) {
  try {
    global.__sentry_module = require('@sentry/react-native');
  } catch {
    global.__sentry_module = false; // mark as "tried and failed" so we don't retry
  }
}

const _sentry = global.__sentry_module || null;

const SENSITIVE_KEYS = new Set([
  'painLevel', 'mood', 'bodyLocations', 'symptoms', 'hydration',
  'notes', 'triggers', 'activities', 'currentSymptomLog', 'healthData',
  'onboardingData', 'crisisPlan', 'chatMessages',
]);

const SENSITIVE_PATTERN = new RegExp(
  Array.from(SENSITIVE_KEYS).join('|'),
  'i',
);

function scrubObj(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(scrubObj);
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = SENSITIVE_KEYS.has(k) ? '[Filtered]' : scrubObj(v);
  }
  return out;
}

function scrubString(str) {
  if (typeof str !== 'string') return str;
  return str.replace(SENSITIVE_PATTERN, '[Filtered]');
}

function parseRequestData(data) {
  if (typeof data === 'string') {
    try { return JSON.parse(data); } catch { return data; }
  }
  return data;
}

function scrubEvent(event) {
  if (event.extra) event.extra = scrubObj(event.extra);

  if (event.request?.data) {
    event.request.data = scrubObj(parseRequestData(event.request.data));
  }

  if (event.contexts) event.contexts = scrubObj(event.contexts);

  if (Array.isArray(event.breadcrumbs?.values)) {
    event.breadcrumbs.values = event.breadcrumbs.values.map((b) => ({
      ...b,
      data: b.data ? scrubObj(b.data) : b.data,
      message: scrubString(b.message),
    }));
  }

  if (event.message) event.message = scrubString(event.message);

  if (Array.isArray(event.exception?.values)) {
    event.exception.values = event.exception.values.map((ex) => ({
      ...ex,
      value: scrubString(ex.value),
    }));
  }

  return event;
}

function scrubBreadcrumb(breadcrumb) {
  // Drop request/response body data from HTTP and navigation breadcrumbs
  if (breadcrumb.type === 'http' || breadcrumb.category === 'navigation') {
    const { data, ...rest } = breadcrumb;
    return rest;
  }
  return breadcrumb;
}

export function initSentry() {
  _sentry?.init({
    dsn: 'https://ae0449aff1dfcd3fed7b16250ab580b6@o4511273190096896.ingest.us.sentry.io/4511273193308160',
    tracesSampleRate: 0.2,
    environment: __DEV__ ? 'development' : 'production',
    beforeSend: scrubEvent,
    beforeBreadcrumb: scrubBreadcrumb,
  });
}

export const Sentry = {
  setUser: (user) => _sentry?.setUser?.(user),
  captureException: (err) => _sentry?.captureException?.(err),
  captureMessage: (msg) => _sentry?.captureMessage?.(msg),
  addBreadcrumb: (b) => _sentry?.addBreadcrumb?.(b),
};
