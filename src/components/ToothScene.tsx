import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const PARTICLE_COUNT = 6000;
const DRACO_DECODER  = 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/';
const SPHERE_RADIUS  = 2.6;
const FOG_SCALE      = 2.8;

const PANELS = [
  {
    label:     'Precizitás',
    title:     'CAD/CAM\nTechnológia',
    body:      'Digitális tervezés és gépi marás kombinációja — minden korona mikrométer pontossággal illeszkedik.',
    stat:      '0.02mm',
    statLabel: 'tolerancia',
    justify:   'justify-end',
  },
  {
    label:     'Esztétika',
    title:     'Természetes\nMegjelenés',
    body:      'A fogszín, forma és áttetszőség tökéletes harmóniája. Pácienseid nem fogják tudni megkülönböztetni a természetes fogtól.',
    stat:      '16',
    statLabel: 'fogszín árnyalat',
    justify:   'justify-start',
  },
] as const;

const VERT = /* glsl */`
  uniform float uProgress;
  uniform float uSize;
  varying float vProgress;
  void main() {
    vProgress = uProgress;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float sz = uSize * (1.0 + (1.0 - uProgress) * 0.9);
    gl_PointSize = sz * (7.5 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */`
  uniform vec3  uColorA;
  uniform vec3  uColorB;
  uniform vec3  uColorC;
  uniform float uProgress;
  varying float vProgress;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.04, d);
    vec3 color;
    if (uProgress < 0.5) {
      color = mix(uColorA, uColorB, uProgress * 2.0);
    } else {
      color = mix(uColorB, uColorC, (uProgress - 0.5) * 2.0);
    }
    float baseAlpha = mix(0.4, 1.0, uProgress);
    gl_FragColor = vec4(color, alpha * baseAlpha);
  }
