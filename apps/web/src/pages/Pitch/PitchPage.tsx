import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePostHog } from "@posthog/react";
import PitchToolbar from "./PitchToolbar";
import SlideStart from "./slides/SlideStart";
import SlideProblem from "./slides/SlideProblem";
import SlideSolution from "./slides/SlideSolution";
import SlideDemo from "./slides/SlideDemo";
import SlideSummary from "./slides/SlideSummary";
import SlideVision from "./slides/SlideVision";
import SlideWaitlist from "./slides/SlideWaitlist";

const SLIDES = [
  SlideStart,
  SlideProblem,
  SlideSolution,
  SlideDemo,
  SlideSummary,
  SlideVision,
  SlideWaitlist,
];

const SWIPE_THRESHOLD = 60;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
};

export default function PitchPage() {
  const [[current, direction], setSlide] = useState<[number, number]>([0, 0]);
  const touchStartX = useRef<number | null>(null);
  const posthog = usePostHog();

  useEffect(() => {
    document.title = "Hemo — Pitch";
  }, []);

  const goTo = (next: number) => {
    if (next < 0 || next >= SLIDES.length) return;
    setSlide(([prev]) => {
      posthog?.capture("pitch_slide_viewed", { slide_index: next, from_index: prev });
      return [next, next > prev ? 1 : -1];
    });
  };

  const goNext = () => goTo(current + 1);
  const goPrev = () => goTo(current - 1);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (deltaX <= -SWIPE_THRESHOLD) goNext();
    else if (deltaX >= SWIPE_THRESHOLD) goPrev();
    touchStartX.current = null;
  };

  const Slide = SLIDES[current];

  return (
    <div className="dark h-screen w-screen overflow-hidden bg-background text-foreground">
      <div
        className="relative h-full w-full"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={current}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 overflow-y-auto pb-20"
          >
            <Slide />
          </motion.div>
        </AnimatePresence>
      </div>

      <PitchToolbar
        current={current}
        total={SLIDES.length}
        onPrev={goPrev}
        onNext={goNext}
      />
    </div>
  );
}
