import { Menu } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface Navbar22Props {
  className?: string;
  onJoinWaitlistClick?: () => void;
}

const navLinks = [
  { name: "Features", href: "#features" },
  { name: "Why Hemo", href: "#impact" },
  { name: "Stories", href: "#testimonials" },
];

const Navbar22 = ({ className, onJoinWaitlistClick }: Navbar22Props) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className={cn("py-4", className)}>
      <div className="container">
        <nav className="w-full">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">

              {/* Logo */}
              <a href="/" className="flex items-center gap-2">
                <div className="size-8 rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold text-sm">
                  H
                </div>
                <span className="text-lg font-semibold tracking-tighter">
                  Hemo
                </span>
              </a>

              {/* Desktop nav links */}
              <div className="hidden items-center gap-8 md:flex">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    className="group relative inline-block h-6 overflow-hidden text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    <span className="block transition-transform duration-300 group-hover:-translate-y-full">
                      {link.name}
                    </span>
                    <span className="absolute left-0 block w-full border-primary transition-transform duration-300 group-hover:translate-y-[-100%] group-hover:border-b">
                      {link.name}
                    </span>
                  </a>
                ))}
              </div>

              {/* Desktop CTA */}
              <div className="hidden items-center lg:flex">
                <Button onClick={onJoinWaitlistClick}>
                  Join the Waitlist
                </Button>
              </div>

              {/* Mobile menu */}
              <div className="md:hidden">
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                  <SheetTrigger
                    render={
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-muted-foreground hover:bg-muted hover:text-foreground"
                      />
                    }
                  >
                    <Menu />
                    <span className="sr-only">Open menu</span>
                  </SheetTrigger>
                  <SheetContent side="top" className="h-screen">
                    <SheetTitle className="sr-only">Navigation</SheetTitle>
                    <div className="m-4 flex flex-col gap-6">
                      <a
                        href="/"
                        className="ml-3 flex items-center gap-2"
                        onClick={() => setIsOpen(false)}
                      >
                        <div className="size-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-semibold">
                          H
                        </div>
                        <span className="text-lg font-semibold tracking-tighter">
                          Hemo
                        </span>
                      </a>

                      <div className="flex flex-col gap-4">
                        {navLinks.map((link) => (
                          <a
                            key={link.name}
                            href={link.href}
                            onClick={() => setIsOpen(false)}
                            className="rounded-lg px-4 py-2 text-lg font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            {link.name}
                          </a>
                        ))}
                      </div>

                      <div className="border-t border-border pt-6">
                        <Button
                          className="w-full"
                          onClick={() => {
                            setIsOpen(false);
                            onJoinWaitlistClick?.();
                          }}
                        >
                          Join the Waitlist
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

            </div>
          </div>
        </nav>
      </div>
    </section>
  );
};

export { Navbar22 };
