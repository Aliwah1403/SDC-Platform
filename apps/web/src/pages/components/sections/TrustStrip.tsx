const partners = [
  "NHS",
  "Sickle Cell Society",
  "CDC",
  "SCDAA",
  "Global Blood Therapeutics",
];

const TrustStrip = () => {
  return (
    <section className="border-y border-border bg-muted/30 py-10 mt-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-muted-foreground mb-8">
          Built for the SCD community
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
          {partners.map((name) => (
            <span
              key={name}
              className="text-base font-semibold text-muted-foreground/50 tracking-tight"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustStrip;
