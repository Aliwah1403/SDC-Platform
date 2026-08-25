export function normalizeQueryError(error) {
  if (!error) return { message: 'Something went wrong. Please try again.', code: null };

  return {
    message: error.message || 'Something went wrong. Please try again.',
    code: error.code ?? error.status ?? null,
  };
}

export function logQueryError(scope, error) {
  const normalized = normalizeQueryError(error);
  console.error(`[Query:${scope}] ${normalized.message}`, {
    code: normalized.code,
    error,
  });
  return normalized;
}
