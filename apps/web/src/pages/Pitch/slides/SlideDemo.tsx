import { motion } from "framer-motion";
import { Iphone } from "@/components/ui/iphone";
import HomeScreen from "@/assets/screenshots/home-screen.webp";

// Drop a recorded clip here once it exists (an .mp4 download link — not the
// .m3u8 manifest, which plain <video> can't parse without hls.js). Falls back
// to a static screenshot until then.
const DEMO_VIDEO_SRC = "";

const SlideDemo = () => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-6">
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-xs font-semibold uppercase tracking-[0.2em] text-primary"
      >
        Demo
      </motion.p>
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-foreground sm:text-4xl"
      >
        See it in action
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="mt-10"
      >
        <Iphone
          className="w-56 sm:w-64"
          videoSrc={DEMO_VIDEO_SRC || undefined}
          src={DEMO_VIDEO_SRC ? undefined : HomeScreen}
          alt="Hemo app walkthrough"
        />
      </motion.div>
    </div>
  );
};

export default SlideDemo;
