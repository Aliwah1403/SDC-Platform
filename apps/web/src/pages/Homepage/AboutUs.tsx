const AboutUs = () => {
  return (
    <section
      id="about"
      className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
    >
      <div className="grid gap-8 border-t border-border pt-10 lg:grid-cols-[1fr_1fr]">
        <div>
          <h2 className="text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
            Why this app exists
          </h2>
        </div>
        <div className="space-y-4 text-muted-foreground">
          <p>
            Hemo exists because people living with SCD deserve tools designed
            for real life, not ideal conditions.
          </p>
          <p>
            It is built for patients first, with support for caregivers and
            clearer context for clinicians.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;
