import { useMemo, useState } from "react";

import HeroSection from "./components/sections/HeroSection";
import TrustStrip from "./components/sections/TrustStrip";
import WhyHemo from "./components/sections/WhyHemo";
import AppFeatures from "./components/sections/AppFeatures";
import TestimonialsSection from "./components/sections/TestimonialsSection";
import WaitlistCTA from "./components/sections/cta-with-waitlist";

const Homepage = () => {
  return (
    <>
      {/* Hero Section */}
      <HeroSection />

      {/* ── TRUST STRIP ── */}
      <TrustStrip />

      {/* ── WHY CHOOSE HEMO ── */}
      <WhyHemo />

      {/* ── TOP FEATURES (center phone spotlight) ── */}
      <AppFeatures />

      {/* ── TESTIMONIALS ── */}
      <TestimonialsSection />

      {/* ── WAITLIST CTA ── */}
      <WaitlistCTA />
    </>
  );
};

export default Homepage;
