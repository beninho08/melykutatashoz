import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.png';
import BridgeShowcase from '@/components/BridgeShowcase';

const BridgePage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Amikor belép az oldalra, mindig a tetején kezdjen
    window.scrollTo(0, 0);
    
    // JAVÍTÁS: KIVETTÜK A GÖRGETÉS-ZÁRAT!
    // Régen itt volt a document.body.style.overflow = 'hidden';
    
    // Biztonsági takarítás, ha más oldalról jönne a zár
    document.body.style.overflow = 'auto';
  }, []);

  return (
    // JAVÍTÁS: Itt is kivettük a magasság-korlátozást (h-screen és overflow-hidden)
    <div className="min-h-screen w-full bg-[#fafbfc] relative">
      
      {/* FEJLÉC: 'fixed' lett 'absolute' helyett, így görgetéskor is veled jön */}
      <header className="fixed top-0 left-0 right-0 z-50 px-8 py-10 flex items-center justify-between pointer-events-none">
        <button 
          onClick={() => navigate('/')}
          className="pointer-events-auto flex items-center gap-4 text-slate-400 hover:text-slate-900 transition-all font-bold tracking-[0.3em] uppercase text-[10px]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Vissza a főoldalra
        </button>

        <div className="flex items-center text-2xl font-bold tracking-tighter text-slate-900">
          <span>dent</span>
          <img src={logo} alt="Á" className="h-7 w-auto mx-1 -translate-y-1" style={{ filter: 'brightness(0)' }} />
          <span>l2020</span>
        </div>
      </header>
      
      {/* MAGA A TARTALOM: Itt hívjuk be a BridgeShowcase-t, aminek most már van helye görgetni */}
      <main className="w-full">
        <BridgeShowcase />
      </main>
      
    </div>
  );
};

export default BridgePage;  