import { motion } from "framer-motion";

import WaitlistCTAButton from "@/components/WaitlistCTAButton";
import { Iphone } from "@/components/ui/iphone";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AvatarGroup } from "@/components/avatar-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Center phone animates in first, sides fan out after with a slight delay
const PHONES = [
  { x: -290, scale: 0.8, delay: 0.45, zIndex: 1, src: undefined },
  { x: 0,    scale: 1,   delay: 0.2,  zIndex: 3, src: undefined },
  { x: 290,  scale: 0.8, delay: 0.45, zIndex: 1, src: undefined },
] satisfies { x: number; scale: number; delay: number; zIndex: number; src: string | undefined }[];

const HeroSection = () => {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-12 pt-18 text-center sm:px-6 lg:px-8 lg:pt-24">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Badge variant="secondary" className="px-3 py-1 text-xs">
          Built for Sickle Cell Disease
        </Badge>

        <h1 className="mx-auto mt-6 max-w-4xl text-balance text-5xl font-semibold tracking-[-0.03em] sm:text-6xl lg:text-7xl">
          Stop piecing together symptoms from memory.
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          Hemo helps people living with Sickle Cell Disease log daily symptoms,
          spot patterns over time, and show up to every appointment with the
          health context their care team actually needs.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <WaitlistCTAButton
            label="Join the waitlist — it's free"
            size="lg"
            className="px-8"
          />
          <Button
            variant="outline"
            size="lg"
            className="px-8"
            render={<a href="#story" />}
          >
            See how it works
          </Button>
        </div>

        <div className="mt-4 flex flex-row items-center justify-center gap-2">
          <AvatarGroup animate>
            <Avatar size="sm">
              <AvatarImage src="https://github.com/haydenbleasel.png" />
              <AvatarFallback>HB</AvatarFallback>
            </Avatar>
            <Avatar size="sm">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <Avatar size="sm">
              <AvatarImage src="https://github.com/JugglerX.png" />
              <AvatarFallback>LR</AvatarFallback>
            </Avatar>
            <Avatar size="sm">
              <AvatarImage src="https://github.com/zerostaticthemes.png" />
              <AvatarFallback>SC</AvatarFallback>
            </Avatar>
          </AvatarGroup>
          <p className="text-sm text-muted-foreground">
            Join 1,200+ people with Sickle Cell Disease already waiting
          </p>
        </div>
      </motion.div>

      {/* Phone carousel — center fans out first, sides follow */}
      <div className="relative mt-16 flex h-[520px] items-end justify-center sm:h-[640px]">
        {PHONES.map((phone, idx) => (
          <motion.div
            key={idx}
            className="absolute w-[260px] sm:w-[320px]"
            style={{ zIndex: phone.zIndex }}
            initial={{ x: 0, scale: 0.5, opacity: 0 }}
            animate={{ x: phone.x, scale: phone.scale, opacity: 1 }}
            transition={{
              duration: 0.65,
              delay: phone.delay,
              ease: [0.215, 0.61, 0.355, 1],
            }}
          >
            <Iphone className="w-full" src={phone.src} />
          </motion.div>
        ))}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </div>
    </section>
  );
};

export default HeroSection;
