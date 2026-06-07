import { motion } from "framer-motion";

function LockIllustration(props: React.ComponentPropsWithoutRef<"svg">) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 58 66" fill="none" {...props}>
      <path
        d="M14 28V20C14 12.268 20.268 6 28 6h2C37.732 6 44 12.268 44 20v8"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <rect x="7" y="28" width="44" height="32" rx="8" fill="currentColor" />
      <circle cx="29" cy="42" r="5" fill="white" opacity="0.9" />
      <rect x="27" y="45" width="4" height="7" rx="2" fill="white" opacity="0.9" />
    </svg>
  );
}

type Variant = "loading" | "expired" | "unavailable";

const CONTENT: Record<Exclude<Variant, "loading">, { heading: string; sub: string }> = {
  expired: {
    heading: "This link has expired",
    sub: "Export links are only valid for a limited time. Ask the person who shared this to generate a new one from the Hemo app.",
  },
  unavailable: {
    heading: "This link is no longer available",
    sub: "It may have been revoked by the owner. Contact the person who shared it for an updated link.",
  },
};

export default function LinkGateScreen({ variant, sub }: { variant: Variant; sub?: string }) {
  if (variant === "loading") {
    return (
      <div className="min-h-screen bg-[#F8F4F0] flex items-center justify-center px-6">
        <div className="relative flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-[3px] border-[#A9334D]/15 border-t-[#A9334D] animate-spin" />
          <img src="/logo.png" alt="Hemo" className="h-12 w-12 relative z-10" />
        </div>
      </div>
    );
  }

  const { heading, sub: defaultSub } = CONTENT[variant];

  return (
    <div className="min-h-screen bg-[#F8F4F0] flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center text-center"
      >
        <a href="/" className="mb-10"><img src="/logo.png" alt="Hemo" className="h-9 w-9" /></a>

        <LockIllustration className="w-32 h-32 text-[#A9334D] opacity-10 sm:w-40 sm:h-40" />

        <h1 className="mt-8 max-w-sm text-balance text-4xl font-semibold tracking-[-0.03em] text-[#1A1A1A] sm:text-5xl">
          {heading}
        </h1>

        <p className="mt-4 max-w-sm text-pretty text-base text-muted-foreground">
          {sub ?? defaultSub}
        </p>

        <a
          href="/"
          className="mt-10 inline-flex items-center justify-center px-6 py-3 bg-[#A9334D] hover:bg-[#8a2940] text-white font-semibold rounded-xl transition-colors text-base"
        >
          Visit hemo-scd.com
        </a>
      </motion.div>
    </div>
  );
}
