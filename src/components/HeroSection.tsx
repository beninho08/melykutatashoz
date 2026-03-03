import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useRef } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import NoiseOverlay from './NoiseOverlay';

function MaskReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const reduced = useReducedMotion();
  return (
    <div style={{ overflow: 'hidden', display: 'block' }}>
      <motion.div
        initial={{ y: reduced ? '0%' : '108%', rotateX: reduced ? 0 : 8 }}
        animate={{ y: '0%', rotateX: 0 }}
        transition={
          reduced
            ? { duration: 0 }
            : { type: 'spring', stiffness: 52, damping: 16, delay }
        }
        style={{ transformOrigin: 'bottom center' }}
      >
        {children}
      </motion.div>
    </div>
  );
}

function MagneticLink({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const springX = useSpring(mx, { stiffness: 180, damping: 16, mass: 0.6 });
  const springY = useSpring(my, { stiffness: 180, damping: 16, mass: 0.6 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((e.clientX - (rect.left + rect.width / 2)) * 0.32);
    my.set((e.clientY - (rect.top + rect.height / 2)) * 0.32);
  };

  return (
    <motion.a
      ref={ref}
      href={href}
      style={{ x: springX, y: springY, display: 'inline-flex' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { mx.set(0); my.set(0); }}
      whileHover={{ scale: 1.06 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className={className}
    >
      {children}
    </motion.a>
  );
}

const HeroSection = () => {
  const reduced = useReducedMotion();

  return (
    <section className="section-dark relative min-h-screen flex items-start overflow-hidden">
      <NoiseOverlay />

      <div className="w-full px-8 md:px-16 lg:px-24 pt-28 md:pt-36 pb-20 relative z-20 pointer-events-none">
        <div className="max-w-4xl pointer-events-auto">

          <MaskReveal delay={0.15}>
            <p className="section-muted text-[10px] tracking-[0.4em] uppercase mb-6 font-medium">
              Prémium Fogtechnika
            </p>
          </MaskReveal>

          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[1.05] mb-6 text-white">
            <MaskReveal delay={0.32}>
              <span className="block">Precizitás</span>
            </MaskReveal>
            <MaskReveal delay={0.46}>
              <span className="block">és Művészet.</span>
            </MaskReveal>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: reduced ? 0 : 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: reduced ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="section-muted mt-8 text-base md:text-lg max-w-md font-light leading-[1.6] tracking-wide text-white/60"
          >
            Egyedi fogpótlások és esztétikai megoldások
            <br className="hidden md:block" /> a legmodernebb technológiával.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: reduced ? 0 : 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: reduced ? 0 : 0.88, ease: [0.22, 1, 0.36, 1] }}
            className="mt-12 flex flex-wrap gap-5"
          >
            <MagneticLink
              href="#portfolio"
              className="items-center px-8 py-3 bg-white text-black rounded-full text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl"
            >
              Munkáim megtekintése
            </MagneticLink>
            <MagneticLink
              href="#contact"
              className="items-center px-8 py-3 border border-white/20 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] text-white/80 hover:bg-white/10 transition-colors"
            >
              Kapcsolat
            </MagneticLink>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none">
        <span className="text-[8px] tracking-[0.5em] uppercase text-white/10 mb-3 ml-1">Görgess</span>
        <div className="w-[1px] h-10 bg-gradient-to-b from-white/20 via-transparent to-transparent" />
      </div>
    </section>
  );
};

export default HeroSection;
