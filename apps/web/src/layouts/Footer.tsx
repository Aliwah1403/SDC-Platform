import { SECONDARY_NAV_ITEMS, SOCIAL_LINKS } from "@/lib/site";

const Footer = () => {
  return (
    <footer className="border-t bg-card/70">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.3fr_1fr_1fr] lg:px-8">
        <div>
          <p className="text-lg font-semibold text-foreground">Hemo</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
            A calmer way to track Sickle Cell day to day, prepare for clinic visits,
            and keep emergency details close when timing matters.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">Email: hello@hemo.health</p>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Hemo</p>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground">Social</p>
          <div className="space-y-2 text-sm">
            {SOCIAL_LINKS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="block text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground">Legal</p>
          <div className="space-y-2 text-sm">
            {SECONDARY_NAV_ITEMS.map((item) => (
              <a key={item.label} href={item.href} className="block text-muted-foreground transition-colors hover:text-foreground">
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
