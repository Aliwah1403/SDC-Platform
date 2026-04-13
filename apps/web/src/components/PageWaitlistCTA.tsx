import WaitlistCTAButton from "@/components/WaitlistCTAButton";

type PageWaitlistCTAProps = {
  title: string;
  description: string;
};

const PageWaitlistCTA = ({ title, description }: PageWaitlistCTAProps) => {
  return (
    <section className="mx-auto mt-16 w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="grid-lines rounded-3xl border bg-card p-8 text-center shadow-sm sm:p-12">
        <h2 className="mx-auto max-w-3xl text-balance text-3xl font-bold sm:text-4xl">
          {title}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{description}</p>
        <div className="mt-7 flex justify-center">
          <WaitlistCTAButton size="lg" className="rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default PageWaitlistCTA;
