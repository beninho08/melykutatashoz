/**
 * GlobOrb.tsx – Teljes újraírás
 *
 * LOGIKA:
 *  morph 1.0 = fog alak  (toothPos)
 *  morph 0.0 = gömb alak (spherePos)
 *
 * FLOW:
 *  1. Oldal betölt → GLB tölt → fog látszik (hero jobb oldalán)
 *  2. Hero scrollozás (hero 250vh magas):
 *     0–40%  : fog áll, forog, jól látható
 *     40–70% : fog → gömb morph
 *     70–100%: gömb zsugorodik bal-alsó sarokba, elfogy
 *  3. Footer belép → alulról fade-in, gömb → fog visszaépül, fix középre kerül
 *  4. Footer végig visible → fog megmarad ott, NEM mozdul
 *
 * NAVBAR FIX:
 *  A Navigation.tsx a #hero section.section-dark osztályát nézi,
 *  nem scrollY-t → soha nem vált fehérre a hero tetején.
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ─── Konstansok ───────────────────────────────────────────────────────────────
const PARTICLE_COUNT = 15_000;
const DRACO_DECODER  = 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/';
const SPHERE_RADIUS  = 1.6;
const FOG_SCALE      = 2.2;
const CORNER_MARGIN  = 20;
const CORNER_ICON    = 56;

// ─── Vertex Shader ────────────────────────────────────────────────────────────
// uProgress=1 → fog (kisebb pontok, sűrűbb)
// uProgress=0 → gömb (nagyobb, lazább pontok)
const VERT = /* glsl */ `
  uniform float uProgress;
  uniform float uSize;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    // fog esetén kicsit nagyobb pontok (1+progress*0.5)
    float sz = uSize * (1.0 + uProgress * 0.5);
    gl_PointSize = sz * (7.5 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`;

