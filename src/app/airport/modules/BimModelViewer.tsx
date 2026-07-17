import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { Box, Loader2, RotateCcw, ScanLine } from "lucide-react";

interface BimModelViewerProps {
  modelUrl?: string;
  label: string;
}

function disposeMaterial(material: THREE.Material | THREE.Material[]) {
  (Array.isArray(material) ? material : [material]).forEach((item) => {
    Object.values(item).forEach((value) => {
      if (value instanceof THREE.Texture) value.dispose();
    });
    item.dispose();
  });
}

export function BimModelViewer({ modelUrl, label }: BimModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const resetRef = useRef<() => void>(() => undefined);
  const wireframeRef = useRef<(enabled: boolean) => void>(() => undefined);
  const [loading, setLoading] = useState(Boolean(modelUrl));
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [wireframe, setWireframe] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !modelUrl) {
      setLoading(false);
      return;
    }

    let disposed = false;
    let raf = 0;
    let resizeObserver: ResizeObserver | undefined;
    let root: THREE.Object3D | null = null;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x03101d);
    scene.fog = new THREE.FogExp2(0x03101d, 0.00018);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 100000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance", logarithmicDepthBuffer: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.touchAction = "none";
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.screenSpacePanning = true;
    controls.zoomToCursor = true;
    controls.minDistance = 0.02;
    controls.maxDistance = Infinity;

    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = env.texture;

    scene.add(new THREE.HemisphereLight(0xd8f5ff, 0x03111f, 2.15));
    scene.add(new THREE.AmbientLight(0xc7edff, 0.8));
    const key = new THREE.DirectionalLight(0xf2fbff, 2.8);
    key.position.set(12, 18, 10);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x56d9ff, 1.2);
    fill.position.set(-10, 7, 4);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0x7c7cff, 0.9);
    rim.position.set(0, 8, -12);
    scene.add(rim);

    let grid: THREE.GridHelper | null = null;
    let homePosition = new THREE.Vector3(10, 7, 10);
    let homeTarget = new THREE.Vector3();

    const fitModel = (object: THREE.Object3D) => {
      const box = new THREE.Box3().setFromObject(object);
      if (box.isEmpty()) return;
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const sphere = box.getBoundingSphere(new THREE.Sphere());
      const distance = sphere.radius / Math.sin(THREE.MathUtils.degToRad(camera.fov * 0.5));
      const direction = new THREE.Vector3(1.05, 0.62, 0.88).normalize();
      camera.position.copy(center.clone().add(direction.multiplyScalar(distance * 0.92)));
      controls.target.copy(center.clone().add(new THREE.Vector3(0, size.y * 0.04, 0)));
      camera.near = Math.max(sphere.radius / 8000, 0.005);
      camera.far = Math.max(sphere.radius * 80, 2500);
      camera.updateProjectionMatrix();
      controls.minDistance = Math.max(sphere.radius * 0.02, 0.02);
      controls.maxDistance = Math.max(sphere.radius * 20, 100);
      controls.update();
      homePosition = camera.position.clone();
      homeTarget = controls.target.clone();

      if (grid) {
        scene.remove(grid);
        grid.geometry.dispose();
        disposeMaterial(grid.material);
      }
      const gridSize = Math.max(size.x, size.z) * 1.35;
      const divisions = gridSize > 500 ? 120 : 80;
      grid = new THREE.GridHelper(gridSize, divisions, 0x22d3ee, 0x174157);
      (Array.isArray(grid.material) ? grid.material : [grid.material]).forEach((material) => {
        material.transparent = true;
        material.opacity = 0.16;
        material.depthWrite = false;
      });
      grid.position.set(center.x, box.min.y - Math.max(size.y * 0.015, 0.01), center.z);
      scene.add(grid);
    };

    resetRef.current = () => {
      camera.position.copy(homePosition);
      controls.target.copy(homeTarget);
      camera.lookAt(homeTarget);
      controls.update();
    };

    wireframeRef.current = (enabled: boolean) => {
      root?.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => {
          if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhysicalMaterial || material instanceof THREE.MeshBasicMaterial) {
            material.wireframe = enabled;
            material.needsUpdate = true;
          }
        });
      });
    };

    const load = async () => {
      setLoading(true);
      setProgress(0);
      setError(null);
      const draco = new DRACOLoader();
      draco.setDecoderPath("/draco/");
      try {
        const loader = new GLTFLoader();
        loader.setMeshoptDecoder(MeshoptDecoder);
        loader.setDRACOLoader(draco);
        const gltf = await new Promise<Awaited<ReturnType<GLTFLoader["loadAsync"]>>>((resolve, reject) => {
          loader.load(
            modelUrl,
            resolve,
            (event) => setProgress(event.total ? Math.min(99, Math.round((event.loaded / event.total) * 100)) : 48),
            reject,
          );
        });
        if (disposed) return;
        root = gltf.scene;
        const original = new THREE.Box3().setFromObject(root);
        const center = original.getCenter(new THREE.Vector3());
        root.position.x -= center.x;
        root.position.z -= center.z;
        const shifted = new THREE.Box3().setFromObject(root);
        root.position.y -= shifted.min.y;
        root.position.y += 0.01;
        root.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          object.castShadow = false;
          object.receiveShadow = false;
          (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => {
            if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhysicalMaterial) {
              material.envMapIntensity = 0.9;
              material.needsUpdate = true;
            }
          });
        });
        scene.add(root);
        fitModel(root);
        setProgress(100);
      } catch (loadError) {
        if (!disposed) setError(loadError instanceof Error ? loadError.message : "Unable to load BIM model");
      } finally {
        draco.dispose();
        if (!disposed) setLoading(false);
      }
    };
    void load();

    const resize = () => {
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      resizeObserver?.disconnect();
      controls.dispose();
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh || object instanceof THREE.LineSegments || object instanceof THREE.Points)) return;
        object.geometry?.dispose();
        disposeMaterial(object.material);
      });
      root = null;
      grid = null;
      env.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement.parentElement === container) container.removeChild(renderer.domElement);
    };
  }, [modelUrl]);

  if (!modelUrl) {
    return <div className="absolute inset-0 grid place-items-center p-6"><div className="max-w-xl rounded-2xl border border-white/[.08] bg-[#04111f]/82 p-8 text-center"><Box size={52} className="mx-auto text-cyan-300/60" /><h3 className="mt-4 text-sm font-semibold text-white">{label}</h3><p className="mt-2 text-[11px] leading-relaxed text-slate-500">No model has been assigned to this hospital BIM node yet. The viewer, clinical-space hierarchy and interaction shell are ready for the official hospital model package.</p></div></div>;
  }

  return <>
    <div ref={containerRef} className="absolute inset-0" />
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_52%,rgba(2,8,16,.48)_100%)]" />
    <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-xl border border-white/[.08] bg-[#06111f]/82 p-1.5 shadow-xl backdrop-blur-xl">
      <button onClick={() => resetRef.current()} className="airport-icon-button" title="Reset BIM camera"><RotateCcw size={14} /></button>
      <button onClick={() => { const next = !wireframe; setWireframe(next); wireframeRef.current(next); }} className={`airport-button ${wireframe ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200" : ""}`}><ScanLine size={14} /> Wireframe</button>
      <span className="px-2 text-[9px] font-semibold text-cyan-200">{label}</span>
    </div>
    {loading && <div className="absolute bottom-5 left-1/2 z-10 w-72 -translate-x-1/2 rounded-xl border border-white/10 bg-[#071426]/94 p-3 shadow-2xl backdrop-blur-xl"><div className="flex items-center justify-between text-[10px] text-slate-300"><span className="flex items-center gap-2"><Loader2 size={13} className="animate-spin text-cyan-300" />Loading BIM model</span><b>{progress}%</b></div><div className="mt-2 h-1 overflow-hidden rounded bg-white/10"><div className="h-full bg-cyan-300 transition-[width]" style={{ width: `${progress}%` }} /></div></div>}
    {error && <div className="absolute bottom-5 left-1/2 z-10 max-w-lg -translate-x-1/2 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-[10px] text-red-200">Unable to load {label}: {error}</div>}
  </>;
}
