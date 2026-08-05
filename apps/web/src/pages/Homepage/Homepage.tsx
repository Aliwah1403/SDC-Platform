import HeroSection from "./HeroSection";
import TrustLogoSection from "./TrustLogoSection";
import AppFeatures from "./AppFeatures";
import WaitlistCTA from "./WaitlistCTA";
import FaqSection from "./FaqSection";
// import PricingSection from "./PricingSection";
import Benefits from "./Benefits";

// Homepage JSON-LD (SoftwareApplication + FAQPage) is emitted once, by the
// route wrapper (app/routes/home.tsx), which imports the same FAQ data used
// by <FaqSection /> below. Do not add a second copy here — see SEO-PLAN.md
// Phase 2 for why the duplicate was removed.
const Homepage = () => {
  return (
    <div className="relative page-grid-lines overflow-hidden">
      <HeroSection />
      <TrustLogoSection />
      <AppFeatures />
      <Benefits />
      {/* <Testimonials /> */}
      {/* <PricingSection /> */}
      <FaqSection />
      <WaitlistCTA />
    </div>
  );
};

export default Homepage;
