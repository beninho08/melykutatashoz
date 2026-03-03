import { motion } from 'framer-motion';
import NoiseOverlay from './NoiseOverlay';

const testimonials = [
  {
    quote: "Rendkívüli precizitással és esztétikai érzékkel dolgozik. A cirkon koronák tökéletesen illeszkedtek, pácienseim elégedettségre minden alkalommal számíthatok.",
    name: "Dr. Kovács Péter",
    role: "Fogszakorvos, Budapest",
    initials: "KP",
  },
  {
    quote: "15 év együttműködés alatt egyetlen reklamáció sem volt. A CAD/CAM technológia és a kézműves tudás kombinációja egyedülálló a szakmában.",
    name: "Dr. Nagy Éva",
    role: "Szájsebész, Győr",
    initials: "NÉ",
  },
  {
    quote: "A híd munkák anatómiai pontossága és a természetes fogszínekhez való illesztés mesteri szintű. Kollégáimnak is csak ajánlani tudom.",
    name: "Dr. Horváth László",
    role: "Protetikus fogszakorvos, Pécs",
    initials: "HL",
  },
];

const PartnerLogo = ({ index }: { index: number }) => {
  const logos = [
    <svg viewBox="0 0 80 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="4" y="28" fontFamily="serif" fontSize="13" fontWeight="700" fill="currentColor" letterSpacing="1">DENTAL</text>
      <circle cx="68" cy="20" r="8" stroke="currentColor" strokeWidth="2"/>
      <path d="M64 20 Q68 14 72 20" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    </svg>,
    <svg viewBox="0 0 80 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 28 L24 16 L30 24 L36 12 L42 24 L48 16 L52 28Z" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinejoin="round"/>
      <text x="58" y="26" fontFamily="sans-serif" fontSize="10" fontWeight="600" fill="currentColor">PRO</text>
    </svg>,
    <svg viewBox="0 0 90 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="14" width="4" height="16" rx="1" fill="currentColor"/>
      <rect x="4" y="20" width="16" height="4" rx="1" fill="currentColor"/>
      <text x="28" y="27" fontFamily="serif" fontSize="14" fontWeight="800" fill="currentColor">SMILE</text>
    </svg>,
    <svg viewBox="0 0 80 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="12" stroke="currentColor" strokeWidth="2"/>
      <circle cx="20" cy="20" r="6" fill="currentColor" opacity="0.3"/>
      <text x="38" y="25" fontFamily="sans-serif" fontSize="12" fontWeight="700" fill="currentColor">KLINIKA</text>
    </svg>,
    <svg viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="6" y="30" fontFamily="serif" fontSize="28" fontWeight="900" fill="currentColor" opacity="0.8">DL</text>
    </svg>,
    <svg viewBox="0 0 90 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="8" y1="12" x2="8" y2="30" stroke="currentColor" strokeWidth="3"/>
      <text x="18" y="24" fontFamily="sans-serif" fontSize="11" fontWeight="600" fill="currentColor" letterSpacing="2">ORALCARE</text>
    </svg>,
  ];
  return (
    <div className="w-28 h-9 text-black/25 hover:text-black/55 transition-colors duration-500">
      {logos[index % logos.length]}
    </div>
  );
};

const partnerCount = [0, 1, 2, 3, 4, 5];
const marqueeItems = [...partnerCount, ...partnerCount, ...partnerCount];

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

const TestimonialsSection = () => {
  return (
    // FIX: py-16 (kisebb padding), overflow-hidden a noise-hoz
    <section className="section-light py-16 relative z-20 border-t border-black/5 overflow-hidden">
      {/* Noise — kisebb opacity mint a dark részeken */}
      <NoiseOverlay opacity={0.15} />

      <div className="container mx-auto px-6 lg:px-16 relative z-10">

        {/* ── MARQUEE SÁV ── */}
        <div className="mb-12">
          <p className="text-center text-[10px] tracking-[0.4em] uppercase text-black/30 mb-8">
            Partner rendelők
          </p>
          <div
            className="relative overflow-hidden"
            style={{
              maskImage: 'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
            }}
          >
            <motion.div
              className="flex gap-6 w-max"
              animate={{ x: ['0%', '-33.333%'] }}
              transition={{ duration: 35, ease: 'linear', repeat: Infinity }}
            >
              {marqueeItems.map((idx, i) => (
                <div key={i} className="flex items-center justify-center px-10 py-4 flex-shrink-0" style={{ minWidth: '140px' }}>
                  <PartnerLogo index={idx} />
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* ── VÉLEMÉNYEK CÍM — KÖZÉPRE ── */}
        <div className="mb-10 text-center">
          <ScrollMaskReveal delay={0}>
            <p className="section-muted text-sm tracking-[0.3em] uppercase mb-3">Vélemények</p>
          </ScrollMaskReveal>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            <ScrollMaskReveal delay={0.12}>
              <span className="block">Mit mondanak partnereink.</span>
            </ScrollMaskReveal>
          </h2>
        </div>

        {/* ── TESTIMONIAL KÁRTYÁK ── */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="section-card rounded-2xl p-8 flex flex-col gap-5 hover:-translate-y-1 transition-transform duration-300"
            >
              <svg className="w-7 h-7 text-black/10" fill="currentColor" viewBox="0 0 32 32">
                <path d="M10 8C6.686 8 4 10.686 4 14v10h10V14H7c0-1.657 1.343-3 3-3V8zm18 0c-3.314 0-6 2.686-6 6v10h10V14h-7c0-1.657 1.343-3 3-3V8z" />
              </svg>
              <p className="text-sm leading-relaxed section-muted font-light flex-1">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-4 pt-2 border-t border-black/5">
                <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold tracking-wider flex-shrink-0">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs section-muted">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default TestimonialsSection;
