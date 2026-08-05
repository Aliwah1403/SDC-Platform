import type { ComponentProps, ElementType, ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandReddit,
  IconBrandTiktok,
} from "@tabler/icons-react";

type FooterLink = {
  title: string;
  href: string;
  icon?: ElementType<{ className?: string }>;
  target?: "_blank";
};

const footerLinks: { label: string; links: FooterLink[] }[] = [
  {
    label: "Product",
    links: [
      { title: "Features", href: "/features" },
      { title: "Sickle Cell Tracking App", href: "/sickle-cell-tracking-app" },
      // { title: "Pricing", href: "#pricing" },
      // { title: "Testimonials", href: "#testimonials" },
      // { title: "Integration", href: "/" },
    ],
  },
  {
    label: "Company",
    links: [
      { title: "FAQs", href: "/#faq" },
      { title: "About Us", href: "/why-hemo" },
      { title: "Privacy Policy", href: "/privacy" },
      { title: "Terms of Services", href: "/terms" },
    ],
  },
  {
    label: "Resources",
    links: [
      { title: "Blog", href: "/blog" },
      // { title: "Changelog", href: "/changelog" },
      // { title: "Brand", href: "/brand" },
      // { title: "Help", href: "/help" },
    ],
  },
  {
    label: "Social Links",
    links: [
      {
        title: "Instagram",
        href: "https://www.instagram.com/hemo_scd",
        icon: IconBrandInstagram,
        target: "_blank",
      },
      {
        title: "Facebook",
        href: "https://www.facebook.com/share/14iFB26nd8n/?mibextid=wwXIfr",
        icon: IconBrandFacebook,
        target: "_blank",
      },
      {
        title: "Reddit",
        href: "https://www.reddit.com/u/Hemo_scd/s/NzxLV3Eafi",
        icon: IconBrandReddit,
        target: "_blank",
      },
      {
        title: "TikTok",
        href: "https://www.tiktok.com/@hemo_scd?_r=1&_t=ZS-970VFv4yGQ9",
        icon: IconBrandTiktok,
        target: "_blank",
      },
    ],
  },
];

const Footer = () => {
  return (
    <footer className="md:rounded-t-6xl relative w-full max-w-7xl mx-auto flex flex-col items-center justify-center rounded-t-4xl border-t bg-[radial-gradient(35%_128px_at_50%_0%,theme(backgroundColor.white/8%),transparent)] px-6 py-12 lg:py-16">
      <div className="bg-foreground/20 absolute top-0 right-1/2 left-1/2 h-px w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur" />

      <div className="grid w-full gap-8 xl:grid-cols-3 xl:gap-8">
        <AnimatedContainer className="space-y-4">
          <a href="/">
            <img src="/logo.png" alt="Hemo" className="size-15" />
          </a>
          <p className="text-muted-foreground mt-8 text-sm md:mt-0">
            © {new Date().getFullYear()} Hemo SCD. All rights reserved.
          </p>
        </AnimatedContainer>

        <div className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-4 xl:col-span-2 xl:mt-0">
          {footerLinks.map((section, index) => (
            <AnimatedContainer key={section.label} delay={0.1 + index * 0.1}>
              <div className="mb-10 md:mb-0">
                <h3 className="text-xs">{section.label}</h3>
                <ul className="text-muted-foreground mt-4 space-y-2 text-sm">
                  {section.links.map((link) => (
                    <li key={link.title}>
                      <a
                        href={link.href}
                        target={link.target}
                        rel={
                          link.target === "_blank"
                            ? "noopener noreferrer"
                            : undefined
                        }
                        className="hover:text-[#A9334D] inline-flex items-center transition-all duration-300"
                      >
                        {link.icon && <link.icon className="me-1 size-4" />}
                        {link.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedContainer>
          ))}
        </div>
      </div>
    </footer>
  );
};

type ViewAnimationProps = {
  delay?: number;
  className?: ComponentProps<typeof motion.div>["className"];
  children: ReactNode;
};

function AnimatedContainer({
  className,
  delay = 0.1,
  children,
}: ViewAnimationProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return children;
  }

  return (
    <motion.div
      initial={{ filter: "blur(4px)", translateY: -8, opacity: 0 }}
      whileInView={{ filter: "blur(0px)", translateY: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default Footer;
