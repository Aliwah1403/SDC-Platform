import { Badge } from "@/components/ui/badge";

const TermsPage = () => {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <Badge variant="secondary">Terms</Badge>
      <h1 className="mt-4 text-4xl font-bold sm:text-5xl">Terms of Use</h1>
      <p className="mt-5 text-muted-foreground">
        This page is a pre-launch placeholder and will be replaced with final legal terms before public release.
      </p>

      <div className="mt-8 space-y-6 rounded-2xl border bg-card p-6 sm:p-8">
        <section>
          <h2 className="text-xl font-semibold">Use of service</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Hemo is provided as a health support and tracking tool. It does not replace clinical judgment or emergency services.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Account responsibilities</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Users are responsible for maintaining account security and ensuring contact details are current.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Availability and updates</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Features may evolve during pre-launch and early release stages as we improve product reliability and safety.
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsPage;
