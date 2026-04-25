const LOGOS = ["Evernote", "Airtable", "Notion", "Gumroad", "Amazon"] as const;

const TrustLogoSection = () => {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
      <p className="text-center text-sm text-muted-foreground">
        Trusted by teams and communities worldwide
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm font-semibold text-muted-foreground/60">
        {LOGOS.map((logo) => (
          <span key={logo}>{logo}</span>
        ))}
      </div>
    </section>
  );
};

export default TrustLogoSection;
