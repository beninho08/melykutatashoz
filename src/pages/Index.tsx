import { lazy, Suspense } from "react";
import Navigation from "../components/Navigation";
import HeroSection from "../components/HeroSection";
import PortfolioSection from "../components/PortfolioSection";
import AboutSection from "../components/AboutSection";
import ContactSection from "../components/ContactSection";
import Footer from "../components/Footer";
import TestimonialsSection from "../components/TestimonialsSection";
import NoiseOverlay from "../components/NoiseOverlay";

const ToothScene = lazy(() => import("../components/ToothScene"));

const Index = () => {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden flex flex-col antialiased">
      <Navigation />

      <div className="relative">
        <HeroSection />
        <Suspense fallback={null}>
          <ToothScene />
        </Suspense>
      </div>

      <main className="relative z-10 -mt-[1px] overflow-hidden" style={{ backgroundColor: 'hsl(0, 0%, 97%)' }}>
        {/* Noise a fehér területre */}
        <NoiseOverlay />
        <PortfolioSection />
        <TestimonialsSection />
        <AboutSection />
        <ContactSection />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
