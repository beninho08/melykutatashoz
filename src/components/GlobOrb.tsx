import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const PARTICLE_COUNT = 8000;
const DRACO_DECODER  = 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/';
const SPHERE_RADIUS  = 1.6;
const FOG_SCALE      = 2.0;

const VERT = `
  uniform float uProgress;
  uniform float uSize;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float sz = uSize * (1.0 + (1.0 - uProgress) * 0.7);
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    Object.assign(renderer.domElement.style, {
      position: 'absolute', inset: '0',
      width: '100%', height: '100%',
      display: 'block', pointerEvents: 'none',
    });
    canvas.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 100);
    camera.position.set(0, 0, 9);

    scene.add(new THREE.AmbientLight(0xffffff, 0.08));
    const key = new THREE.DirectionalLight(0xffffff, 3.5);
    key.position.set(5, 8, 5);
    scene.add(key);
    const rim1 = new THREE.SpotLight(0xa8c8ff, 12);
    rim1.position.set(-9, 5, -9);
    rim1.angle = 0.4; rim1.penumbra = 1;
    scene.add(rim1);
    const rim2 = new THREE.SpotLight(0xfff0f5, 8);
    rim2.position.set(10, -2, -10);
    rim2.angle = 0.35; rim2.penumbra = 1;
    scene.add(rim2);

    const startPos  = new Float32Array(PARTICLE_COUNT * 3);
    const targetPos = new Float32Array(PARTICLE_COUNT * 3);
    const randOff   = new Float32Array(PARTICLE_COUNT * 3);
    const livePos   = new Float32Array(PARTICLE_COUNT * 3);

    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const y     = 1 - (i / (PARTICLE_COUNT - 1)) * 2;
      const r     = Math.sqrt(Math.max(0, 1 - y * y)) * SPHERE_RADIUS;
      const theta = goldenAngle * i;
      startPos[i*3]   = livePos[i*3]   = Math.cos(theta) * r;
      startPos[i*3+1] = livePos[i*3+1] = y * SPHERE_RADIUS;
      startPos[i*3+2] = livePos[i*3+2] = Math.sin(theta) * r;
      randOff[i*3]   = (Math.random() - 0.5) * 0.35;
      randOff[i*3+1] = (Math.random() - 0.5) * 0.35;
      randOff[i*3+2] = (Math.random() - 0.5) * 0.35;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(livePos, 3));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uProgress: { value: 0 },
        uColor:    { value: new THREE.Color('#ffffff') },
        uOpacity:  { value: 0.88 },
        uSize:     { value: renderer.getPixelRatio() > 1 ? 2.8 : 2.4 },
      },
      vertexShader:   VERT,
      fragmentShader: FRAG,
      transparent:    true,
      depthWrite:     false,
      blending:       THREE.NormalBlending,
    });

    const group = new THREE.Group();
    group.add(new THREE.Points(geometry, material));
    scene.add(group);

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

        if (!allVerts.length) { console.warn('GLB: üres mesh'); return; }

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;
        for (const v of allVerts) {
          if (v.x < minX) minX = v.x; if (v.x > maxX) maxX = v.x;
          if (v.y < minY) minY = v.y; if (v.y > maxY) maxY = v.y;
          if (v.z < minZ) minZ = v.z; if (v.z > maxZ) maxZ = v.z;
        }
        const cx   = (minX + maxX) / 2;
        const cy   = (minY + maxY) / 2;
        const cz   = (minZ + maxZ) / 2;
        const span = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
        const sc   = FOG_SCALE / span;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const v = allVerts[Math.floor(Math.random() * allVerts.length)];
          targetPos[i*3]   = (v.x - cx) * sc;
          targetPos[i*3+1] = (v.y - cy) * sc;
          targetPos[i*3+2] = (v.z - cz) * sc;
        }
        glbLoaded = true;
        console.log(`✅ GLB betöltve — ${allVerts.length} vertex`);
      },
      (xhr) => { if (xhr.total) console.log(`GLB: ${Math.round(xhr.loaded / xhr.total * 100)}%`); },
      (err) => console.error('GLB hiba:', err)
    );

    // ── GSAP state ──
    const state = {
      progress:  0,
      x:         W * 0.72,
      y:         H * 0.5,
      scale:     1.0,       // nagyobb kezdő gömb
      colorMode: 1.0,
    };

    const toWorld = () => {
      const fovRad  = THREE.MathUtils.degToRad(19);
      const halfH3D = Math.tan(fovRad) * 9;
      const halfW3D = halfH3D * (window.innerWidth / window.innerHeight);
      return {
        x: (state.x / window.innerWidth  - 0.5) * 2 * halfW3D,
        y: (0.5 - state.y / window.innerHeight) * 2 * halfH3D,
      };
    };

    // ── HERO: gömb hamarabb megy sarokba (end: 60% helyett 80%) ──
    const heroEl = document.getElementById('hero');
    if (heroEl) {
      gsap.timeline({
        scrollTrigger: {
          trigger: heroEl,
          start:   'top top',
          end:     'bottom 80%',   // hamarabb ér véget → gyorsabban sarokba
          scrub:   1.2,
          invalidateOnRefresh: true,
        },
      })
      .to(state, {
        x:         () => window.innerWidth  * 0.72,
        y:         () => window.innerHeight * 0.5,
        scale:     1.0,
        colorMode: 1.0,
        duration:  0.2,
        ease:      'none',
      })
      .to(state, {
        x:         () => window.innerWidth  * 0.02,
        y:         () => window.innerHeight * 0.93,
        scale:     0.055,
        colorMode: 1.0,
        duration:  0.8,
        ease:      'power2.inOut',
      });
    }

    // ── PORTFOLIO: kinő + morphol ──
    const portfolioEl = document.getElementById('portfolio');
    if (portfolioEl) {
      gsap.timeline({
        scrollTrigger: {
          trigger: portfolioEl,
          start:   'top 85%',
          end:     'top 20%',
          scrub:   1.8,
          invalidateOnRefresh: true,
        },
      }).to(state, {
        x:         () => window.innerWidth  * 0.18,
        y:         () => window.innerHeight * 0.68,
        scale:     0.50,
        colorMode: 0.0,
        duration:  1,
        ease:      'power2.out',
      });

      gsap.timeline({
        scrollTrigger: {
          trigger: portfolioEl,
          start:   'top 20%',
          end:     'bottom 80%',
          scrub:   3.0,
          invalidateOnRefresh: true,
        },
      }).to(state, {
        progress: 1,
        duration: 1,
        ease:     'none',
      });
    }

    // ── ABOUT: fog kinő középre ──
    const aboutEl = document.getElementById('about');
    if (aboutEl) {
      gsap.timeline({
        scrollTrigger: {
          trigger: aboutEl,
          start:   'top 85%',
          end:     'top 30%',
          scrub:   1.8,
          invalidateOnRefresh: true,
        },
      }).to(state, {
        x:         () => window.innerWidth  * 0.5,
        y:         () => window.innerHeight * 0.42,
        scale:     0.80,
        colorMode: 1.0,
        progress:  1,
        duration:  1,
        ease:      'power3.out',
      });

      gsap.timeline({
        scrollTrigger: {
          trigger: aboutEl,
          start:   'bottom 70%',
          end:     'bottom 10%',
          scrub:   1.8,
          invalidateOnRefresh: true,
        },
      }).to(state, {
        x:         () => window.innerWidth  * 0.02,
        y:         () => window.innerHeight * 0.93,
        scale:     0.055,
        colorMode: 1.0,
        duration:  1,
        ease:      'power2.inOut',
      });
    }

    // ── TESTIMONIALS ──
    const testimonialsEl = document.getElementById('testimonials');
    if (testimonialsEl) {
      gsap.timeline({
        scrollTrigger: {
          trigger: testimonialsEl,
          start:   'top 80%',
          end:     'top 50%',
          scrub:   1,
          invalidateOnRefresh: true,
        },
      }).to(state, { colorMode: 0.0, duration: 1, ease: 'none' });
    }

    // ── CONTACT ──
    const contactEl = document.getElementById('contact');
    if (contactEl) {
      gsap.timeline({
        scrollTrigger: {
          trigger: contactEl,
          start:   'top 80%',
          end:     'top 50%',
          scrub:   1,
          invalidateOnRefresh: true,
        },
      }).to(state, { colorMode: 0.0, duration: 1, ease: 'none' });
    }

    setTimeout(() => ScrollTrigger.refresh(), 400);

    // ── Render loop ──
    let animId: number;
    const clock    = new THREE.Clock();
    const colWhite = new THREE.Color('#ffffff');
    const colBlue  = new THREE.Color('#3b6fd4');
    const lerpCol  = new THREE.Color();

    const tick = () => {
      animId = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();

      // Szín smooth LERP
      lerpCol.lerpColors(colBlue, colWhite, state.colorMode);
      material.uniforms.uColor.value.copy(lerpCol);
      material.uniforms.uOpacity.value = 0.72 + state.colorMode * 0.16;

      // Morph
      if (glbLoaded && state.progress > 0.001) {
        const p     = state.progress;
        const eased = p < 0.5
          ? 4 * p * p * p
          : 1 - Math.pow(-2 * p + 2, 3) / 2;

        material.uniforms.uProgress.value = eased;

        const posArr = geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const i3  = i * 3;
          const os  = 1 - eased;
          const wn  = Math.sin(t * 0.4 + i * 0.006) * os * 0.05;
          posArr[i3]   = startPos[i3]   + (targetPos[i3]   - startPos[i3])   * eased + randOff[i3]   * os + wn;
          posArr[i3+1] = startPos[i3+1] + (targetPos[i3+1] - startPos[i3+1]) * eased + randOff[i3+1] * os;
          posArr[i3+2] = startPos[i3+2] + (targetPos[i3+2] - startPos[i3+2]) * eased + randOff[i3+2] * os;
        }
        geometry.attributes.position.needsUpdate = true;
      } else if (!glbLoaded || state.progress <= 0.001) {
        // Ha nincs morph, gömb marad
        material.uniforms.uProgress.value = 0;
      }

      // Forgás — morpholva csak Y tengely
      const morphed = material.uniforms.uProgress.value;
      group.rotation.y += 0.0045 * (1 - morphed * 0.55);
      group.rotation.x  = Math.sin(t * 0.45) * 0.06 * (1 - morphed * 0.9);

      // Pozíció smooth LERP
      const wp  = toWorld();
      const lf  = 0.048;
      group.position.x += (wp.x - group.position.x) * lf;
      group.position.y += (wp.y - group.position.y) * lf;

      // Scale smooth LERP
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
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      draco.dispose();
      if (canvas.contains(renderer.domElement)) canvas.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div ref={canvasRef} style={{
      position: 'fixed', inset: 0, zIndex: 10,
      pointerEvents: 'none', width: '100%', height: '100%',
    }} />
  );
};

export default GlobOrb;
