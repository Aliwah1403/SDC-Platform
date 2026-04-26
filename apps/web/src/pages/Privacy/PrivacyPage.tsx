import { Badge } from "@/components/ui/badge";

const PrivacyPage = () => {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <Badge variant="secondary">Privacy</Badge>
      <h1 className="mt-4 text-4xl font-bold sm:text-5xl">Privacy Policy</h1>
      <p className="mt-5 text-muted-foreground">
        This page is a pre-launch placeholder and will be replaced with the final legal policy before public release.
      </p>

      <div className="mt-8 space-y-6 rounded-2xl border bg-card p-6 sm:p-8">
        <section>
          <h2 className="text-xl font-semibold">Information we collect</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We may collect account details, app usage data, and health-related entries you choose to provide.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">How we use information</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            To provide app functionality, improve user experience, and communicate relevant product updates.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Your choices</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You can contact us to request account data access, correction, or deletion once the app is live.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPage;
