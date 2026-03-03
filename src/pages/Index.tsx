import Navigation from "../components/Navigation";
import HeroSection from "../components/HeroSection";
import ToothScene from "../components/ToothScene";
import PortfolioSection from "../components/PortfolioSection";
import AboutSection from "../components/AboutSection";
import ContactSection from "../components/ContactSection";
import Footer from "../components/Footer";
import TestimonialsSection from "../components/TestimonialsSection";
import NoiseOverlay from "../components/NoiseOverlay";

const Index = () => {
  return (
    <div className="overflow-x-hidden antialiased" style={{ backgroundColor: 'hsl(0, 0%, 97%)' }}>
      <Navigation />
      <HeroSection />
      <ToothScene />
      <main className="relative overflow-hidden" style={{ backgroundColor: 'hsl(0, 0%, 97%)' }}>
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
