import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Center, useProgress } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import { useSpring } from '@react-spring/three';
import * as THREE from 'three';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { useTexture } from '@react-three/drei';

// Draco dekóder URL (Google CDN)
const DRACO_DECODER = 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/';

// Meshopt dekóder injektálása a GLTFLoader-be (module-level, stabil referencia)
function extendGLTFLoader(loader: THREE.Loader): void {
  (loader as any).meshoptDecoder = MeshoptDecoder;
}

// --- 3D Logó Betöltő ---
function LogoLoader() {
  const { progress, active } = useProgress();
  const done = !active && progress >= 99;
  const logoTexture = useTexture('/logo.png');
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current && !done) {
      // Forgás
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 2;
      meshRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 1.5) * 0.2;
      
      // Felfele repülés ha kész
      if (done) {
        meshRef.current.position.y += 0.1;
        const material = meshRef.current.material as THREE.MeshStandardMaterial;
        material.opacity = Math.max(0, material.opacity - 0.02);
      }
    }
  });
  
  if (done) return null;
  
  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <planeGeometry args={[2, 2]} />
      <meshStandardMaterial 
        map={logoTexture} 
        transparent 
        side={THREE.DoubleSide}
        opacity={1}
      />
    </mesh>
  );
}

// --- 3D Modell: Draco dekódolás + @react-spring/three egérkövetés ---
function RotatingModel({ isMobile }: { isMobile: boolean }) {
  // Draco: CDN dekóder | Meshopt: manuálisan injektálva (extendLoader)
  const gltf = useGLTF('/sajat-fogam.glb', DRACO_DECODER, false, extendGLTFLoader);
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  
  // Debug: logoljuk a GLTF adatokat
  console.log('GLTF loaded:', gltf);
  console.log('GLTF scene:', gltf.scene);
  console.log('GLTF scene children:', gltf.scene?.children);
  
  const scene = gltf.scene;
  
  // Ha nincs scene, adjunk vissza egy placeholder-t
  if (!scene) {
    console.log('No scene found, returning placeholder');
    return (
      <mesh>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="red" />
      </mesh>
    );
  }

  // Méret növelése a kérésnek megfelelően
  const baseScale = isMobile ? 0.05 : 0.08;
  const currentScale = hovered ? baseScale * 1.05 : baseScale;

  // Prémium áttetsző anyag
  useEffect(() => {
    if (!scene) return;
    
    console.log('Applying materials to scene:', scene);
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        console.log('Found mesh:', child.name);
        (child as THREE.Mesh).material = new THREE.MeshPhysicalMaterial({
          color: '#ffffff',
          roughness: 0.08,
          metalness: 0.0,
          clearcoat: 1.0,
          clearcoatRoughness: 0.05,
          ior: 1.65,
          transmission: 0.9,
          thickness: 2.0,
          attenuationColor: new THREE.Color('#fdf5e6'),
          attenuationDistance: 4.5,
        });
      }
    });
  }, [scene]);

  // @react-spring/three: vajpuha, fizika-alapú egérkövetés
  const [mouseSpring, mouseApi] = useSpring(() => ({
    rx: 0,
    ry: 0,
    config: { mass: 1.6, tension: 58, friction: 22 },
  }));

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -((e.clientY / window.innerHeight) * 2 - 1);
      mouseApi.start({ rx: ny * 0.24, ry: nx * 0.36 });
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [mouseApi]);

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.getElapsedTime();
      const sp = Math.min(window.scrollY / window.innerHeight, 1);

      // Alap forgás + spring egér-offset
      groupRef.current.rotation.y = t * 0.25 + mouseSpring.ry.get();
      groupRef.current.rotation.x = 0.15 + mouseSpring.rx.get() + sp * 0.55;
      groupRef.current.rotation.z = Math.cos(t * 0.4) * 0.1 - sp * 0.18;

      // Scroll-based pozíció lerp – közeledés + süllyed
      const targetZ = sp * 2.2;
      const targetY = -sp * 0.7;
      groupRef.current.position.z += (targetZ - groupRef.current.position.z) * 0.055;
      groupRef.current.position.y += (targetY - groupRef.current.position.y) * 0.055;

      // Enyhe méret-növekedés görgetésre (közeledés érzet)
      const targetScale = currentScale * (1 + sp * 0.09);
      groupRef.current.scale.setScalar(
        groupRef.current.scale.x + (targetScale - groupRef.current.scale.x) * 0.055
      );
    }
  });

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
    return () => { document.body.style.cursor = 'auto'; };
  }, [hovered]);

  return (
    <group
      ref={groupRef}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
      onClick={(e) => { e.stopPropagation(); navigate('/hidmunka'); }}
    >
      <Center>
        {scene && (
          <primitive 
            object={scene} 
            scale={[0.7, 0.7, 0.7]} 
            position={[0, 0, 0]} 
          />
        )}
      </Center>
    </group>
  );
}

const ToothScene = () => {
  const [screenType, setScreenType] = useState<'mobile' | 'laptop' | 'desktop'>('desktop');

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setScreenType('mobile');
      else if (window.innerWidth < 1280) setScreenType('laptop');
      else setScreenType('desktop');
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getStyles = () => {
    if (screenType === 'mobile') return { position: 'absolute' as const, top: '45vh', left: '0', width: '100%', height: '350px', zIndex: 40 };
    if (screenType === 'laptop') return { position: 'absolute' as const, top: '10vh', right: '2vw', width: '420px', height: '520px', zIndex: 40 };
    return { position: 'absolute' as const, top: '8vh', right: '8vw', width: '520px', height: '620px', zIndex: 5 };
  };

  return (
    <div style={{ ...getStyles(), position: 'absolute' }}>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 8], fov: 40 }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, powerPreference: 'high-performance' }}
      >
        {/* Dramatikus Rim Light világ – sötét ambient, erős hátulról érkező fény */}
        <ambientLight intensity={0.12} />

        {/* Key light – enyhén elöl-fentről */}
        <directionalLight position={[4, 6, 5]} intensity={2.2} />

        {/* Rim Light 1 – hideg kék, bal-hátsó */}
        <spotLight
          position={[-7, 3, -7]}
          intensity={9}
          color="#b0c8ff"
          angle={0.45}
          penumbra={0.85}
          castShadow={false}
        />

        {/* Rim Light 2 – tiszta fehér, jobb-hátsó */}
        <spotLight
          position={[8, -1, -9]}
          intensity={7}
          color="#ffffff"
          angle={0.35}
          penumbra={1}
          castShadow={false}
        />

        {/* Fill light – meleg tónus alulról */}
        <pointLight position={[0, -6, 3]} intensity={1.2} color="#ffeedd" />

        <Suspense fallback={null}>
          <LogoLoader />
          <RotatingModel isMobile={screenType === 'mobile'} />
        </Suspense>
      </Canvas>
    </div>
  );
};

// Draco + Meshopt preload – a modul betöltésekor azonnal elindul a letöltés
useGLTF.preload('/sajat-fogam.glb', DRACO_DECODER, false, extendGLTFLoader);

export default ToothScene;