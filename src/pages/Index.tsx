import Navigation from "../components/Navigation";
import HeroSection from "../components/HeroSection";
import ToothScene from "../components/ToothScene";
import PortfolioSection from "../components/PortfolioSection";
import AboutSection from "../components/AboutSection";
import ContactSection from "../components/ContactSection";
import Footer from "../components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden flex flex-col antialiased">
      <Navigation />
      
      {/* Sötétkék rész: Hero és a 3D fog modell — NoiseOverlay csak AboutSection-ben (kevesebb lag) */}
      <div className="relative">
        <HeroSection />
        <ToothScene />
      </div>

      {/* JAVÍTÁS: Eltávolítottam a felesleges <section> burkolókat, 
          így megszűnnek a duplázott fehér sávok. 
          A '-mt-[1px]' biztosítja a résmentes illesztést a Hero aljához. */}
      <main className="relative z-10 bg-white -mt-[1px]">
        <PortfolioSection />
        <AboutSection />
        <ContactSection />
      </main>

      <Footer />
    </div>
  );
};

export default Index;