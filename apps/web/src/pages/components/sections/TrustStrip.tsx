const proofPoints = [
  "Supports all major SCD types",
  "90 days of trend visibility",
  "7 daily health metrics",
  "6 care hub tools in one place",
];

const TrustStrip = () => {
  return (
    <section className="mt-10 border-y border-border bg-muted/30 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="mb-7 text-center text-sm text-muted-foreground">
          Designed for patients, caregivers, and clinic conversations that need real context.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {proofPoints.map((item) => (
            <span key={item} className="text-sm font-semibold tracking-tight text-foreground/80">
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustStrip;
