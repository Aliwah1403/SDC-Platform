export type NavItem = {
  label: string;
  href: string;
};

export const WAITLIST_HREF = "/#waitlist";

export const PRIMARY_NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "How It Works", href: "/#story" },
  { label: "Features", href: "/#features" },
  { label: "About", href: "/#about" },
  { label: "Contact", href: "/contact" },
];

export const SECONDARY_NAV_ITEMS: NavItem[] = [
  { label: "FAQ", href: "/#faq" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Medical Disclaimer", href: "/medical-disclaimer" },
];

export const SOCIAL_LINKS: NavItem[] = [
  { label: "Instagram", href: "https://instagram.com" },
  { label: "X", href: "https://x.com" },
  { label: "LinkedIn", href: "https://linkedin.com" },
];
