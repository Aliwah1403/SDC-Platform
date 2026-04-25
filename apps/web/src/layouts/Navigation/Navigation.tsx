import { useState } from "react";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";

const NAV_ITEMS = [
  { name: "Features", link: "/features" },
  { name: "About", link: "/why-hemo" },
  { name: "Pricing", link: "/pricing" },
  { name: "Contact", link: "/contact" },
];

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header>
      <Navbar>
        <NavBody>
          <NavbarLogo />
          <NavItems items={NAV_ITEMS} />
          <div className="flex items-center gap-4">
            {/* <NavbarButton variant="secondary">Login</NavbarButton> */}
            <NavbarButton variant="dark" href="/#waitlist">Join the waitlist</NavbarButton>
          </div>
        </NavBody>

        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {NAV_ITEMS.map((item) => (
              <a
                key={item.name}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-neutral-600"
              >
                {item.name}
              </a>
            ))}
            <div className="flex w-full flex-col gap-3">
              {/* <NavbarButton variant="secondary" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                Login
              </NavbarButton> */}
              <NavbarButton
                variant="primary"
                href="/#waitlist"
                className="w-full"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Join the waitlist
              </NavbarButton>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
    </header>
  );
};

export default Navigation;
