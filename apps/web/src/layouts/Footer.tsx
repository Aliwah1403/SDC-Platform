import { Link } from "react-router";

import { PRIMARY_NAV_ITEMS, SECONDARY_NAV_ITEMS } from "@/lib/site";

const Footer = () => {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 text-sm sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
              H
            </div>
            <p className="font-medium text-foreground">Hemo</p>
          </div>
          <p className="max-w-sm text-muted-foreground">
            A daily companion for people living with Sickle Cell Disease to log,
            track, and show up prepared for care.
          </p>
          <p className="text-muted-foreground">
            © {new Date().getFullYear()} Hemo. All rights reserved.
          </p>
        </div>

        <div>
          <p className="mb-3 font-semibold text-foreground">Explore</p>
          <div className="space-y-2">
            {PRIMARY_NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="block text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-3 font-semibold text-foreground">Legal & Help</p>
          <div className="space-y-2">
            {SECONDARY_NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="block text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
