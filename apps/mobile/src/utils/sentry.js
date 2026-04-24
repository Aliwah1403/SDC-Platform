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

const SENSITIVE_KEYS = [
  'painLevel', 'mood', 'bodyLocations', 'symptoms', 'hydration',
  'notes', 'triggers', 'activities', 'currentSymptomLog', 'healthData',
  'onboardingData', 'crisisPlan', 'chatMessages',
];

function scrubEvent(event) {
  if (event.extra) SENSITIVE_KEYS.forEach((k) => delete event.extra[k]);
  if (event.request?.data) SENSITIVE_KEYS.forEach((k) => delete event.request.data[k]);
  return event;
}

export function initSentry() {
  _sentry?.init({
    dsn: 'https://ae0449aff1dfcd3fed7b16250ab580b6@o4511273190096896.ingest.us.sentry.io/4511273193308160',
    tracesSampleRate: 0.2,
    environment: __DEV__ ? 'development' : 'production',
    beforeSend: scrubEvent,
  });
}

export const Sentry = {
  setUser: (user) => _sentry?.setUser?.(user),
  captureException: (err) => _sentry?.captureException?.(err),
  captureMessage: (msg) => _sentry?.captureMessage?.(msg),
  addBreadcrumb: (b) => _sentry?.addBreadcrumb?.(b),
};