// ─── Fragment Shader ──────────────────────────────────────────────────────────
const FRAG = /* glsl */ `
  uniform vec3  uColor;
  uniform float uOpacity;
  void main() {
    vec2  uv    = gl_PointCoord - 0.5;
    float dist  = length(uv);
    if (dist > 0.5) discard;
    // lágyan kifutó korong
    float alpha = smoothstep(0.5, 0.05, dist) * uOpacity;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

// ─── Segéd: gömb seed pozíciók ────────────────────────────────────────────────
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

// ─── Segéd: eased morph érték ─────────────────────────────────────────────────
function cubicInOut(p: number): number {
  return p < 0.5 ? 4*p*p*p : 1 - Math.pow(-2*p + 2, 3) / 2;
}

// ─── Komponens ────────────────────────────────────────────────────────────────
const GlobOrb = () => {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;

    // ── Méretek ──
    const sizes = { width: window.innerWidth, height: window.innerHeight };

    // ── Renderer ──
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

    // ── Scene / Camera ──
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, sizes.width / sizes.height, 0.1, 100);
    camera.position.set(0, 0, 9);
    scene.add(camera);

    // ── Partikulák: 3 buffer ──
    // spherePos : gömb alak  (morph=0 végpont)
    // toothPos  : fog alak   (morph=1 végpont, GLB-ből töltjük)
    // livePos   : GPU-ra megy (dinamikusan frissítjük)
    const spherePos = buildSpherePositions(PARTICLE_COUNT);
    const toothPos  = new Float32Array(PARTICLE_COUNT * 3); // majd GLB-ből
    const livePos   = new Float32Array(PARTICLE_COUNT * 3);

    // Induláskor a livePos = spherePos (fallback, amíg GLB be nem tölt)
    livePos.set(spherePos);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(livePos, 3).setUsage(THREE.DynamicDrawUsage)
    );

    // ── Material ──
    // uOpacity=0 induláskor → fog betöltéséig láthatatlan (nincs random gömb-villanás!)
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uProgress: { value: 1.0 },           // fog alap
        uColor:    { value: new THREE.Color('#dce6f0') }, // kékes-fehér
        uOpacity:  { value: 0.0 },           // !! láthatatlan induláskor
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

    // ── Animáció state (GSAP ezt tweeneli) ──
    // Képernyő-koordinátákban dolgozunk (px), a render loop konvertálja 3D-be
    const state = {
      screenX:    sizes.width  * 0.72,  // fog hero pozíció
      screenY:    sizes.height * 0.46,
      scale:      1.2,
      morph:      1.0,                  // 1=fog, 0=gömb
      opacity:    0.0,                  // GLB betöltésig 0
      // footer státusz: ha true, a fog fix pozícióban marad
      footerLocked: false,
      footerX:    0,
      footerY:    0,
    };

    // ── Segéd: screen → 3D world koordináta ──
    const toWorld = (sx: number, sy: number) => {
      const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * camera.position.z;
      const halfW = halfH * (sizes.width / sizes.height);
      return {
        x:  ((sx / sizes.width)  - 0.5) * 2 * halfW,
        y: ((0.5 - sy / sizes.height)) * 2 * halfH,
      };
    };

    // ── Azonnali snap (LERP nélkül) ──
    const snapToState = () => {
      const wp = toWorld(state.screenX, state.screenY);
      group.position.x = wp.x;
      group.position.y = wp.y;
      group.scale.setScalar(state.scale);
    };

    // ── Bal-alsó sarok képernyő-koordinátái ──
    const getCorner = () => ({
      x: CORNER_MARGIN + CORNER_ICON / 2,
      y: window.innerHeight - CORNER_MARGIN - CORNER_ICON / 2,
    });

    // ── Footer fog pozíció kiszámítása ──
    // A footer közepére kerül, de a viewport tetején mért Y alapján
    const getFooterCenter = () => {
      const footer = document.querySelector('footer');
      if (!footer) return { x: sizes.width * 0.5, y: sizes.height * 0.5 };
      const rect = footer.getBoundingClientRect();
      // Footer belső Y-ja viewport-hoz képest: közepe körülbelül 40%-nál
      const y = rect.top + rect.height * 0.40;
      return { x: sizes.width * 0.5, y };
    };

    // ──────────────────────────────────────────────────────────────────────────
    // GLB betöltés
    // ──────────────────────────────────────────────────────────────────────────
    let glbLoaded = false;

    const draco = new DRACOLoader();
    draco.setDecoderPath(DRACO_DECODER);
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);

    loader.load(
      '/sajat-fogam.glb',
      (gltf) => {
        // Összes vertex összegyűjtése world space-ben
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

        // Bounding box → normalizálás FOG_SCALE méretbe
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

        // toothPos feltöltése (egyenletesen mintavételezve)
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

        // livePos = fog pozíció azonnal (morph=1)
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          livePos[i*3]   = toothPos[i*3];
          livePos[i*3+1] = toothPos[i*3+1];
          livePos[i*3+2] = toothPos[i*3+2];
        }
        geometry.attributes.position.needsUpdate = true;
        glbLoaded = true;

        // Azonnali pozíció (ne LERP-eljen a semmibe)
        snapToState();

        // ScrollTrigger frissítés (hero magasság most már stabil)
        ScrollTrigger.refresh();

        // Fog megjelenik: lassú fade-in
        gsap.to(state, {
          opacity: 0.50,
          duration: 1.4,
          ease: 'power2.inOut',
        });
      },
      undefined,
      (err) => console.error('GlobOrb GLB hiba:', err)
    );

    // ──────────────────────────────────────────────────────────────────────────
    // GSAP ScrollTrigger animációk
    // Lenis smooth scroll miatt NEM használunk pin:true-t!
    // A #hero section 250vh magas → elég scroll távolság a 3 fázisnak.
    // ──────────────────────────────────────────────────────────────────────────
    const ctx = gsap.context(() => {

      // ── HERO animáció ─────────────────────────────────────────────────────
      // trigger: #hero (250vh magas section)
      // start: teteje a viewport tetején
      // end:   alja a viewport tetején
      // → teljes 250vh scrollozás alatt fut le
      //
      // Fázis 1 (0–40%):  fog forog a hero jobb oldalán, mozdulatlan
      // Fázis 2 (40–72%): fog → gömb átalakulás, helyben
      // Fázis 3 (72–100%): gömb zsugorodik bal-alsó sarokba + fade out

      const heroTl = gsap.timeline({
        scrollTrigger: {
          trigger: '#hero',
          start:   'top top',
          end:     'bottom top',
          scrub:   1.5,
          invalidateOnRefresh: true,
        },
      });

      // Fázis 1: fog marad (0.40 duration = 40%)
      heroTl.to(state, {
        screenX:    () => sizes.width  * 0.72,
        screenY:    () => sizes.height * 0.46,
        scale:      1.2,
        morph:      1.0,
        opacity:    0.50,
        duration:   0.40,
        ease:       'none',
      });

      // Fázis 2: fog → gömb (0.32 duration = 32%)
      heroTl.to(state, {
        screenX:    () => sizes.width  * 0.72,
        screenY:    () => sizes.height * 0.46,
        scale:      1.05,
        morph:      0.0,
        opacity:    0.45,
        duration:   0.32,
        ease:       'power2.inOut',
      });

      // Fázis 3: sarokba + eltűnik (0.28 duration = 28%)
      heroTl.to(state, {
        screenX:    () => getCorner().x,
        screenY:    () => getCorner().y,
        scale:      0.09,
        morph:      0.0,
        opacity:    0.0,
        duration:   0.28,
        ease:       'power3.inOut',
      });

      // ── FOOTER animáció ───────────────────────────────────────────────────
      // Footer alulról jön be → fog visszaépül és FIX MARAD.
      // A fromTo biztosítja hogy pontosan tudjuk honnan indul.
      //
      // start: footer teteje a viewport 95%-ánál (már belép)
      // end:   footer teteje a viewport 20%-ánál (jól látható)

      const footerTl = gsap.timeline({
        scrollTrigger: {
          trigger:  'footer',
          start:    'top 95%',
          end:      'top 20%',
          scrub:    1.8,
          invalidateOnRefresh: true,
          onEnter: () => {
            // Biztosítjuk hogy az előző hero animáció ne írja felül
            state.footerLocked = false;
          },
          onLeaveBack: () => {
            // Ha visszagörgetnek a footer fölé, töröljük a lockot
            state.footerLocked = false;
          },
          onScrubComplete: () => {
            // Animáció vége: fog fix pozícióban marad
            if (state.morph > 0.95) {
              const fc = getFooterCenter();
              state.footerLocked = true;
              state.footerX = fc.x;
              state.footerY = fc.y;
            }
          },
        },
      });

      footerTl.fromTo(
        state,
        // FROM: képernyőn kívülről, sarok méretű, láthatatlan
        {
          screenX:  () => sizes.width * 0.5,
          screenY:  () => sizes.height * 1.20,  // viewport alatt
          scale:    0.12,
          morph:    0.0,
          opacity:  0.0,
        },
        // TO: footer közepére, fog méretű, látható
        {
          screenX:  () => sizes.width * 0.5,
          screenY:  () => getFooterCenter().y,
          scale:    1.15,
          morph:    1.0,
          opacity:  0.50,
          ease:     'power2.out',
        }
      );
    });

    // Kis késleltetés utáni refresh (layout stabilitás)
    setTimeout(() => ScrollTrigger.refresh(), 700);

    // ──────────────────────────────────────────────────────────────────────────
    // Stray partikulák: néhány részecske finom lélegző mozgást végez
    // ──────────────────────────────────────────────────────────────────────────
    const STRAY_COUNT = 18;
    const strayIdx: number[] = [];
    for (let i = 0; i < STRAY_COUNT; i++) {
      strayIdx.push(Math.floor(Math.random() * PARTICLE_COUNT));
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Render loop
    // ──────────────────────────────────────────────────────────────────────────
    let animId: number;
    const clock = new THREE.Clock();

    const tick = () => {
      animId = requestAnimationFrame(tick);
      const t   = clock.getElapsedTime();
      const arr = geometry.attributes.position.array as Float32Array;

      // ── morph számítás ──
      const rawP  = THREE.MathUtils.clamp(state.morph, 0, 1);
      const eased = cubicInOut(rawP);
      material.uniforms.uProgress.value = eased;

      // ── partikula pozíciók interpolálása ──
      if (glbLoaded) {
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const i3 = i * 3;
          arr[i3]   = spherePos[i3]   + (toothPos[i3]   - spherePos[i3])   * eased;
          arr[i3+1] = spherePos[i3+1] + (toothPos[i3+1] - spherePos[i3+1]) * eased;
          arr[i3+2] = spherePos[i3+2] + (toothPos[i3+2] - spherePos[i3+2]) * eased;
        }
      }

      // ── stray mozgás (csak gömb közelében) ──
      if (rawP < 0.80) {
        const amp = 0.018 * (1 - rawP / 0.80); // gömbhöz közel erősebb
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

      // ── opacity smooth follow ──
      material.uniforms.uOpacity.value +=
        (state.opacity - material.uniforms.uOpacity.value) * 0.065;

      // ── forgás (fog esetén lassan, gömb esetén gyorsabban) ──
      if (material.uniforms.uOpacity.value > 0.005) {
        group.rotation.y += 0.0020 * (1 - eased * 0.25);
        group.rotation.x  = Math.sin(t * 0.18) * 0.018 * (1 - eased * 0.6);
      }

      // ── pozíció + méret smooth LERP ──
      // Ha footer-locked, a fix pozíciót használjuk
      const targetX = state.footerLocked ? state.footerX : state.screenX;
      const targetY = state.footerLocked ? state.footerY : state.screenY;

      const wp = toWorld(targetX, targetY);
      const lf = 0.045; // LERP faktor

      group.position.x += (wp.x - group.position.x) * lf;
      group.position.y += (wp.y - group.position.y) * lf;
      group.scale.setScalar(
        group.scale.x + (state.scale - group.scale.x) * lf
      );

      renderer.render(scene, camera);
    };

    tick();

    // ──────────────────────────────────────────────────────────────────────────
    // Resize handler
    // ──────────────────────────────────────────────────────────────────────────
    const onResize = () => {
      sizes.width  = window.innerWidth;
      sizes.height = window.innerHeight;

      camera.aspect = sizes.width / sizes.height;
      camera.updateProjectionMatrix();
      renderer.setSize(sizes.width, sizes.height);

      // Ha még a hero tetején vagyunk, snap vissza
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      if (scrollY < 80) {
        state.screenX = sizes.width  * 0.72;
        state.screenY = sizes.height * 0.46;
        state.scale   = 1.2;
        state.morph   = 1.0;
        snapToState();
      }

      ScrollTrigger.refresh();
    };

    window.addEventListener('resize', onResize);

    // ──────────────────────────────────────────────────────────────────────────
    // Cleanup
    // ──────────────────────────────────────────────────────────────────────────
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
