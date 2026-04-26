import type { VariantProps } from "class-variance-authority";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WAITLIST_HREF } from "@/lib/site";

type WaitlistCTAButtonProps = {
  label?: string;
  href?: string;
  className?: string;
} & VariantProps<typeof buttonVariants>;

const WaitlistCTAButton = ({
  label = "Join Waitlist",
  href = WAITLIST_HREF,
  className,
  variant = "default",
  size = "default",
}: WaitlistCTAButtonProps) => {
  return (
    <a href={href} className={cn(buttonVariants({ variant, size }), className)}>
      {label}
    </a>
  );
};

export default WaitlistCTAButton;
