import { Badge } from "@/components/ui/badge";

const MedicalDisclaimerPage = () => {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <Badge variant="secondary">Medical Disclaimer</Badge>
      <h1 className="mt-4 text-4xl font-bold sm:text-5xl">Medical Disclaimer</h1>
      <p className="mt-5 text-muted-foreground">
        Hemo is a self-management support app. It is not a medical device, not emergency care,
        and not a substitute for diagnosis or treatment by licensed clinicians.
      </p>

      <div className="mt-8 space-y-6 rounded-2xl border bg-card p-6 sm:p-8">
        <section>
          <h2 className="text-xl font-semibold">Not emergency care</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            If you are in crisis or believe you need urgent care, contact local emergency services immediately.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Informational support only</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Insights and educational content are provided for general support and should not be treated as definitive medical advice.
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
