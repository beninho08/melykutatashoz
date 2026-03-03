import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useRef } from 'react';

function MagneticLink({ href, className, children }: {
  href: string; className: string; children: React.ReactNode;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const mx = useMotionValue(0), my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 180, damping: 16, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 180, damping: 16, mass: 0.6 });
  return (
    <motion.a
      ref={ref}
      href={href}
      style={{ x: sx, y: sy, display: 'inline-flex' }}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        mx.set((e.clientX - (r.left + r.width / 2)) * 0.32);
        my.set((e.clientY - (r.top + r.height / 2)) * 0.32);
      }}
      onMouseLeave={() => { mx.set(0); my.set(0); }}
      whileHover={{ scale: 1.06 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className={className}
    >
      {children}
    </motion.a>
  );
}

const HeroSection = () => (
  // section + section-dark class → Navigation tudja hogy sötét szakaszon van
  <section
    id="hero"
    className="section-dark flex flex-col justify-center px-8 md:px-16 lg:px-24 pt-32"
    style={{ minHeight: '100vh', backgroundColor: '#0a1628' }}
  >
    <div className="max-w-lg">
      <motion.p
        initial={{ opacity: 0, y: '16px' }}
        animate={{ opacity: 1, y: '0px' }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="text-[10px] tracking-[0.45em] uppercase text-white/30 mb-6 font-medium"
      >
        Prémium Fogtechnika
      </motion.p>

      <h1 className="text-6xl md:text-7xl font-bold tracking-tighter leading-[1.05] text-white mb-8">
        <div style={{ overflow: 'hidden' }}>
          <motion.span
            className="block"
            initial={{ y: '60px' }}
            animate={{ y: '0px' }}
            transition={{ type: 'spring', stiffness: 52, damping: 16, delay: 0.35 }}
          >
            Precizitás
          </motion.span>
        </div>
        <div style={{ overflow: 'hidden' }}>
          <motion.span
            className="block"
            initial={{ y: '60px' }}
            animate={{ y: '0px' }}
            transition={{ type: 'spring', stiffness: 52, damping: 16, delay: 0.5 }}
          >
            és Művészet.
          </motion.span>
        </div>
      </h1>

      <motion.p
        initial={{ opacity: 0, y: '16px' }}
        animate={{ opacity: 1, y: '0px' }}
        transition={{ duration: 0.9, delay: 0.7 }}
        className="text-base text-white/50 font-light leading-[1.65] max-w-md mb-10"
      >
        Egyedi fogpótlások és esztétikai megoldások<br />
        a legmodernebb technológiával.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: '16px' }}
        animate={{ opacity: 1, y: '0px' }}
        transition={{ duration: 0.9, delay: 0.88 }}
        className="flex flex-wrap gap-5"
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

      <div className="flex flex-col items-start gap-3 mt-16 pointer-events-none select-none">
        <span className="text-[8px] tracking-[0.55em] uppercase text-white/20">Görgess</span>
        <div className="w-[1px] h-10 bg-gradient-to-b from-white/25 to-transparent" />
      </div>
    </div>
  </section>
);

export default HeroSection;
