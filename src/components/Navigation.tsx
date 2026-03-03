import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import logo from '@/assets/logo.png';

/**
 * Navigation
 *
 * Navbar szín logika:
 *  - A hero section-nek van section-dark class-a és id="hero"
 *  - Amíg a #hero elem látható a viewport tetején → fehér szöveg, transparent háttér
 *  - Ha elhagyjuk a sötét szekciót → sötét szöveg, világos háttér
 *
 * FONTOS: NEM scrollY > 50 alapú!
 *  A Lenis smooth scroll + GSAP pin megváltoztatja a valódi scrollY értékét,
 *  ezért section class alapú detekciót használunk.
 */
const Navigation = () => {
  const [isDark, setIsDark] = useState(true);
  const location  = useLocation();
  const isBridge  = location.pathname === '/hidmunka';

  const checkSection = useCallback(() => {
    // 1. Mindig nézzük a #hero elemet először (leggyakoribb eset)
    const hero = document.getElementById('hero');
    if (hero) {
      const rect = hero.getBoundingClientRect();
      // Hero teteje még a viewport-ban (akár sticky, akár normál)
      // rect.top <= 64 (navbar magassága) ÉS rect.bottom > 64
      if (rect.top <= 64 && rect.bottom > 64) {
        setIsDark(true);
        return;
      }
      // Ha a hero teljesen a viewport felett van, már nem sötét
      if (rect.bottom <= 0) {
        // De lehet más sötét section is alatta
      }
    }

    // 2. Általános section scan
    const navMidY  = 64;
    let   found    = false;
    const sections = document.querySelectorAll('section');

    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= navMidY && rect.bottom > navMidY) {
        found = true;
        setIsDark(section.classList.contains('section-dark'));
      }
    });

    // 3. Ha semmilyen section nem fedi a navbart (pl. közte van valami)
    if (!found) {
      // Ha a hero teljesen felett van, valószínűleg világos section következik
      if (hero) {
        const rect = hero.getBoundingClientRect();
        setIsDark(rect.bottom > 64); // ha még részben látszik, sötét
      }
    }
  }, []);

  useEffect(() => {
    // Első futás
    checkSection();

    // Scroll eventi: mindkét típus (Lenis és natív)
    window.addEventListener('scroll',   checkSection, { passive: true });
    document.addEventListener('scroll', checkSection, { passive: true });

    return () => {
      window.removeEventListener('scroll',   checkSection);
      document.removeEventListener('scroll', checkSection);
    };
  }, [checkSection]);

  // Bridge oldalon mindig világos
  const dark = isDark && !isBridge;

  const textColor  = dark ? 'text-white'                             : 'text-slate-900';
  const mutedColor = dark ? 'text-white/60 hover:text-white'         : 'text-slate-600 hover:text-slate-900';
  const bgClass    = dark ? 'bg-transparent'                         : 'bg-[hsl(0,0%,97%)]/90 backdrop-blur-md';

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${bgClass}`}
    >
      <div className="w-full px-6 md:px-10 py-4 flex items-center justify-between">

        {/* Logo */}
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
                filter: dark ? 'brightness(0) invert(1)' : 'brightness(0)',
                transition: 'filter 0.5s ease',
              }}
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              whileHover={{ scale: 1.1, rotate: 5 }}
            />
            <span>l2020</span>
          </a>
        </div>

        {/* Nav linkek */}
        <div className="hidden md:flex items-center gap-10">
          {!isBridge &&
            ['Portfólió', 'Rólam', 'Kapcsolat'].map((item) => (
              <a
                key={item}
                href={`/#${
                  item === 'Portfólió' ? 'portfolio'
                  : item === 'Rólam'   ? 'about'
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
