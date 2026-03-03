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

const VERT = `
  uniform float uProgress;
  uniform float uSize;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float sz = uSize * (1.0 + (1.0 - uProgress) * 0.9);
    gl_PointSize = sz * (7.5 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`;

const FRAG = `
  uniform vec3  uColorA;
  uniform vec3  uColorB;
  uniform vec3  uColorC;
  uniform float uProgress;
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

// dark: true  = sötét háttéren van → fehér/világos gömb
// dark: false = világos háttéren van → sötétkék/élénkkék gömb
const SECTIONS = [
  { id: 'hero',         xPct: 0.72, yPct: 0.5, progress: 0,   scale: 1.0,  dark: true  },
  { id: 'portfolio',    xPct: 0.18, yPct: 0.5, progress: 1,   scale: 0.85, dark: false },
  { id: 'testimonials', xPct: 0.78, yPct: 0.5, progress: 0.3, scale: 0.75, dark: false },
  { id: 'about',        xPct: 0.18, yPct: 0.5, progress: 1,   scale: 0.85, dark: false },
  { id: 'contact',      xPct: 0.5,  yPct: 0.5, progress: 0,   scale: 0.9,  dark: false },
] as const;

const GlobOrb = () => {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = window.innerWidth;
    const H = window.innerHeight;

    // ── RENDERER ──
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.domElement.style.position      = 'absolute';
    renderer.domElement.style.inset         = '0';
    renderer.domElement.style.width         = '100%';
    renderer.domElement.style.height        = '100%';
    renderer.domElement.style.display       = 'block';
    renderer.domElement.style.pointerEvents = 'none';
    renderer.toneMapping         = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    canvas.appendChild(renderer.domElement);

    // ── SCENE + CAMERA ──
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 100);
    camera.position.set(0, 0, 9);

    // ── FÉNYEK ──
    const ambLight = new THREE.AmbientLight(0xffffff, 0.07);
    scene.add(ambLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(5, 8, 5);
    scene.add(keyLight);

    const rim1 = new THREE.SpotLight(0xa8c8ff, 14);
    rim1.position.set(-9, 5, -9);
    rim1.angle    = 0.4;
    rim1.penumbra = 1.0;
    scene.add(rim1);

    const rim2 = new THREE.SpotLight(0xfff0f5, 9);
    rim2.position.set(10, -2, -10);
    rim2.angle    = 0.35;
    rim2.penumbra = 1.0;
    scene.add(rim2);

    const fillLight = new THREE.PointLight(0xfff5e0, 1.5);
    fillLight.position.set(0, -7, 4);
    scene.add(fillLight);

    // ── PARTICLE BUFFEREK ──
    const startPos  = new Float32Array(PARTICLE_COUNT * 3);
    const targetPos = new Float32Array(PARTICLE_COUNT * 3);
    const randOff   = new Float32Array(PARTICLE_COUNT * 3);
    const livePos   = new Float32Array(PARTICLE_COUNT * 3);

    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const y     = 1 - (i / (PARTICLE_COUNT - 1)) * 2;
      const r     = Math.sqrt(Math.max(0, 1 - y * y)) * SPHERE_RADIUS;
      const theta = goldenAngle * i;

      startPos[i * 3]     = livePos[i * 3]     = Math.cos(theta) * r;
      startPos[i * 3 + 1] = livePos[i * 3 + 1] = y * SPHERE_RADIUS;
      startPos[i * 3 + 2] = livePos[i * 3 + 2] = Math.sin(theta) * r;

      randOff[i * 3]     = (Math.random() - 0.5) * 0.5;
      randOff[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
      randOff[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
    }

    // ── GEOMETRY + MATERIAL ──
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(livePos, 3));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uProgress: { value: 0 },
        uColorA:   { value: new THREE.Color('#1a3aff') },
        uColorB:   { value: new THREE.Color('#88bbff') },
        uColorC:   { value: new THREE.Color('#ffffff') },
        uSize:     { value: renderer.getPixelRatio() > 1 ? 3.2 : 2.6 },
      },
      vertexShader:   VERT,
      fragmentShader: FRAG,
      transparent:    true,
      depthWrite:     false,
      blending:       THREE.AdditiveBlending,
    });

    const group = new THREE.Group();
    group.add(new THREE.Points(geometry, material));
    scene.add(group);

    // ── GLB BETÖLTÉS ──
    let loaded = false;

    const draco = new DRACOLoader();
    draco.setDecoderPath(DRACO_DECODER);

    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);

    loader.load(
      '/sajat-fogam.glb',
      (gltf) => {
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
          if (verts[i]     < minX) minX = verts[i];
          if (verts[i]     > maxX) maxX = verts[i];
          if (verts[i + 1] < minY) minY = verts[i + 1];
          if (verts[i + 1] > maxY) maxY = verts[i + 1];
        }

        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        const sc = FOG_SCALE / (maxY - minY);
        const vc = verts.length / 3;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const ri = Math.floor(Math.random() * vc);
          targetPos[i * 3]     = (verts[ri * 3]     - cx) * sc;
          targetPos[i * 3 + 1] = (verts[ri * 3 + 1] - cy) * sc;
          targetPos[i * 3 + 2] =  verts[ri * 3 + 2]        * sc;
        }

        loaded = true;
      },
      undefined,
      (err) => console.error('GLB hiba:', err)
    );

    // ── GSAP SCROLL STATE ──
    const state = {
      progress:  0,
      x:         W * 0.72,
      y:         H * 0.5,
      scale:     1.0,
      rotY:      0,
      colorMode: 1, // 1 = sötét háttér (fehér gömb), 0 = világos háttér (kék gömb)
    };

    SECTIONS.forEach((sec, idx) => {
      const el   = document.getElementById(sec.id);
      const next = SECTIONS[idx + 1] ? document.getElementById(SECTIONS[idx + 1].id) : null;
      if (!el) return;

      gsap.timeline({
        scrollTrigger: {
          trigger:             el,
          start:               'top 60%',
          endTrigger:          next ?? el,
          end:                 next ? 'top 60%' : 'bottom bottom',
          scrub:               1.5,
          scroller:            window,
          invalidateOnRefresh: true,
        },
      }).to(state, {
        x:         () => window.innerWidth  * sec.xPct,
        y:         () => window.innerHeight * sec.yPct,
        progress:  sec.progress,
        scale:     sec.scale,
        colorMode: sec.dark ? 1 : 0,
        rotY:      state.rotY + Math.PI * (idx % 2 === 0 ? 0.8 : -0.8),
        duration:  1,
        ease:      'power2.inOut',
      });
    });

    setTimeout(() => ScrollTrigger.refresh(), 400);

    // ── RENDER LOOP ──
    let animId: number;
    const clock = new THREE.Clock();

    const tick = () => {
      animId = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();

      // ── SZÍN VÁLTÁS HÁTTÉR ALAPJÁN ──
      const cm = state.colorMode;
      if (cm >= 0.5) {
        // Sötét háttér → fehér/világoskék gömb
        material.uniforms.uColorA.value.set('#1a3aff');
        material.uniforms.uColorB.value.set('#88bbff');
        material.uniforms.uColorC.value.set('#ffffff');
      } else {
        // Világos háttér → sötétkék/élénkkék gömb
        material.uniforms.uColorA.value.set('#001899');
        material.uniforms.uColorB.value.set('#0044ee');
        material.uniforms.uColorC.value.set('#1166ff');
      }

      if (loaded) {
        const p     = state.progress;
        const eased = p < 0.5
          ? 4 * p * p * p
          : 1 - Math.pow(-2 * p + 2, 3) / 2;

        material.uniforms.uProgress.value = eased;

        const posArr = geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const i3 = i * 3;
          const os = 1 - eased;
          const wn = Math.sin(t * 0.5 + i * 0.007) * os * 0.1;
          posArr[i3]     = startPos[i3]     + (targetPos[i3]     - startPos[i3])     * eased + randOff[i3]     * os + wn;
          posArr[i3 + 1] = startPos[i3 + 1] + (targetPos[i3 + 1] - startPos[i3 + 1]) * eased + randOff[i3 + 1] * os;
          posArr[i3 + 2] = startPos[i3 + 2] + (targetPos[i3 + 2] - startPos[i3 + 2]) * eased + randOff[i3 + 2] * os;
        }
        geometry.attributes.position.needsUpdate = true;
        group.position.y += Math.sin(t * 0.9) * 0.04 * eased;
      } else {
        group.rotation.y += 0.005;
        group.rotation.x  = Math.sin(clock.getElapsedTime() * 0.6) * 0.12;
      }

      // ── POZÍCIÓ LERP ──
      const fovRad  = THREE.MathUtils.degToRad(19);
      const halfH3D = Math.tan(fovRad) * 9;
      const halfW3D = halfH3D * camera.aspect;

      const tx = (state.x / window.innerWidth  - 0.5) * 2 * halfW3D;
      const ty = (0.5 - state.y / window.innerHeight) * 2 * halfH3D;

      group.position.x += (tx - group.position.x) * 0.06;
      group.position.y += (ty - group.position.y) * 0.06;

      // ── SCALE LERP ──
      const cs = group.scale.x;
      group.scale.setScalar(cs + (state.scale - cs) * 0.06);

      // ── FORGÁS ──
      const rotSpeed = 0.25 * (1 - material.uniforms.uProgress.value * 0.85);
      group.rotation.y = state.rotY + t * rotSpeed;
      group.rotation.x = Math.sin(t * 0.4) * 0.06 * material.uniforms.uProgress.value;

      renderer.render(scene, camera);
    };

    tick();

    // ── RESIZE ──
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      ScrollTrigger.refresh();
    };
    window.addEventListener('resize', onResize);

    // ── CLEANUP ──
    return () => {
      cancelAnimationFrame(animId);
      ScrollTrigger.getAll().forEach(st => st.kill());
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      draco.dispose();
      if (canvas.contains(renderer.domElement)) {
        canvas.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={canvasRef}
      style={{
        position:      'fixed',
        inset:         0,
        zIndex:        20,
        pointerEvents: 'none',
        width:         '100%',
        height:        '100%',
      }}
    />
  );
};

export default GlobOrb;
