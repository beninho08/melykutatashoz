import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const PARTICLE_COUNT = 15000;
const DRACO_DECODER  = 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/';
const SPHERE_RADIUS  = 1.6;
const FOG_SCALE      = 2.2;
const CORNER_MARGIN  = 16;
const CORNER_ICON    = 64;

const VERT = `
  uniform float uProgress;
  uniform float uSize;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float sz = uSize * (1.0 + uProgress * 0.45);
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
    float alpha = smoothstep(0.5, 0.08, length(uv)) * uOpacity;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

const GlobOrb = () => {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;

    const sizes = { width: window.innerWidth, height: window.innerHeight };

    // ── Renderer ──
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(sizes.width, sizes.height);
    Object.assign(renderer.domElement.style, {
      position: 'absolute', inset: '0',
      width: '100%', height: '100%',
      display: 'block', pointerEvents: 'none',
      background: 'transparent',
    });
    container.appendChild(renderer.domElement);

    // ── Scene / Camera ──
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, sizes.width / sizes.height, 0.1, 100);
    camera.position.set(0, 0, 9);
    scene.add(camera);

    // ── Buffers ──
    // spherePos = gömb (morph=0), toothPos = fog (morph=1)
    const spherePos = new Float32Array(PARTICLE_COUNT * 3);
    const toothPos  = new Float32Array(PARTICLE_COUNT * 3);
    const livePos   = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = 2 * Math.PI * Math.random();
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = SPHERE_RADIUS * (0.88 + Math.random() * 0.24);
      spherePos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
      spherePos[i*3+1] = r * Math.cos(phi);
      spherePos[i*3+2] = r * Math.sin(phi) * Math.sin(theta);
      livePos[i*3]   = spherePos[i*3];
      livePos[i*3+1] = spherePos[i*3+1];
      livePos[i*3+2] = spherePos[i*3+2];
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position',
      new THREE.BufferAttribute(livePos, 3).setUsage(THREE.DynamicDrawUsage));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uProgress: { value: 1.0 },
        uColor:    { value: new THREE.Color('#dce3ec') },
        uOpacity:  { value: 0.0 }, // !! 0 amíg GLB be nem tölt
        uSize:     { value: renderer.getPixelRatio() > 1 ? 2.4 : 2.0 },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const group = new THREE.Group();
    group.add(new THREE.Points(geometry, material));
    scene.add(group);

    // ── State ──
    const state = {
      screenX: sizes.width  * 0.72,
      screenY: sizes.height * 0.46,
      scale:   1.2,
      morph:   1.0, // 1=fog, 0=gömb
      opacity: 0.0,
    };

    const toWorld = (sx: number, sy: number) => {
      const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * camera.position.z;
      const halfW = halfH * (sizes.width / sizes.height);
      return {
        x: ((sx / sizes.width)  - 0.5) * 2 * halfW,
        y: (0.5 - sy / sizes.height)   * 2 * halfH,
      };
    };

    // Pozíció AZONNAL a state-hez igazítva, LERP nélkül
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

    // ── GLB betöltés ──
    let glbLoaded = false;
    const draco = new DRACOLoader();
    draco.setDecoderPath(DRACO_DECODER);
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);

    loader.load('/sajat-fogam.glb', (gltf) => {
      const verts: THREE.Vector3[] = [];
      gltf.scene.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.updateWorldMatrix(true, false);
        const pos   = mesh.geometry.attributes.position as THREE.BufferAttribute;
        const index = mesh.geometry.index;
        const wp    = new THREE.Vector3();
        if (index) {
          for (let i = 0; i < index.count; i++) {
            wp.fromBufferAttribute(pos, index.getX(i)).applyMatrix4(mesh.matrixWorld);
            verts.push(wp.clone());
          }
        } else {
          for (let i = 0; i < pos.count; i++) {
            wp.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
            verts.push(wp.clone());
          }
        }
      });
      if (!verts.length) return;

      let mnX=Infinity,mxX=-Infinity,mnY=Infinity,mxY=-Infinity,mnZ=Infinity,mxZ=-Infinity;
      for (const v of verts) {
        if(v.x<mnX)mnX=v.x; if(v.x>mxX)mxX=v.x;
        if(v.y<mnY)mnY=v.y; if(v.y>mxY)mxY=v.y;
        if(v.z<mnZ)mnZ=v.z; if(v.z>mxZ)mxZ=v.z;
      }
      const cx=(mnX+mxX)/2, cy=(mnY+mxY)/2, cz=(mnZ+mxZ)/2;
      const sc=FOG_SCALE/Math.max(mxX-mnX,mxY-mnY,mxZ-mnZ);
      const step=Math.max(1,Math.floor(verts.length/PARTICLE_COUNT));
      let vi=0;
      for (let i=0;i<PARTICLE_COUNT;i++) {
        const v=verts[vi];
        toothPos[i*3]  =(v.x-cx)*sc;
        toothPos[i*3+1]=(v.y-cy)*sc;
        toothPos[i*3+2]=(v.z-cz)*sc;
        vi+=step; if(vi>=verts.length)vi=0;
      }

      // livePos = fog alak azonnal
      for (let i=0;i<PARTICLE_COUNT;i++) {
        livePos[i*3]   = toothPos[i*3];
        livePos[i*3+1] = toothPos[i*3+1];
        livePos[i*3+2] = toothPos[i*3+2];
      }
      geometry.attributes.position.needsUpdate = true;
      glbLoaded = true;

      // Azonnali pozíció igazítás
      snapToState();
      ScrollTrigger.refresh();

      // Fade-in
      gsap.to(state, { opacity: 0.46, duration: 1.2, ease: 'power2.inOut' });
    }, undefined, console.error);

    // ── ScrollTriggers ──
    // FONTOS: Lenis miatt NEM használunk pin:true!
    // Helyette a hero 300vh magasságú, és az animáció a scroll pozíció alapján fut.
    const ctx = gsap.context(() => {

      // HERO: 3 fázis scrub-bal
      // A hero section 300vh magas (lásd HeroSection pin-spacer trükk nélkül)
      // Fázis 1 (0-33%): fog áll
      // Fázis 2 (33-66%): szétbomlik gömbé
      // Fázis 3 (66-100%): sarokba megy + eltűnik
      gsap.timeline({
        scrollTrigger: {
          trigger: '#hero',
          start:   'top top',
          end:     'bottom top',   // hero aljáig
          scrub:   1.4,
          invalidateOnRefresh: true,
        },
      })
      .to(state, {
        screenX: () => sizes.width  * 0.72,
        screenY: () => sizes.height * 0.46,
        scale: 1.2, morph: 1.0, opacity: 0.46,
        duration: 0.33, ease: 'none',
      })
      .to(state, {
        screenX: () => sizes.width  * 0.72,
        screenY: () => sizes.height * 0.46,
        scale: 1.1, morph: 0.0, opacity: 0.44,
        duration: 0.34, ease: 'power2.inOut',
      })
      .to(state, {
        screenX: () => getCorner().x,
        screenY: () => getCorner().y,
        scale: 0.08, morph: 0.0, opacity: 0.0,
        duration: 0.33, ease: 'power3.inOut',
      });

      // FOOTER: alulról előjön, visszaépül foggá
      gsap.timeline({
        scrollTrigger: {
          trigger:   'footer',
          start:     'top 90%',
          end:       'top 15%',
          scrub:     1.6,
          invalidateOnRefresh: true,
        },
      })
      .fromTo(state,
        {
          screenX: () => sizes.width * 0.5,
          screenY: () => sizes.height * 1.15,
          scale: 0.2, morph: 0.0, opacity: 0.0,
        },
        {
          screenX: () => sizes.width  * 0.5,
          screenY: () => {
            const f = document.querySelector('footer');
            if (!f) return sizes.height * 0.80;
            const r = f.getBoundingClientRect();
            return r.top + r.height * 0.36;
          },
          scale: 1.2, morph: 1.0, opacity: 0.46,
          ease: 'power3.out',
        }
      );
    });

    setTimeout(() => ScrollTrigger.refresh(), 600);

    // ── Stray ──
    const strayIdx: number[] = [];
    for (let i = 0; i < 6; i++)
      strayIdx.push((Math.random() * PARTICLE_COUNT) | 0);

    // ── Render loop ──
    let animId: number;
    const clock = new THREE.Clock();

    const tick = () => {
      animId = requestAnimationFrame(tick);
      const t   = clock.getElapsedTime();
      const arr = geometry.attributes.position.array as Float32Array;

      const p = THREE.MathUtils.clamp(state.morph, 0, 1);
      const e = p < 0.5 ? 4*p*p*p : 1 - Math.pow(-2*p+2, 3)/2;
      material.uniforms.uProgress.value = e;

      if (glbLoaded) {
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const i3 = i * 3;
          arr[i3]   = spherePos[i3]   + (toothPos[i3]   - spherePos[i3])   * e;
          arr[i3+1] = spherePos[i3+1] + (toothPos[i3+1] - spherePos[i3+1]) * e;
          arr[i3+2] = spherePos[i3+2] + (toothPos[i3+2] - spherePos[i3+2]) * e;
        }
      }

      if (p < 0.85) {
        for (const idx of strayIdx) {
          const i3 = idx * 3;
          const bx=arr[i3], by=arr[i3+1], bz=arr[i3+2];
          const len=Math.sqrt(bx*bx+by*by+bz*bz)||1;
          const k=1+(Math.sin(t*0.016+idx*0.12)*0.013)/len;
          arr[i3]=bx*k; arr[i3+1]=by*k; arr[i3+2]=bz*k;
        }
      }
      geometry.attributes.position.needsUpdate = true;

      material.uniforms.uOpacity.value +=
        (state.opacity - material.uniforms.uOpacity.value) * 0.07;

      if (material.uniforms.uOpacity.value > 0.01) {
        group.rotation.y  += 0.0022 * (1 - e * 0.3);
        group.rotation.x   = Math.sin(t * 0.2) * 0.022 * (1 - e * 0.7);
      }

      const wp = toWorld(state.screenX, state.screenY);
      group.position.x += (wp.x - group.position.x) * 0.04;
      group.position.y += (wp.y - group.position.y) * 0.04;
      group.scale.setScalar(
        group.scale.x + (state.scale - group.scale.x) * 0.04
      );

      renderer.render(scene, camera);
    };
    tick();

    // ── Resize ──
    const onResize = () => {
      sizes.width  = window.innerWidth;
      sizes.height = window.innerHeight;
      camera.aspect = sizes.width / sizes.height;
      camera.updateProjectionMatrix();
      renderer.setSize(sizes.width, sizes.height);
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      if (scrollY < 100) {
        state.screenX = sizes.width  * 0.72;
        state.screenY = sizes.height * 0.46;
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
      if (container.contains(renderer.domElement))
        container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div ref={canvasRef} style={{
      position: 'fixed', inset: 0, zIndex: 40,
      pointerEvents: 'none', width: '100%', height: '100%',
      background: 'transparent',
    }}/>
  );
};

export default GlobOrb;
