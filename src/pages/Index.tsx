import Navigation from "../components/Navigation";
import GlobOrb from "../components/GlobOrb";
import HeroSection from "../components/HeroSection";
import PortfolioSection from "../components/PortfolioSection";
import AboutSection from "../components/AboutSection";
import ContactSection from "../components/ContactSection";
import Footer from "../components/Footer";
import TestimonialsSection from "../components/TestimonialsSection";
import NoiseOverlay from "../components/NoiseOverlay";

const Index = () => {
  return (
    <div className="antialiased">
      <Navigation />

      {/* z-index: 20, pointer-events: none — mindent átlát de nem blokkol */}
      <GlobOrb />

      <section
        id="hero"
        className="section-dark"
        style={{
          backgroundColor: '#0a1628',
          minHeight:        '100vh',
          position:         'relative',
          zIndex:           1,
        }}
      >
        <HeroSection />
      </section>

      <section
        id="portfolio"
        className="section-light"
        style={{
          backgroundColor: 'hsl(0, 0%, 97%)',
          position:         'relative',
          zIndex:           1,
        }}
      >
        <NoiseOverlay />
        <PortfolioSection />
      </section>

      <section
        id="testimonials"
        className="section-light"
        style={{
          backgroundColor: 'hsl(0, 0%, 97%)',
          position:         'relative',
          zIndex:           1,
        }}
      >
        <TestimonialsSection />
      </section>

      <section
        id="about"
        className="section-light"
        style={{
          backgroundColor: 'hsl(0, 0%, 97%)',
          position:         'relative',
          zIndex:           1,
        }}
      >
        <AboutSection />
      </section>

      <section
        id="contact"
        className="section-light"
        style={{
          backgroundColor: 'hsl(0, 0%, 97%)',
          position:         'relative',
          zIndex:           1,
        }}
      >
        <ContactSection />
      </section>

      <Footer />
    </div>
  );
};

export default Index;
