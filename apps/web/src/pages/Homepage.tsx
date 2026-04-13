import AppFeatures from "./components/sections/AppFeatures";
import HabitRewards from "./components/sections/HabitRewards";
import HeroSection from "./components/sections/HeroSection";
import HowItWorks from "./components/sections/HowItWorks";
import TestimonialsSection from "./components/sections/TestimonialsSection";
import TrustStrip from "./components/sections/TrustStrip";
import WaitlistCTA from "./components/sections/cta-with-waitlist";
import WhyHemo from "./components/sections/WhyHemo";

const Homepage = () => {
  return (
    <>
      <HeroSection />
      <TrustStrip />
      <HowItWorks />
      <WhyHemo />
      <AppFeatures />
      <HabitRewards />
      <TestimonialsSection />
      <WaitlistCTA source="home-page" />
    </>
  );
};

export default Homepage;
