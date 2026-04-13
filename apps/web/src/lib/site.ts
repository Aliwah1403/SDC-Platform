export type NavItem = {
  label: string;
  href: string;
};

export const WAITLIST_HREF = "/#waitlist";

export const PRIMARY_NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Why Hemo", href: "/why-hemo" },
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "/contact" },
];

export const SECONDARY_NAV_ITEMS: NavItem[] = [
  { label: "FAQ", href: "/faq" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Medical Disclaimer", href: "/medical-disclaimer" },
];
