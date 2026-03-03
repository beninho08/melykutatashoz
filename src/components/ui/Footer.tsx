import { motion } from 'framer-motion';
import logo from '@/assets/logo.png';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-slate-100 py-12 md:py-24">
      <div className="w-full px-8 md:px-16 lg:px-24">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center text-3xl md:text-4xl font-bold tracking-tighter text-slate-900">
              <span>dent</span>
              <img 
                src={logo} 
                alt="Á" 
                className="h-10 md:h-12 w-auto mx-1 -translate-y-1.5"
              />
              <span>l2020</span>
            </div>
            <p className="text-[10px] tracking-[0.5em] uppercase text-slate-400 font-medium">
              Esztétika • Precizitás • Digitális Jövő
            </p>
          </div>

          <div className="flex flex-wrap gap-x-12 gap-y-6">
            {['Portfólió', 'Rólam', 'Kapcsolat'].map((item) => (
              <a
                key={item}
                href={`/#${item === 'Portfólió' ? 'portfolio' : item === 'Rólam' ? 'about' : 'contact'}`}
                className="text-[10px] font-bold tracking-[0.4em] uppercase text-slate-600 hover:text-slate-900 transition-colors"
              >
                {item}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-24 pt-10 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[9px] tracking-[0.2em] uppercase text-slate-400">
            © {currentYear} Dental2020. Minden jog fenntartva.
          </p>
          
          <div className="flex gap-10">
            <a href="#" className="text-[9px] tracking-[0.2em] uppercase text-slate-400 hover:text-slate-600">Adatvédelem</a>
            <a href="#" className="text-[9px] tracking-[0.2em] uppercase text-slate-400 hover:text-slate-600">Impresszum</a>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;