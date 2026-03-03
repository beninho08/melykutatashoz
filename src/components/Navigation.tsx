import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.png';

const Navigation = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isInDarkSection, setIsInDarkSection] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const isBridgePage = location.pathname === '/hidmunka';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      const sections = document.querySelectorAll('section');
      const navY = 80;
      let inDark = true;
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= navY && rect.bottom > navY) {
          inDark = section.classList.contains('section-dark');
        }
      });
      setIsInDarkSection(inDark);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const textColor = (isInDarkSection && !isBridgePage) ? 'text-white' : 'text-slate-900';
  const mutedColor = (isInDarkSection && !isBridgePage) ? 'text-white/60 hover:text-white' : 'text-slate-600 hover:text-slate-900';
  const bgClass = scrolled || isBridgePage ? (isInDarkSection && !isBridgePage ? 'bg-[#0a1124]/80 backdrop-blur-md' : 'bg-white/80 backdrop-blur-md') : 'bg-transparent';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${bgClass}`}>
      {/* JAVÍTÁS: py-4 - a korábbi py-8 helyett, hogy közelebb kerüljön a tartalomhoz */}
      <div className="w-full px-6 md:px-10 py-4 flex items-center justify-between">
        
        <div className="flex items-center">
          <a href="/" className={`flex items-center text-3xl md:text-4xl font-bold tracking-tighter transition-colors duration-500 ${textColor}`}>
            <span>dent</span>
            <motion.img 
              src={logo} 
              alt="Á" 
              className="h-10 md:h-14 w-auto mx-1 -translate-y-1.5 md:-translate-y-2"
              style={{ filter: (isInDarkSection && !isBridgePage) ? 'brightness(0) invert(1)' : 'brightness(0)' }}
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              whileHover={{ scale: 1.1, rotate: 5 }}
            />
            <span>l2020</span>
          </a>
        </div>

        <div className="hidden md:flex items-center gap-10">
          {!isBridgePage && ['Portfólió', 'Rólam', 'Kapcsolat'].map((item) => (
            <a
              key={item}
              href={`/#${item === 'Portfólió' ? 'portfolio' : item === 'Rólam' ? 'about' : 'contact'}`}
              className={`text-[10px] font-semibold tracking-[0.3em] uppercase transition-colors duration-500 ${mutedColor}`}
            >
              {item}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;