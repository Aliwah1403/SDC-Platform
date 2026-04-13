import { Menu } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import WaitlistCTAButton from "@/components/WaitlistCTAButton";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PRIMARY_NAV_ITEMS } from "@/lib/site";
import { cn } from "@/lib/utils";

interface Navbar22Props {
  className?: string;
}

const Navbar22 = ({ className }: Navbar22Props) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className={cn("py-3", className)}>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
              H
            </div>
            <span className="text-lg font-semibold tracking-tight">Hemo</span>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            {PRIMARY_NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="hidden lg:flex">
            <WaitlistCTAButton className="rounded-full px-6" />
          </div>

          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-muted-foreground"
                  />
                }
              >
                <Menu />
                <span className="sr-only">Open menu</span>
              </SheetTrigger>
              <SheetContent side="top" className="h-screen">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <div className="m-4 flex flex-col gap-6">
                  <Link
                    to="/"
                    className="ml-3 flex items-center gap-2"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                      H
                    </div>
                    <span className="text-lg font-semibold tracking-tight">
                      Hemo
                    </span>
                  </Link>

                  <div className="flex flex-col gap-2">
                    {PRIMARY_NAV_ITEMS.map((item) => (
                      <a
                        key={item.label}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="rounded-lg px-4 py-2 text-lg font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>

                  <div className="border-t pt-6">
                    <WaitlistCTAButton
                      className="w-full justify-center rounded-full"
                      size="lg"
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    </section>
  );
};

export { Navbar22 };
