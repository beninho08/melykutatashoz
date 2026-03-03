import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

const DRACO_DECODER  = 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/';
const PARTICLE_COUNT = 4000;
const SIZE_PX        = 52;

const VERT = `
  uniform float uSize;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uSize * (300.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`;

const FRAG = `
  uniform vec3  uColor;
  uniform float uOpacity;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    if (length(uv) > 0.5) discard;
    float alpha = smoothstep(0.5, 0.1, length(uv)) * uOpacity;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

const ToothScene = () => {
  const mountRef  = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);  // csak betöltés után látható

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);  // teljesen átlátszó háttér
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(SIZE_PX, SIZE_PX);
    Object.assign(renderer.domElement.style, {
      display: 'block',
      width:   `${SIZE_PX}px`,
      height:  `${SIZE_PX}px`,
    });
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const cam   = new THREE.OrthographicCamera(-0.6, 0.6, 0.6, -0.6, 0.1, 10);
    cam.position.set(0, 0, 3);

    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const geometry  = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uColor:   { value: new THREE.Color('#8899cc') },
        uOpacity: { value: 0.85 },
        uSize:    { value: 1.2 },
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

    let animId: number;
    let loaded = false;

    const draco = new DRACOLoader();
    draco.setDecoderPath(DRACO_DECODER);
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);

    loader.load(
      '/sajat-fogam.glb',
      (gltf) => {
        const verts: THREE.Vector3[] = [];

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
              verts.push(wp.clone());
            }
          } else {
            for (let i = 0; i < pos.count; i++) {
              wp.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
              verts.push(wp.clone());
            }
          }
        });

        if (!verts.length) { console.warn('ToothScene: üres GLB'); return; }

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;
        for (const v of verts) {
          if (v.x < minX) minX = v.x; if (v.x > maxX) maxX = v.x;
          if (v.y < minY) minY = v.y; if (v.y > maxY) maxY = v.y;
          if (v.z < minZ) minZ = v.z; if (v.z > maxZ) maxZ = v.z;
        }
        const cx   = (minX + maxX) / 2;
        const cy   = (minY + maxY) / 2;
        const cz   = (minZ + maxZ) / 2;
        const span = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
        const sc   = 1.0 / span;

        const posArr = geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const v = verts[Math.floor(Math.random() * verts.length)];
          posArr[i * 3]     = (v.x - cx) * sc;
          posArr[i * 3 + 1] = (v.y - cy) * sc;
          posArr[i * 3 + 2] = (v.z - cz) * sc;
        }
        geometry.attributes.position.needsUpdate = true;
        loaded = true;
        setVisible(true);  // ← csak most jelenik meg
        console.log('✅ ToothScene betöltve');
      },
      undefined,
      (err) => console.error('ToothScene hiba:', err)
    );

    const tick = () => {
      animId = requestAnimationFrame(tick);
      if (loaded) group.rotation.y += 0.012;
      renderer.render(scene, cam);
    };
    tick();

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      draco.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position:      'fixed',
        bottom:        '12px',
        left:          '12px',
        width:         `${SIZE_PX}px`,
        height:        `${SIZE_PX}px`,
        zIndex:        50,
        pointerEvents: 'none',
        opacity:       visible ? 1 : 0,          // ← betöltés előtt láthatatlan
        transition:    'opacity 0.6s ease',       // ← szépen befade-el
      }}
    />
  );
};

export default ToothScene;
