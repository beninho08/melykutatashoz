/**
 * GlobOrb.tsx – FIX: fog nagyobb + lassabb morph + footer hamarabb
 *
 * Változtatások:
 *  - Fog méret: 1.2 → 1.5 (nagyobb)
 *  - Hero fázisok: fog díszlet hosszabb, morph lassúbb, hamarabb véget ér
 *  - Footer trigger: 'top 95%' → 'top 85%' (hamarabb kezdődik)
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const PARTICLE_COUNT = 15_000;
const DRACO_DECODER  = 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/';
const SPHERE_RADIUS  = 1.6;
const FOG_SCALE      = 2.2;
const CORNER_MARGIN  = 20;
const CORNER_ICON    = 56;

const VERT = /* glsl */ `
  uniform float uProgress;
  uniform float uSize;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float sz = uSize * (1.0 + uProgress * 0.5);
    gl_PointSize = sz * (7.5 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */ `
  uniform vec3  uColor;
  uniform float uOpacity;
  void main() {
    vec2  uv    = gl_PointCoord - 0.5;
    float dist  = length(uv);
    if (dist > 0.5) discard;
    float alpha = smoothstep(0.5, 0.05, dist) * uOpacity;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

function buildSpherePositions(count: number): Float32Array {
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = 2 * Math.PI * Math.random();
    const phi   = Math.acos(2 * Math.random() - 1);
    const r     = SPHERE_RADIUS * (0.85 + Math.random() * 0.30);
    arr[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    arr[i*3+1] = r * Math.cos(phi);
    arr[i*3+2] = r * Math.sin(phi) * Math.sin(theta);
  }
  return arr;
}

function cubicInOut(p: number): number {
  return p < 0.5 ? 4*p*p*p : 1 - Math.pow(-2*p + 2, 3) / 2;
}

const GlobOrb = () => {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;

    const sizes = { width: window.innerWidth, height: window.innerHeight };

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(sizes.width, sizes.height);
    Object.assign(renderer.domElement.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      display: 'block',
      pointerEvents: 'none',
      background: 'transparent',
    });
    container.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, sizes.width / sizes.height, 0.1, 100);
    camera.position.set(0, 0, 9);
    scene.add(camera);

    const spherePos = buildSpherePositions(PARTICLE_COUNT);
    const toothPos  = new Float32Array(PARTICLE_COUNT * 3);
    const livePos   = new Float32Array(PARTICLE_COUNT * 3);
    livePos.set(spherePos);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(livePos, 3).setUsage(THREE.DynamicDrawUsage)
    );

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uProgress: { value: 1.0 },
        uColor:    { value: new THREE.Color('#dce6f0') },
        uOpacity:  { value: 0.0 },
        uSize:     { value: renderer.getPixelRatio() > 1 ? 2.5 : 2.1 },
      },
      vertexShader:   VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite:  false,
      blending:    THREE.AdditiveBlending,
    });

    const group = new THREE.Group();
    group.add(new THREE.Points(geometry, material));
    scene.add(group);

    // ── STATE ──
    const state = {
      screenX:  sizes.width  * 0.72,
      screenY:  sizes.height * 0.46,
      scale:    1.5,   // !! Nagyobb fog (1.2 → 1.5)
      morph:    1.0,
      opacity:  0.0,
    };

    const toWorld = (sx: number, sy: number) => {
      const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * camera.position.z;
      const halfW = halfH * (sizes.width / sizes.height);
      return {
        x:  ((sx / sizes.width)  - 0.5) * 2 * halfW,
        y: ((0.5 - sy / sizes.height)) * 2 * halfH,
      };
    };

    const snapToState = () => {
      const wp = toWorld(state.screenX, state.screenY);
      group.position.x = wp.x;
      group.position.y = wp.y;
      group.scale.setScalar(state.scale);
    };

    const getCorner = () => ({
      x: CORNER_MARGIN + CORNER_ICON / 2,
      y: window.innerHeight - CORNER_MARGIN - CORNER_ICON / 2,
    });

    const getFooterCenter = () => {
      const footer = document.querySelector('footer');
      if (!footer) return { x: sizes.width * 0.5, y: sizes.height * 0.5 };
      const rect = footer.getBoundingClientRect();
      return { x: sizes.width * 0.5, y: rect.top + rect.height * 0.40 };
    };

    // ────────────────────────────────────────────────────────────────────────
    // GLB betöltés
    // ────────────────────────────────────────────────────────────────────────
    let glbLoaded = false;

    const draco = new DRACOLoader();
    draco.setDecoderPath(DRACO_DECODER);
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);

    loader.load(
      '/sajat-fogam.glb',
      (gltf) => {
        const allVerts: THREE.Vector3[] = [];
        gltf.scene.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (!mesh.isMesh) return;
          mesh.updateWorldMatrix(true, false);
          const posAttr = mesh.geometry.attributes.position as THREE.BufferAttribute;
          const idx     = mesh.geometry.index;
          const tmp     = new THREE.Vector3();
          if (idx) {
            for (let i = 0; i < idx.count; i++) {
              tmp.fromBufferAttribute(posAttr, idx.getX(i)).applyMatrix4(mesh.matrixWorld);
              allVerts.push(tmp.clone());
            }
          } else {
            for (let i = 0; i < posAttr.count; i++) {
              tmp.fromBufferAttribute(posAttr, i).applyMatrix4(mesh.matrixWorld);
              allVerts.push(tmp.clone());
            }
          }
        });

        if (!allVerts.length) {
          console.warn('GlobOrb: GLB mesh üres!');
          return;
        }

        let mnX=Infinity, mxX=-Infinity;
        let mnY=Infinity, mxY=-Infinity;
        let mnZ=Infinity, mxZ=-Infinity;
        for (const v of allVerts) {
          if (v.x < mnX) mnX = v.x; if (v.x > mxX) mxX = v.x;
          if (v.y < mnY) mnY = v.y; if (v.y > mxY) mxY = v.y;
          if (v.z < mnZ) mnZ = v.z; if (v.z > mxZ) mxZ = v.z;
        }
        const cx  = (mnX + mxX) / 2;
        const cy  = (mnY + mxY) / 2;
        const cz  = (mnZ + mxZ) / 2;
        const sc  = FOG_SCALE / Math.max(mxX-mnX, mxY-mnY, mxZ-mnZ);

        const step = Math.max(1, Math.floor(allVerts.length / PARTICLE_COUNT));
        let vi = 0;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const v = allVerts[vi];
          toothPos[i*3]   = (v.x - cx) * sc;
          toothPos[i*3+1] = (v.y - cy) * sc;
          toothPos[i*3+2] = (v.z - cz) * sc;
          vi += step;
          if (vi >= allVerts.length) vi = 0;
        }

        for (let i = 0; i < PARTICLE_COUNT; i++) {
          livePos[i*3]   = toothPos[i*3];
          livePos[i*3+1] = toothPos[i*3+1];
          livePos[i*3+2] = toothPos[i*3+2];
        }
        geometry.attributes.position.needsUpdate = true;
        glbLoaded = true;

        snapToState();
        ScrollTrigger.refresh();

        gsap.to(state, {
          opacity: 0.50,
          duration: 1.4,
          ease: 'power2.inOut',
        });
      },
      undefined,
      (err) => console.error('GlobOrb GLB hiba:', err)
    );

    // ────────────────────────────────────────────────────────────────────────
    // GSAP ScrollTriggers
    // ────────────────────────────────────────────────────────────────────────
    const ctx = gsap.context(() => {

      // ── HERO ──────────────────────────────────────────────────────────────
      // Új fázisok:
      //  1. Fog áll, forog (0-50%) → hosszabb idő
      //  2. Fog → gömb LASSÚ morph (50-80%)
      //  3. Sarokba + fade (80-100%) → rövidebb, hamarabb véget ér

      const heroTl = gsap.timeline({
        scrollTrigger: {
          trigger: '#hero',
          start:   'top top',
          end:     'bottom top',
          scrub:   1.5,
          invalidateOnRefresh: true,
        },
      });

      // Fázis 1: fog marad (50%)
      heroTl.to(state, {
        screenX:  () => sizes.width  * 0.72,
        screenY:  () => sizes.height * 0.46,
        scale:    1.5,   // nagyobb fog
        morph:    1.0,
        opacity:  0.50,
        duration: 0.50,
        ease:     'none',
      });

      // Fázis 2: fog → gömb LASSÚ (30%)
      heroTl.to(state, {
        screenX:  () => sizes.width  * 0.72,
        screenY:  () => sizes.height * 0.46,
        scale:    1.3,
        morph:    0.0,
        opacity:  0.45,
        duration: 0.30,
        ease:     'power1.inOut',  // lassúbb easing
      });

      // Fázis 3: sarokba + eltűnik (20%)
      heroTl.to(state, {
        screenX:  () => getCorner().x,
        screenY:  () => getCorner().y,
        scale:    0.09,
        morph:    0.0,
        opacity:  0.0,
        duration: 0.20,
        ease:     'power3.inOut',
      });

      // ── FOOTER ────────────────────────────────────────────────────────────
      // Start: 'top 85%' → hamarabb kezdődik (volt 95%)

      const footerTl = gsap.timeline({
        scrollTrigger: {
          trigger:  'footer',
          start:    'top 85%',   // !! Hamarabb
          end:      'top 15%',
          scrub:    1.8,
          invalidateOnRefresh: true,
          onEnter: () => {
            gsap.set(state, {
              screenX: sizes.width * 0.5,
              screenY: sizes.height * 1.25,  // kicsit mélyebben indul
              scale:   0.12,
              morph:   0.0,
              opacity: 0.0,
            });
          },
        },
      });

      footerTl.to(state, {
        screenX:  () => sizes.width * 0.5,
        screenY:  () => getFooterCenter().y,
        scale:    1.4,   // footer fog is nagyobb
        morph:    1.0,
        opacity:  0.50,
        ease:     'power2.out',
      });
    });

    setTimeout(() => ScrollTrigger.refresh(), 700);

    // ────────────────────────────────────────────────────────────────────────
    // Stray particles
    // ────────────────────────────────────────────────────────────────────────
    const STRAY_COUNT = 18;
    const strayIdx: number[] = [];
    for (let i = 0; i < STRAY_COUNT; i++) {
      strayIdx.push(Math.floor(Math.random() * PARTICLE_COUNT));
    }

    // ────────────────────────────────────────────────────────────────────────
    // Render loop
    // ────────────────────────────────────────────────────────────────────────
    let animId: number;
    const clock = new THREE.Clock();

    const tick = () => {
      animId = requestAnimationFrame(tick);
      const t   = clock.getElapsedTime();
      const arr = geometry.attributes.position.array as Float32Array;

      const rawP  = THREE.MathUtils.clamp(state.morph, 0, 1);
      const eased = cubicInOut(rawP);
      material.uniforms.uProgress.value = eased;

      if (glbLoaded) {
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const i3 = i * 3;
          arr[i3]   = spherePos[i3]   + (toothPos[i3]   - spherePos[i3])   * eased;
          arr[i3+1] = spherePos[i3+1] + (toothPos[i3+1] - spherePos[i3+1]) * eased;
          arr[i3+2] = spherePos[i3+2] + (toothPos[i3+2] - spherePos[i3+2]) * eased;
        }
      }

      if (rawP < 0.80) {
        const amp = 0.018 * (1 - rawP / 0.80);
        for (const idx of strayIdx) {
          const i3  = idx * 3;
          const bx  = arr[i3], by = arr[i3+1], bz = arr[i3+2];
          const len = Math.sqrt(bx*bx + by*by + bz*bz) || 1;
          const k   = 1 + (Math.sin(t * 0.018 + idx * 0.137) * amp) / len;
          arr[i3]   = bx * k;
          arr[i3+1] = by * k;
          arr[i3+2] = bz * k;
        }
      }

      geometry.attributes.position.needsUpdate = true;

      material.uniforms.uOpacity.value +=
        (state.opacity - material.uniforms.uOpacity.value) * 0.065;

      if (material.uniforms.uOpacity.value > 0.005) {
        group.rotation.y += 0.0020 * (1 - eased * 0.25);
        group.rotation.x  = Math.sin(t * 0.18) * 0.018 * (1 - eased * 0.6);
      }

      const wp = toWorld(state.screenX, state.screenY);
      const lf = 0.045;

      group.position.x += (wp.x - group.position.x) * lf;
      group.position.y += (wp.y - group.position.y) * lf;
      group.scale.setScalar(
        group.scale.x + (state.scale - group.scale.x) * lf
      );

      renderer.render(scene, camera);
    };

    tick();

    // ────────────────────────────────────────────────────────────────────────
    // Resize
    // ────────────────────────────────────────────────────────────────────────
    const onResize = () => {
      sizes.width  = window.innerWidth;
      sizes.height = window.innerHeight;

      camera.aspect = sizes.width / sizes.height;
      camera.updateProjectionMatrix();
      renderer.setSize(sizes.width, sizes.height);

      const scrollY = window.scrollY || document.documentElement.scrollTop;
      if (scrollY < 80) {
        state.screenX = sizes.width  * 0.72;
        state.screenY = sizes.height * 0.46;
        state.scale   = 1.5;
        state.morph   = 1.0;
        snapToState();
      }

      ScrollTrigger.refresh();
    };

    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      ctx.revert();
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      draco.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={canvasRef}
      style={{
        position:       'fixed',
        inset:          0,
        zIndex:         40,
        pointerEvents:  'none',
        width:          '100%',
        height:         '100%',
        background:     'transparent',
      }}
    />
  );
};

export default GlobOrb;
