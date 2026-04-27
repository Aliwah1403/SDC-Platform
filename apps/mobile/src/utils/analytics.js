import PostHog from 'posthog-react-native';

export const posthog = new PostHog('phc_x88DaDTp52cVBiXM9cWKN242pxv7D78GBe6V79oLNUzr', {
  host: 'https://us.i.posthog.com',
  captureAppLifecycleEvents: false, // tracked manually with richer context
});

export function captureAIGeneration(featureName, meta) {
  if (!meta) return;
  posthog.capture('$ai_generation', {
    $ai_provider: 'anthropic',
    $ai_model: meta.model,
    $ai_input_tokens: meta.inputTokens,
    $ai_output_tokens: meta.outputTokens,
    $ai_cache_read_input_tokens: meta.cacheReadTokens ?? 0,
    $ai_latency: meta.latencyMs / 1000,
    $ai_base_url: 'https://api.anthropic.com',
    $ai_http_status: 200,
    hemo_feature: featureName,
  });
}

export function captureAIError(featureName, errorMessage, meta) {
  posthog.capture('$ai_generation', {
    $ai_provider: 'anthropic',
    $ai_model: meta?.model ?? 'unknown',
    $ai_input_tokens: meta?.inputTokens ?? 0,
    $ai_output_tokens: meta?.outputTokens ?? 0,
    $ai_cache_read_input_tokens: meta?.cacheReadTokens ?? 0,
    $ai_latency: meta?.latencyMs ? meta.latencyMs / 1000 : null,
    $ai_base_url: 'https://api.anthropic.com',
    $ai_http_status: 500,
    $ai_error: errorMessage,
    hemo_feature: featureName,
  });
}
