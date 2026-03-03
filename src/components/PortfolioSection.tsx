import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

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

const portfolioItems = [
  { id: 1, title: 'Cirkon Korona', category: 'Korona', height: 'h-72' },
  { id: 2, title: 'Teljes Protézis', category: 'Protézis', height: 'h-96' },
  { id: 3, title: 'Porcelán Héj', category: 'Veneer', height: 'h-64' },
  { id: 4, title: 'Implantátum Felépítmény', category: 'Implantátum', height: 'h-80' },
  { id: 5, title: 'Esztétikai Korrekció', category: 'Esztétika', height: 'h-72' },
  { id: 6, title: 'Híd Munka', category: 'Speciális Híd', height: 'h-[450px]', isSpecial: true },
];

const wordVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const letterVariants = {
  hidden: { y: '110%', opacity: 0 },
  visible: { y: '0%', opacity: 1, transition: { type: 'spring' as const, stiffness: 60, damping: 14 } },
};

function AnimatedTitle({ text }: { text: string }) {
  return (
    <motion.span
      className="block overflow-hidden"
      variants={wordVariants}
      initial="hidden"
      whileHover="visible"
    >
      {text.split('').map((char, i) => (
        <motion.span key={i} variants={letterVariants} style={{ display: 'inline-block', whiteSpace: 'pre' }}>
          {char}
        </motion.span>
      ))}
    </motion.span>
  );
}

const PortfolioSection = () => {
  const navigate = useNavigate();

  return (
    <section id="portfolio" className="section-light py-32 relative z-20">
      <div className="container mx-auto px-6 lg:px-16">
        <div className="mb-20 max-w-2xl">
          <ScrollMaskReveal delay={0}>
            <p className="section-muted text-sm tracking-[0.3em] uppercase mb-4">Portfólió</p>
          </ScrollMaskReveal>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
            <ScrollMaskReveal delay={0.12}>
              <span className="block">Válogatott Munkáim</span>
            </ScrollMaskReveal>
          </h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="section-muted mt-4 text-lg font-light"
          >
            A legújabb fogtechnikai munkáim közül válogatva – minden darab egyedi és precíz.
          </motion.p>
        </div>

        <div className="columns-1 md:columns-2 lg:columns-3 gap-5 space-y-5">
          {portfolioItems.map((item, i) => {
            const isVip = item.isSpecial;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: isVip ? 60 : 30, scale: isVip ? 0.95 : 1 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: isVip ? 0.8 : 0.5, delay: i * 0.08 }}
                className="break-inside-avoid group"
              >
                <div
                  onClick={() => isVip ? navigate('/hidmunka') : null}
                  className={`${item.height} section-card rounded-2xl overflow-hidden relative transition-all duration-500 group-hover:scale-[1.02] ${
                    isVip
                      ? 'ring-1 ring-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.2)] cursor-pointer'
                      : 'cursor-default'
                  }`}
                >
                  {isVip && (
                    <div className="absolute top-4 right-4 z-30 bg-amber-500 text-black text-[10px] font-bold tracking-widest px-4 py-1.5 rounded-full uppercase shadow-lg">
                      Prémium Eljárás
                    </div>
                  )}

                  <div className={`absolute inset-0 bg-gradient-to-t transition-opacity duration-500 z-10 ${
                    isVip
                      ? 'from-amber-900/90 via-black/40 to-transparent opacity-90'
                      : 'from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100'
                  }`} />

                  <div className="absolute inset-0 flex items-center justify-center z-0">
                    <div className={`section-muted text-sm tracking-widest uppercase ${isVip ? 'opacity-20 text-amber-500' : 'opacity-40'}`}>
                      {isVip ? 'Kép Helye' : 'Placeholder'}
                    </div>
                  </div>

                  <div className={`absolute bottom-0 left-0 right-0 p-6 z-20 transition-all duration-500 ${
                    isVip ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100'
                  }`}>
                    <p className={`text-xs tracking-[0.2em] uppercase mb-2 ${isVip ? 'text-amber-400 font-bold' : 'text-white/70'}`}>
                      {item.category}
                    </p>
                    {/* Hover-aktivált betű animáció */}
                    <h3 className={`font-semibold text-white ${isVip ? 'text-3xl md:text-4xl drop-shadow-md' : 'text-lg'}`}>
                      {isVip ? item.title : <AnimatedTitle text={item.title} />}
                    </h3>
                    {isVip && (
                      <p className="text-white/70 text-sm mt-3 font-light leading-relaxed">
                        Magas szintű anatómiai pontosság és esztétika, amely csak sokéves tapasztalattal érhető el.
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PortfolioSection;
