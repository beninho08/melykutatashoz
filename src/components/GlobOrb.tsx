import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const PARTICLE_COUNT = 9000;
const DRACO_DECODER  = 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/';
const SPHERE_RADIUS  = 1.6;
const FOG_SCALE      = 2.2;

const VERT = `
  uniform float uProgress;
  uniform float uSize;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float sz = uSize * (1.0 + (1.0 - uProgress) * 0.5);
    gl_PointSize = sz * (7.5 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`;

const FRAG = `
  uniform vec3  uColor;
  uniform float uOpacity;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    if (length(uv) > 0.5) discard;
    float alpha = smoothstep(0.5, 0.05, length(uv)) * uOpacity;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

const GlobOrb = () => {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = window.innerWidth;
    const H = window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    Object.assign(renderer.domElement.style, {
      position: 'absolute', inset: '0',
      width: '100%', height: '100%',
      display: 'block', pointerEvents: 'none',
    });
    canvas.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    // FOV 38 fokos kamera — toWorld() is ezt használja
    const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 100);
    camera.position.set(0, 0, 9);

    // ── Particle bufferek ──
    const startPos  = new Float32Array(PARTICLE_COUNT * 3);
    const targetPos = new Float32Array(PARTICLE_COUNT * 3);
    const livePos   = new Float32Array(PARTICLE_COUNT * 3);

    // Véletlenszerű gömb — nem golden spiral, szétszórtabb
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const u     = Math.random();
      const v     = Math.random();
      const theta = 2 * Math.PI * u;
      const phi   = Math.acos(2 * v - 1);
      const r     = SPHERE_RADIUS * (0.88 + Math.random() * 0.24);
      startPos[i*3]   = livePos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
      startPos[i*3+1] = livePos[i*3+1] = r * Math.cos(phi);
      startPos[i*3+2] = livePos[i*3+2] = r * Math.sin(phi) * Math.sin(theta);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(livePos, 3));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uProgress: { value: 0 },
        uColor:    { value: new THREE.Color('#ffffff') },
        uOpacity:  { value: 0.85 },
        uSize:     { value: renderer.getPixelRatio() > 1 ? 2.6 : 2.2 },
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

    // ── GLB betöltés ──
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
          const pos   = mesh.geometry.attributes.position;
          const index = mesh.geometry.index;
          const wp    = new THREE.Vector3();
          if (index) {
            for (let i = 0; i < index.count; i++) {
              wp.fromBufferAttribute(pos, index.getX(i)).applyMatrix4(mesh.matrixWorld);
              allVerts.push(wp.clone());
            }
          } else {
            for (let i = 0; i < pos.count; i++) {
              wp.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
              allVerts.push(wp.clone());
            }
          }
        });

        if (!allVerts.length) { console.warn('GLB: ures mesh'); return; }

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;
        for (const v of allVerts) {
          if (v.x < minX) minX = v.x; if (v.x > maxX) maxX = v.x;
          if (v.y < minY) minY = v.y; if (v.y > maxY) maxY = v.y;
          if (v.z < minZ) minZ = v.z; if (v.z > maxZ) maxZ = v.z;
        }
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        const cz = (minZ + maxZ) / 2;
        const sc = FOG_SCALE / Math.max(maxX - minX, maxY - minY, maxZ - minZ);

        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const v = allVerts[Math.floor(Math.random() * allVerts.length)];
          targetPos[i*3]   = (v.x - cx) * sc;
          targetPos[i*3+1] = (v.y - cy) * sc;
          targetPos[i*3+2] = (v.z - cz) * sc;
        }
        glbLoaded = true;
        console.log('GLB betoltve — ' + allVerts.length + ' vertex');
      },
      undefined,
      (err) => console.error('GLB hiba:', err)
    );

    // ── GSAP state ──
    const state = {
      progress:  0,
      x:         W * 0.72,
      y:         H * 0.48,
      scale:     1.05,
      colorMode: 1.0,
    };

    // toWorld: FOV/2 = 19 fok, kamera z=9
    const toWorld = () => {
      const halfH3D = Math.tan(THREE.MathUtils.degToRad(19)) * 9;
      const halfW3D = halfH3D * (window.innerWidth / window.innerHeight);
      return {
        x: (state.x / window.innerWidth  - 0.5) * 2 * halfW3D,
        y: (0.5 - state.y / window.innerHeight) * 2 * halfH3D,
      };
    };

    // ── HERO: nagy gömb → sarokba hamarabb ──
    const heroEl = document.getElementById('hero');
    if (heroEl) {
      gsap.timeline({
        scrollTrigger: {
          trigger: heroEl,
          start:   'top top',
          end:     'bottom 55%',
          scrub:   1.0,
          invalidateOnRefresh: true,
        },
      })
      .to(state, {
        x: () => window.innerWidth  * 0.72,
        y: () => window.innerHeight * 0.48,
        scale: 1.05, colorMode: 1.0,
        duration: 0.1, ease: 'none',
      })
      .to(state, {
        x:     () => window.innerWidth  * 0.025,
        y:     () => window.innerHeight * 0.94,
        scale: 0.055,
        duration: 0.9,
        ease: 'power3.inOut',
      });
    }

    // ── PORTFOLIO: kinő bal oldalra + morph fog alakra ──
    const portfolioEl = document.getElementById('portfolio');
    if (portfolioEl) {
      gsap.timeline({
        scrollTrigger: {
          trigger: portfolioEl,
          start:   'top 90%',
          end:     'top 20%',
          scrub:   2.0,
          invalidateOnRefresh: true,
        },
      }).to(state, {
        x:         () => window.innerWidth  * 0.16,
        y:         () => window.innerHeight * 0.62,
        scale:     0.52,
        colorMode: 0.0,
        duration:  1,
        ease:      'power2.out',
      });

      gsap.timeline({
        scrollTrigger: {
          trigger: portfolioEl,
          start:   'top 20%',
          end:     'bottom 80%',
          scrub:   2.5,
          invalidateOnRefresh: true,
        },
      }).to(state, { progress: 1, duration: 1, ease: 'none' });
    }

    // ── ABOUT: fog kinő KÖZÉPRE teljes méretben ──
    const aboutEl = document.getElementById('about');
    if (aboutEl) {
      gsap.timeline({
        scrollTrigger: {
          trigger: aboutEl,
          start:   'top 95%',
          end:     'top 30%',
          scrub:   2.0,
          invalidateOnRefresh: true,
        },
      }).to(state, {
        x:         () => window.innerWidth  * 0.50,
        y:         () => window.innerHeight * 0.44,
        scale:     0.88,
        colorMode: 1.0,
        progress:  1,
        duration:  1,
        ease:      'power3.out',
      });

      // Visszabújik sarokba az about után
      gsap.timeline({
        scrollTrigger: {
          trigger: aboutEl,
          start:   'bottom 60%',
          end:     'bottom 5%',
          scrub:   2.0,
          invalidateOnRefresh: true,
        },
      }).to(state, {
        x:     () => window.innerWidth  * 0.025,
        y:     () => window.innerHeight * 0.94,
        scale: 0.055,
        colorMode: 1.0,
        duration: 1,
        ease: 'power3.inOut',
      });
    }

    // ── TESTIMONIALS szín ──
    const testimonialsEl = document.getElementById('testimonials');
    if (testimonialsEl) {
      gsap.timeline({
        scrollTrigger: { trigger: testimonialsEl, start: 'top 80%', end: 'top 50%', scrub: 1 },
      }).to(state, { colorMode: 0.0, duration: 1 });
    }

    // ── CONTACT szín ──
    const contactEl = document.getElementById('contact');
    if (contactEl) {
      gsap.timeline({
        scrollTrigger: { trigger: contactEl, start: 'top 80%', end: 'top 50%', scrub: 1 },
      }).to(state, { colorMode: 0.0, duration: 1 });
    }

    setTimeout(() => ScrollTrigger.refresh(), 500);

    // ── Render loop ──
    let animId: number;
    const clock    = new THREE.Clock();
    const colWhite = new THREE.Color('#ffffff');
    const colBlue  = new THREE.Color('#3b6fd4');
    const lerpCol  = new THREE.Color();

    const tick = () => {
      animId = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();

      // Szín LERP
      lerpCol.lerpColors(colBlue, colWhite, state.colorMode);
      material.uniforms.uColor.value.copy(lerpCol);
      material.uniforms.uOpacity.value = 0.70 + state.colorMode * 0.18;

      // Morph — tiszta lineáris LERP, nincs noise hogy ne torzítsa
      if (glbLoaded && state.progress > 0.001) {
        const p = state.progress;
        const eased = p < 0.5 ? 4*p*p*p : 1 - Math.pow(-2*p+2, 3)/2;
        material.uniforms.uProgress.value = eased;

        const posArr = geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const i3 = i * 3;
          posArr[i3]   = startPos[i3]   + (targetPos[i3]   - startPos[i3])   * eased;
          posArr[i3+1] = startPos[i3+1] + (targetPos[i3+1] - startPos[i3+1]) * eased;
          posArr[i3+2] = startPos[i3+2] + (targetPos[i3+2] - startPos[i3+2]) * eased;
        }
        geometry.attributes.position.needsUpdate = true;
      } else {
        material.uniforms.uProgress.value = 0;
      }

      // Forgás
      const m = material.uniforms.uProgress.value;
      group.rotation.y += 0.0042 * (1 - m * 0.6);
      group.rotation.x  = Math.sin(t * 0.4) * 0.05 * (1 - m * 0.95);

      // Smooth LERP pozíció + scale
      const wp = toWorld();
      const lf = 0.044;
      group.position.x += (wp.x - group.position.x) * lf;
      group.position.y += (wp.y - group.position.y) * lf;
      const cs = group.scale.x;
      group.scale.setScalar(cs + (state.scale - cs) * lf);

      renderer.render(scene, camera);
    };
    tick();

    const onResize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      ScrollTrigger.refresh();
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      ScrollTrigger.getAll().forEach(st => st.kill());
      window.removeEventListener('resize', onResize);
      renderer.dispose(); geometry.dispose(); material.dispose(); draco.dispose();
      if (canvas.contains(renderer.domElement)) canvas.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div ref={canvasRef} style={{
      position: 'fixed', inset: 0,
      zIndex: 9,
      pointerEvents: 'none',
      width: '100%', height: '100%',
    }} />
  );
};

export default GlobOrb;
