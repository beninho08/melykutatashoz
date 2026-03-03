import { motion } from 'framer-motion';
import NoiseOverlay from './NoiseOverlay';

// Scroll-triggered mask reveal segédkomponens
function ScrollMaskReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <div style={{ overflow: 'hidden', display: 'block' }}>
      <motion.div
        initial={{ y: '105%' }}
        whileInView={{ y: '0%' }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ type: 'spring', stiffness: 52, damping: 16, delay }}
      >
        {children}
      </motion.div>
    </div>
  );
}

const AboutSection = () => {
  return (
    <section id="about" className="section-dark py-32 relative z-20 no-curve">
      <NoiseOverlay />
      <div className="container mx-auto px-6 lg:px-16">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          {/* Left: text */}
          <div>
            <ScrollMaskReveal delay={0}>
              <p className="section-muted text-sm tracking-[0.3em] uppercase mb-4">Rólam</p>
            </ScrollMaskReveal>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              <ScrollMaskReveal delay={0.1}>
                <span className="block">Több mint 15 év</span>
              </ScrollMaskReveal>
              <ScrollMaskReveal delay={0.22}>
                <span className="block">tapasztalat.</span>
              </ScrollMaskReveal>
            </h2>
            <div className="space-y-4 section-muted text-lg font-light leading-relaxed">
              <p>
                Fogtechnikusként elkötelezett vagyok a precíz, esztétikus és tartós fogpótlások készítése
                iránt. Laboratóriumomban a legmodernebb CAD/CAM technológiát kombinálom a hagyományos
                kézműves szakértelemmel.
              </p>
              <p>
                Minden munka egyedi – figyelembe veszem a páciens arcvonásait, mosolyvonalát és természetes
                fogszínét, hogy a lehető legtermészetesebb eredményt érjem el.
              </p>
            </div>
          </div>

          {/* Right: stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="grid grid-cols-2 gap-8"
          >
            {[
              { num: '15+', label: 'Év Tapasztalat' },
              { num: '3000+', label: 'Elkészült Munka' },
              { num: '50+', label: 'Partner Rendelő' },
              { num: '100%', label: 'Elégedettség' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                className="section-card rounded-2xl p-8"
              >
                <div className="text-4xl md:text-5xl font-bold mb-2">{stat.num}</div>
                <div className="section-muted text-sm tracking-wide">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