`;

const ToothScene = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef  = useRef<HTMLDivElement>(null);
  const panel0Ref  = useRef<HTMLDivElement>(null);
  const panel1Ref  = useRef<HTMLDivElement>(null);
  const scrollRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas  = canvasRef.current;
    if (!wrapper || !canvas) return;

    // ── RENDERER ──
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.toneMapping         = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    canvas.appendChild(renderer.domElement);

    // ── SCENE + CAMERA ──
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 9);

    // ── FÉNYEK ──
    scene.add(new THREE.AmbientLight(0xffffff, 0.07));
    const key = new THREE.DirectionalLight(0xffffff, 3.2);
    key.position.set(5, 8, 5); scene.add(key);
    const rim1 = new THREE.SpotLight(0xa8c8ff, 14);
    rim1.position.set(-9, 5, -9); rim1.angle = 0.4; rim1.penumbra = 1; scene.add(rim1);
    const rim2 = new THREE.SpotLight(0xfff0f5, 9);
    rim2.position.set(10, -2, -10); rim2.angle = 0.35; rim2.penumbra = 1; scene.add(rim2);
    const fill = new THREE.PointLight(0xfff5e0, 1.5);
    fill.position.set(0, -7, 4); scene.add(fill);

    // ── PARTICLE BUFFEREK ──
    const startPos   = new Float32Array(PARTICLE_COUNT * 3);
    const targetPos  = new Float32Array(PARTICLE_COUNT * 3);
    const randOffset = new Float32Array(PARTICLE_COUNT * 3);
    const livePos    = new Float32Array(PARTICLE_COUNT * 3);

    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const y     = 1 - (i / (PARTICLE_COUNT - 1)) * 2;
      const r     = Math.sqrt(Math.max(0, 1 - y * y)) * SPHERE_RADIUS;
      const theta = goldenAngle * i;
      startPos[i*3]   = Math.cos(theta) * r;
      startPos[i*3+1] = y * SPHERE_RADIUS;
      startPos[i*3+2] = Math.sin(theta) * r;
      randOffset[i*3]   = (Math.random() - 0.5) * 0.5;
      randOffset[i*3+1] = (Math.random() - 0.5) * 0.5;
      randOffset[i*3+2] = (Math.random() - 0.5) * 0.5;
      livePos[i*3]   = startPos[i*3];
      livePos[i*3+1] = startPos[i*3+1];
      livePos[i*3+2] = startPos[i*3+2];
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(livePos, 3));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uProgress: { value: 0 },
        uTime:     { value: 0 },
        uColorA:   { value: new THREE.Color('#2a5fff') },
        uColorB:   { value: new THREE.Color('#cce4ff') },
        uColorC:   { value: new THREE.Color('#ffffff') },
        uSize:     { value: renderer.getPixelRatio() > 1 ? 3.2 : 2.6 },
      },
      vertexShader:   VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite:  false,
      blending:    THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    const group  = new THREE.Group();
    group.add(points);
    scene.add(group);

    // ── GLB BETÖLTÉS ──
    let loaded = false;
    const draco = new DRACOLoader();
    draco.setDecoderPath(DRACO_DECODER);
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(draco);

    gltfLoader.load('/sajat-fogam.glb', (gltf) => {
      const verts: number[] = [];
      gltf.scene.traverse((child) => {
        if (!(child as THREE.Mesh).isMesh) return;
        const mesh = child as THREE.Mesh;
        mesh.updateWorldMatrix(true, false);
        const pos = mesh.geometry.attributes.position;
        const wp  = new THREE.Vector3();
        for (let i = 0; i < pos.count; i++) {
          wp.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
          verts.push(wp.x, wp.y, wp.z);
        }
      });
      if (!verts.length) return;

      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      for (let i = 0; i < verts.length; i += 3) {
        if (verts[i]   < minX) minX = verts[i];
        if (verts[i]   > maxX) maxX = verts[i];
        if (verts[i+1] < minY) minY = verts[i+1];
        if (verts[i+1] > maxY) maxY = verts[i+1];
      }
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      const sc = FOG_SCALE / (maxY - minY);
      const vc = verts.length / 3;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const ri = Math.floor(Math.random() * vc);
        targetPos[i*3]   = (verts[ri*3]   - cx) * sc;
        targetPos[i*3+1] = (verts[ri*3+1] - cy) * sc;
        targetPos[i*3+2] =  verts[ri*3+2]        * sc;
      }
      loaded = true;
    });

    // ─────────────────────────────────────────────
    // GSAP SCROLL
    // wrapper = 400vh, sticky = 100vh
    //
    // Scroll haladás (0→1):
    //  0.00–0.25 → gömb összegyűlik foggá (középen)
    //  0.25–0.50 → fog jobbra csúszik, panel0 jön balról  ← JAVÍTOTT IRÁNY
    //  0.50–0.75 → fog balra csúszik,  panel1 jön jobbról ← JAVÍTOTT IRÁNY
    //  0.75–1.00 → fog visszaközép, elhalványul
    // ─────────────────────────────────────────────
    const state = {
      progress: 0,
      groupX:   0,
      groupY:   0,
      groupRY:  0,
    };

    // Egyetlen timeline, 4 egységnyi (mindegyik 100vh = 1 egység)
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger:       wrapper,
        start:         'top top',        // wrapper teteje eléri a viewport tetejét
        end:           'bottom bottom',  // wrapper alja eléri a viewport alját
        scrub:         1.2,
        // invalidateOnRefresh frissíti ha resize történik
        invalidateOnRefresh: true,
      },
    });

    // Fázis 1 (0–1): gömb → fog, középen marad
    tl.to(state, {
      progress: 1,
      groupRY:  Math.PI * 1.8,
      duration: 1,
      ease: 'power2.inOut',
    }, 0);

    // Fázis 2 (1–2): fog jobbra (szöveg panel0 bal oldalon)
    tl.to(state, {
      groupX:  2.8,
      groupY:  0.2,
      duration: 1,
      ease: 'power3.inOut',
    }, 1);

    // Fázis 3 (2–3): fog balra (szöveg panel1 jobb oldalon)
    tl.to(state, {
      groupX: -2.8,
      groupY: -0.2,
      duration: 1,
      ease: 'power3.inOut',
    }, 2);

    // Fázis 4 (3–4): visszaközép
    tl.to(state, {
      groupX: 0,
      groupY: 0,
      duration: 1,
      ease: 'power2.inOut',
    }, 3);

    // ── PANEL 0 (fázis 2: 25%–50%) — fog jobbra, szöveg bal oldalon ──
    const p0 = panel0Ref.current;
    if (p0) {
      gsap.timeline({
        scrollTrigger: {
          trigger:             wrapper,
          start:               '25% top',
          end:                 '50% top',
          scrub:               1.2,
          invalidateOnRefresh: true,
        },
      })
        .fromTo(p0,
          { opacity: 0, x: -60, filter: 'blur(10px)' },
          { opacity: 1, x:   0, filter: 'blur(0px)',  duration: 0.4, ease: 'power2.out' }
        )
        .to(p0,
          { opacity: 0, x:  60, filter: 'blur(10px)', duration: 0.4, ease: 'power2.in' },
          0.6
        );
    }

    // ── PANEL 1 (fázis 3: 50%–75%) — fog balra, szöveg jobb oldalon ──
    const p1 = panel1Ref.current;
    if (p1) {
      gsap.timeline({
        scrollTrigger: {
          trigger:             wrapper,
          start:               '50% top',
          end:                 '75% top',
          scrub:               1.2,
          invalidateOnRefresh: true,
        },
      })
        .fromTo(p1,
          { opacity: 0, x:  60, filter: 'blur(10px)' },
          { opacity: 1, x:   0, filter: 'blur(0px)',  duration: 0.4, ease: 'power2.out' }
        )
        .to(p1,
          { opacity: 0, x: -60, filter: 'blur(10px)', duration: 0.4, ease: 'power2.in' },
          0.6
        );
    }

    // Scroll label eltűnik 8% után
    const sl = scrollRef.current;
    if (sl) {
      gsap.to(sl, {
        opacity: 0, y: 10,
        scrollTrigger: {
          trigger: wrapper,
          start:   'top top',
          end:     '8% top',
          scrub:   1,
        },
      });
    }

    // ── RENDER LOOP ──
    let animId: number;
    const clock = new THREE.Clock();

    const tick = () => {
      animId = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();
      material.uniforms.uTime.value = t;

      if (loaded) {
        const p = state.progress;
        const eased = p < 0.5
          ? 4 * p * p * p
          : 1 - Math.pow(-2 * p + 2, 3) / 2;

        material.uniforms.uProgress.value = eased;

        const posArr = geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const i3 = i * 3;
          const os  = 1 - eased;
          const wn  = Math.sin(t * 0.5 + i * 0.007) * os * 0.1;
          posArr[i3]   = startPos[i3]   + (targetPos[i3]   - startPos[i3])   * eased + randOffset[i3]   * os + wn;
          posArr[i3+1] = startPos[i3+1] + (targetPos[i3+1] - startPos[i3+1]) * eased + randOffset[i3+1] * os;
          posArr[i3+2] = startPos[i3+2] + (targetPos[i3+2] - startPos[i3+2]) * eased + randOffset[i3+2] * os;
        }
        geometry.attributes.position.needsUpdate = true;

        group.position.x += (state.groupX - group.position.x) * 0.07;
        group.position.y += (state.groupY - group.position.y) * 0.07;
        group.position.y += Math.sin(t * 0.9) * 0.04 * eased;

        const rotSpeed = 0.25 * (1 - eased * 0.85);
        group.rotation.y = state.groupRY + t * rotSpeed;
        group.rotation.x = Math.sin(t * 0.4) * 0.06 * eased;
      } else {
        group.rotation.y += 0.005;
        group.rotation.x = Math.sin(clock.getElapsedTime() * 0.6) * 0.12;
      }

      renderer.render(scene, camera);
    };
    tick();

    // ── RESIZE ──
    const onResize = () => {
      if (!canvas) return;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
      ScrollTrigger.refresh();
    };
    window.addEventListener('resize', onResize);

    // ScrollTrigger refresh egyszer az első render után
    setTimeout(() => ScrollTrigger.refresh(), 100);

    return () => {
      cancelAnimationFrame(animId);
      ScrollTrigger.getAll().forEach(st => st.kill());
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      draco.dispose();
      if (canvas.contains(renderer.domElement)) canvas.removeChild(renderer.domElement);
    };
  }, []);

  return (
    // 400vh = 4 scroll fázis × 100vh
    <div ref={wrapperRef} style={{ height: '400vh', position: 'relative' }}>

      {/* Sötét háttér — csak a section-dark class, semmi extra height */}
      <div className="sticky top-0 section-dark overflow-hidden" style={{ height: '100vh' }}>

        {/* Three.js canvas — teljes sticky viewport */}
        <div ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 10 }} />

        {/* Scroll indikátor */}
        <div
          ref={scrollRef}
          style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', zIndex: 30 }}
          className="flex flex-col items-center gap-3 pointer-events-none select-none"
        >
          <span className="text-[8px] tracking-[0.55em] uppercase text-white/20">Görgess</span>
          <div className="w-[1px] h-10 bg-gradient-to-b from-white/25 to-transparent" />
        </div>

        {/* PANEL 0 — fog jobb, szöveg bal */}
        <div
          ref={panel0Ref}
          className="flex items-center justify-start pointer-events-none select-none"
          style={{
            position: 'absolute', inset: 0, zIndex: 20,
            paddingLeft: 'clamp(3rem, 8vw, 7rem)',
            opacity: 0,
          }}
        >
          <div style={{ maxWidth: 300 }}>
            <p className="text-[9px] tracking-[0.45em] uppercase text-white/25 mb-4">{PANELS[0].label}</p>
            <h3 className="text-5xl font-bold text-white leading-tight tracking-tight mb-5 whitespace-pre-line">
              {PANELS[0].title}
            </h3>
            <p className="text-[13px] text-white/45 font-light leading-relaxed mb-6">{PANELS[0].body}</p>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.25rem' }}>
              <span className="text-[52px] font-black text-white leading-none tracking-tighter">{PANELS[0].stat}</span>
              <span className="ml-3 text-[10px] text-white/25 uppercase tracking-[0.3em] align-middle">{PANELS[0].statLabel}</span>
            </div>
          </div>
        </div>

        {/* PANEL 1 — fog bal, szöveg jobb */}
        <div
          ref={panel1Ref}
          className="flex items-center justify-end pointer-events-none select-none"
          style={{
            position: 'absolute', inset: 0, zIndex: 20,
            paddingRight: 'clamp(3rem, 8vw, 7rem)',
            opacity: 0,
          }}
        >
          <div style={{ maxWidth: 300 }}>
            <p className="text-[9px] tracking-[0.45em] uppercase text-white/25 mb-4">{PANELS[1].label}</p>
            <h3 className="text-5xl font-bold text-white leading-tight tracking-tight mb-5 whitespace-pre-line">
              {PANELS[1].title}
            </h3>
            <p className="text-[13px] text-white/45 font-light leading-relaxed mb-6">{PANELS[1].body}</p>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.25rem' }}>
              <span className="text-[52px] font-black text-white leading-none tracking-tighter">{PANELS[1].stat}</span>
              <span className="ml-3 text-[10px] text-white/25 uppercase tracking-[0.3em] align-middle">{PANELS[1].statLabel}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ToothScene;
