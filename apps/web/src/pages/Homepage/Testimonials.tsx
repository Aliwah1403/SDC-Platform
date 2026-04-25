const TESTIMONIALS = [
  {
    quote: "For the first time, I walked into my appointment with answers.",
    name: "Amara O.",
    role: "Living with SCD",
  },
  {
    quote:
      "We finally had one clear place for meds, symptoms, and appointments.",
    name: "Jordan T.",
    role: "Caregiver",
  },
  {
    quote: "Structured logs changed the quality of our clinic conversations.",
    name: "Dr. M. Osei",
    role: "Haematology Consultant",
  },
] as const;

const Testimonials = () => {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-5 lg:grid-cols-3">
        {TESTIMONIALS.map((item) => (
          <figure key={item.name} className="py-2">
            <blockquote className="text-2xl font-medium leading-tight tracking-[-0.01em]">
              “{item.quote}”
            </blockquote>
            <figcaption className="mt-5 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{item.name}</span>{" "}
              · {item.role}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;
