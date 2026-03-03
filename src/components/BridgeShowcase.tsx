import { Suspense, useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, ContactShadows, Center } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import gsap from 'gsap';

const DRACO_DECODER = 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/';

function extendGLTFLoader(loader: THREE.Loader): void {
  (loader as any).meshoptDecoder = MeshoptDecoder;
}

function CinematicModel({ onAnimationComplete }: { onAnimationComplete: () => void }) {
  const baseModel = useGLTF('/alap.glb', DRACO_DECODER, false, extendGLTFLoader);
  const bridgeModel = useGLTF('/hid.glb', DRACO_DECODER, false, extendGLTFLoader);
  
  const mainGroupRef = useRef<THREE.Group>(null);
  const baseMoveRef = useRef<THREE.Group>(null);
  const bridgeMoveRef = useRef<THREE.Group>(null);
  const floatRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (floatRef.current) {
      floatRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.03;
    }
  });

  useEffect(() => {
    const bridgeMaterials: THREE.MeshPhysicalMaterial[] = [];

    baseModel.scene.traverse((child: any) => {
      if (child.isMesh) child.material = new THREE.MeshStandardMaterial({ color: "#475569", roughness: 0.7 });
    });
    
    bridgeModel.scene.traverse((child: any) => {
      if (child.isMesh) {
        const mat = new THREE.MeshPhysicalMaterial({ 
          color: "#ffffff", 
          roughness: 0.05, 
          transmission: 0.1, 
          thickness: 1.0,
          emissive: new THREE.Color("#e2e8f0"),
          emissiveIntensity: 0
        });
        child.material = mat;
        bridgeMaterials.push(mat);
      }
    });

    const ctx = gsap.context(() => {
      if (!bridgeMoveRef.current || !baseMoveRef.current || !mainGroupRef.current) return;

      gsap.set(mainGroupRef.current.scale, { x: 0.02, y: 0.02, z: 0.02 }); 
      gsap.set(mainGroupRef.current.rotation, { y: Math.PI * 0.6 }); 
      gsap.set(baseMoveRef.current.position, { x: -15, y: -25, z: -10 }); 
      gsap.set(bridgeMoveRef.current.position, { x: 15, y: 35, z: 10 }); 
      
      const tl = gsap.timeline({
        delay: 0.8, 
        onComplete: onAnimationComplete
      });

      tl.to(mainGroupRef.current.scale, { x: 0.18, y: 0.18, z: 0.18, duration: 4, ease: "power3.inOut" }, 0);
      tl.to(mainGroupRef.current.rotation, { y: Math.PI * 0.05, duration: 4, ease: "power2.inOut" }, 0); 
      tl.to(baseMoveRef.current.position, { x: 0, y: 0, z: 0, duration: 3, ease: "power3.out" }, 0);
      tl.to(bridgeMoveRef.current.position, { x: 0, y: 12, z: 0, duration: 3.5, ease: "power3.out" }, 0.5);
      tl.to(mainGroupRef.current.rotation, { y: 0, duration: 2, ease: "power2.inOut" }, 4); 
      tl.to(bridgeMoveRef.current.position, { y: 0, duration: 2.5, ease: "back.out(1.5)" }, 4.2); 

      if (bridgeMaterials.length > 0) {
        tl.to(bridgeMaterials, { emissiveIntensity: 1.2, duration: 0.2 }, 6.5)
          .to(bridgeMaterials, { emissiveIntensity: 0, duration: 1.5, ease: "power2.out" }, 6.7);
      }
    });

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  return (
    <group ref={floatRef}>
      <group rotation={[0, Math.PI, 0]}>
        <group ref={mainGroupRef}>
          <Center top position={[0, -2, 0]}>
            <group ref={baseMoveRef}>
              <primitive object={baseModel.scene} />
            </group>
            <group ref={bridgeMoveRef}>
              <primitive object={bridgeModel.scene} />
            </group>
          </Center>
        </group>
      </group>
    </group>
  );
}

const BridgeShowcase = () => {
  const [animationDone, setAnimationDone] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);

  const handleAnimationComplete = useCallback(() => {
    setAnimationDone(true);
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div className="w-full min-h-screen bg-[#f8fafc] flex items-center overflow-hidden relative pt-28 pb-12">
      <div className="container mx-auto px-6 lg:px-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* BAL OLDAL: 3D KANVÁSZ */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, x: -50 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="canvas-wrapper relative h-[60vh] lg:h-[70vh] w-full rounded-[4rem] bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden"
        >
          {/* TELJESÍTMÉNY OPTIMALIZÁLÁS: dpr korlátozás és powerPreference */}
          <Canvas 
            camera={{ position: [0, 6, 30], fov: 30 }}
            dpr={[1, 1.5]} 
            gl={{ antialias: true, powerPreference: "high-performance" }}
          >
            <color attach="background" args={['#ffffff']} />
            <Environment preset="studio" />
            <ambientLight intensity={0.6} />
            <spotLight position={[15, 20, 15]} intensity={2.5} penumbra={1} />
            
            <Suspense fallback={null}>
              <CinematicModel onAnimationComplete={handleAnimationComplete} />
              {/* TELJESÍTMÉNY OPTIMALIZÁLÁS: resolution=256 az árnyéknál */}
              <ContactShadows position={[0, -6, 0]} opacity={0.25} scale={45} blur={2} resolution={256} far={15} />
            </Suspense>

            <OrbitControls enableZoom={isInteractive} enablePan={false} enabled={isInteractive} makeDefault />
          </Canvas>
          
          <div className="absolute top-10 left-0 right-0 text-center pointer-events-none">
            <p className="text-[10px] uppercase tracking-[0.8em] font-bold text-slate-300">
               Digitális Rekonstrukció
            </p>
          </div>

          <AnimatePresence>
            {animationDone && !isInteractive && (
              <motion.div 
                // TELJESÍTMÉNY OPTIMALIZÁLÁS: CSS blur kivéve, helyette sima sötétítő réteg
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/10 cursor-pointer transition-colors hover:bg-slate-900/20"
                onClick={() => setIsInteractive(true)}
              >
                <div className="bg-blue-600 text-white px-8 py-4 rounded-full flex items-center gap-3 shadow-2xl hover:scale-105 transition-all duration-300 ring-4 ring-blue-600/20">
                  <svg className="w-5 h-5 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="text-sm uppercase tracking-[0.2em] font-black">Modell Felfedezése</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isInteractive && (
            <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none">
               <p className="text-[10px] uppercase tracking-widest font-bold text-blue-400">
                 A modell aktív - Forgatható és Nagyítható
               </p>
            </div>
          )}
        </motion.div>

        {/* JOBB OLDAL: SZÖVEG */}
        <div className="flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          >
            <p className="text-blue-600 text-[10px] tracking-[0.5em] uppercase mb-4 font-bold flex items-center gap-4 italic">
              <span className="w-8 h-[1px] bg-blue-600"></span>
              Anatómiai Szakértelem
            </p>
            <h2 className="text-5xl lg:text-7xl font-black tracking-tighter mb-8 leading-[0.9] text-slate-900">
              Anatómikus <br /> Híd Munkák
            </h2>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
            {[
              { title: "CAD/CAM", desc: "Mikrométer pontos illeszkedés." },
              { title: "Cirkon", desc: "Prémium fényáteresztő képesség." },
              { title: "Egyedi", desc: "Személyre szabott morfológia." },
              { title: "Tartós", desc: "Hosszútávú rágóstabilitás." }
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + (idx * 0.15) }}
                className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                <h4 className="font-bold text-[11px] mb-2 text-slate-800 uppercase tracking-widest">{feature.title}</h4>
                <p className="text-[12px] text-slate-500 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

// Draco + Meshopt preload – azonnal elindul a letöltés az oldalra navigáláskor
useGLTF.preload('/alap.glb', DRACO_DECODER, false, extendGLTFLoader);
useGLTF.preload('/hid.glb', DRACO_DECODER, false, extendGLTFLoader);

export default BridgeShowcase;