import PostHog from 'posthog-react-native';

export const posthog = new PostHog('phc_x88DaDTp52cVBiXM9cWKN242pxv7D78GBe6V79oLNUzr', {
  host: 'https://us.i.posthog.com',
  captureAppLifecycleEvents: false, // tracked manually with richer context
});
