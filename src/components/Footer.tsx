import { motion } from 'framer-motion';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    /* JAVÍTÁS: Kijavítottam a lezáró taget és növeltem a kerekítést (rounded-t-[100px]) 
       a Netlify-os megjelenéshez. A -mt-20 biztosítja a selymes rácsúszást. */
    <footer className="bg-[#0a1124] relative pt-24 pb-12 rounded-t-[60px] md:rounded-t-[100px] -mt-20 z-20 overflow-hidden">
      <div className="w-full px-8 md:px-16 lg:px-24">
        <div className="flex flex-col md:flex-row justify-between items-center gap-10">
          
          {/* Vissza a tetejére gomb - Megtartva az audit szerinti rugó animációt */}
          <button 
            onClick={scrollToTop}
            className="group flex items-center gap-3 text-[10px] font-bold tracking-[0.3em] uppercase text-white/40 hover:text-white transition-all duration-300"
          >
            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white/40 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 group-hover:-translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </div>
            Vissza a tetejére
          </button>

          <p className="text-[9px] tracking-[0.2em] uppercase text-white/20 text-center">
            © {currentYear} dentÁl2020. Minden jog fenntartva.
          </p>

          <div className="flex gap-8 text-white/40">
            {['Portfólió', 'Rólam', 'Kapcsolat'].map((item) => (
              <a key={item} href={`/#${item.toLowerCase()}`} className="text-[10px] font-bold tracking-[0.3em] uppercase hover:text-white transition-colors">
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;