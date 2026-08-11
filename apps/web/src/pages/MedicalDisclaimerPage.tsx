import { Badge } from "@/components/ui/badge";

const MedicalDisclaimerPage = () => {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <Badge variant="secondary">Medical Disclaimer</Badge>
      <h1 className="mt-4 text-4xl font-bold sm:text-5xl">Medical Disclaimer</h1>
      <p className="mt-3 text-sm font-medium text-primary">Last updated: August 11, 2026</p>
      <p className="mt-5 text-muted-foreground">
        Hemo helps people organise, track, and share information about their health. It is not a
        medical device, healthcare provider, emergency service, or substitute for advice,
        diagnosis, treatment, or an individual care plan from qualified healthcare professionals.
      </p>

      <div className="mt-8 space-y-6 rounded-2xl border bg-card p-6 sm:p-8">
        <section>
          <h2 className="text-xl font-semibold">Not emergency care</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Hemo does not monitor users, dispatch emergency care, or guarantee that a call,
            notification, or message reaches another person. If symptoms are severe, unusual,
            worsening, or you are unsure, contact local emergency services or seek urgent medical
            help. Do not wait for Hemo or a contact to respond.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Informational support only</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Health logs, educational content, patterns, scores, summaries, reports, and other
            outputs are provided for informational and organisational support. They are not
            clinical interpretations, diagnoses, prescriptions, or treatment recommendations.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Crisis and pain plans</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            A crisis or pain plan stored in Hemo should be created or reviewed with the user's
            healthcare team and reflect that individual's needs. Hemo does not create, prescribe,
            approve, or independently update a treatment plan.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Wearables and connected health data</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Data from Apple Health, Health Connect, phones, and wearable devices can be missing,
            delayed, inaccurate, or recorded for the wrong person. Hemo cannot use a device
            reading to diagnose a complication or determine whether it is safe to delay care.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">AI summaries and medication matches</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            AI-assisted summaries organise user-provided information and may contain errors.
            Photo or barcode medication matches are suggestions that must be checked against the
            original packaging and confirmed with a pharmacist or clinician before use.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Work with your care team</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Always discuss symptoms, treatment decisions, and medication changes with qualified healthcare professionals.
          </p>
        </section>
      </div>
    </div>
  );
};

export default MedicalDisclaimerPage;
