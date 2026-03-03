import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import logo from '@/assets/logo.png';

const Navigation = () => {
  const [isInDarkSection, setIsInDarkSection] = useState(true);
  const location = useLocation();
  const isBridgePage = location.pathname === '/hidmunka';

  useEffect(() => {
    const handleScroll = () => {
      // A hero section magassága = 100vh, amíg benne vagyunk sötét
      // A pin miatt NE scrollY > 50-et nézzük, hanem a section class-t
      const sections = document.querySelectorAll('section');
      const navY = 64; // navbar magassága közepe
      let inDark = true;

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= navY && rect.bottom > navY) {
          inDark = section.classList.contains('section-dark');
        }
      });

      // Ha egyik section sem fedi a navbart, maradjon az utolsó állapot
      // (pl. ha a hero még látható)
      const heroSection = document.querySelector('#hero');
      if (heroSection) {
        const heroRect = heroSection.getBoundingClientRect();
        // Hero teteje még látható (pin esetén is)
        if (heroRect.top <= 0 && heroRect.bottom > navY) {
          inDark = true;
        }
      }

      setIsInDarkSection(inDark);
    };

    // Első futás
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Lenis-szel is szükséges lehet
    document.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const isDark = isInDarkSection && !isBridgePage;
  const textColor  = isDark ? 'text-white' : 'text-slate-900';
  const mutedColor = isDark ? 'text-white/60 hover:text-white' : 'text-slate-600 hover:text-slate-900';

  // Navbar háttér: csak akkor kap hátteret ha NEM a sötét hero tetején vagyunk
  // Nem scrollY-alapú, hanem section-alapú!
  const bgClass = isDark
    ? 'bg-transparent'
    : 'bg-[hsl(0,0%,97%)]/90 backdrop-blur-md';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${bgClass}`}>
      <div className="w-full px-6 md:px-10 py-4 flex items-center justify-between">

        <div className="flex items-center">
          <a
            href="/"
            className={`flex items-center text-3xl md:text-4xl font-bold tracking-tighter transition-colors duration-500 ${textColor}`}
          >
            <span>dent</span>
            <motion.img
              src={logo}
              alt="Á"
              className="h-10 md:h-14 w-auto mx-1 -translate-y-1.5 md:-translate-y-2"
              style={{
                filter: isDark ? 'brightness(0) invert(1)' : 'brightness(0)',
              }}
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              whileHover={{ scale: 1.1, rotate: 5 }}
            />
            <span>l2020</span>
          </a>
        </div>

        <div className="hidden md:flex items-center gap-10">
          {!isBridgePage &&
            ['Portfólió', 'Rólam', 'Kapcsolat'].map((item) => (
              <a
                key={item}
                href={`/#${
                  item === 'Portfólió'
                    ? 'portfolio'
                    : item === 'Rólam'
                    ? 'about'
                    : 'contact'
                }`}
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
