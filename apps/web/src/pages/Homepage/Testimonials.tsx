import { Marquee } from "@/components/ui/marquee";

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
  {
    quote: "I used to dread appointments. Now I actually feel prepared.",
    name: "Chisom A.",
    role: "Living with SCD",
  },
  {
    quote:
      "My daughter's care team finally understands what her weeks look like.",
    name: "Rachel B.",
    role: "Caregiver",
  },
  {
    quote: "The pattern data made it easier to adjust her hydroxyurea dosage.",
    name: "Dr. K. Mensah",
    role: "Paediatric Haematologist",
  },
] as const;

const TestimonialItem = ({
  quote,
  name,
  role,
}: (typeof TESTIMONIALS)[number]) => (
  <figure className="w-[340px] shrink-0 py-2 pr-12">
    <blockquote className="text-xl font-medium leading-snug tracking-[-0.01em]">
      "{quote}"
    </blockquote>
    <figcaption className="mt-4 text-sm text-muted-foreground">
      <span className="font-semibold text-foreground">{name}</span> · {role}
    </figcaption>
  </figure>
);

const Testimonials = () => {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Testimonials
        </p>
        <h2 className="mt-2 max-w-xl text-balance text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
          What people are saying.
        </h2>
      </div>

      <div className="relative mt-10 overflow-hidden">
        {/* Edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-linear-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-linear-to-l from-background to-transparent" />

        <Marquee
          pauseOnHover
          repeat={3}
          className="[--duration:50s] [--gap:0rem] py-4"
        >
          {TESTIMONIALS.map((t) => (
            <TestimonialItem key={t.name} {...t} />
          ))}
        </Marquee>
      </div>
    </section>
  );
};

export default Testimonials;
