/**
 * BMSModelViewer — reusable Three.js GLB viewer for BMS.
 *
 * Features (per fix notes):
 *  - GLTFLoader (with meshopt), OrbitControls, Raycaster, AnimationMixer
 *  - auto center + auto-fit camera to bounding box
 *  - clean even lighting (ambient + hemi + key + fill + rim), ACES tone mapping
 *  - loading state + error state (no fake success)
 *  - resize handled via ResizeObserver
 *  - hover highlight (emissive) on interactive objects + pointer cursor
 *  - click interactive object → isolate/focus (hide others, focus camera)
 *  - Reset / Back button to restore full model
 *  - highlightObjectName → emphasise a named object (Fix 3 asset location)
 *
 * Pure Three.js — no Babylon. Scoped to BMS; does not touch other viewers.
 */
import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createBmsGltfLoader } from "./bmsGltfLoader";
import { Loader, AlertTriangle, RefreshCw, RotateCcw, Undo2 } from "lucide-react";

export interface BMSModelViewerProps {
  modelUrl: string;
  /** Object name substrings that are hover/click interactive (Fix 1 demo rooms). */
  interactiveObjectNames?: string[];
  /** Object name substring to emphasise on load (Fix 3 asset location). */
  highlightObjectName?: string;
  accentColor?: string;
  className?: string;
}

const HOVER_EMISSIVE  = new THREE.Color(0x00d4ff);
const FOCUS_EMISSIVE  = new THREE.Color(0x00ffc8);
const HOVER_INTENSITY = 0.55;
const FOCUS_INTENSITY = 0.35;

interface EmissiveSnapshot { color: THREE.Color; intensity: number; }

export const BMSModelViewer: React.FC<BMSModelViewerProps> = ({
  modelUrl,
  interactiveObjectNames = [],
  highlightObjectName,
  accentColor = "#06b6d4",
  className = "",
}) => {
  const mountRef  = useRef<HTMLDivElement>(null);
  const rendRef   = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef  = useRef<THREE.Scene | null>(null);
  const camRef    = useRef<THREE.PerspectiveCamera | null>(null);
  const ctrlRef   = useRef<OrbitControls | null>(null);
  const modelRef  = useRef<THREE.Object3D | null>(null);
  const mixerRef  = useRef<THREE.AnimationMixer | null>(null);
  const timerRef  = useRef(new THREE.Timer());
  const rafRef    = useRef(0);

  // interactive-root cache: top-level objects that match interactiveObjectNames
  const interactiveRootsRef = useRef<THREE.Object3D[]>([]);
  const hoveredRootRef  = useRef<THREE.Object3D | null>(null);
  const emissiveCache   = useRef<Map<THREE.Mesh, EmissiveSnapshot>>(new Map());

  const raycaster = useRef(new THREE.Raycaster());
  const pointer   = useRef(new THREE.Vector2());

  const [loadState, setLoadState] = useState<"loading" | "loaded" | "error">("loading");
  const [progress, setProgress]   = useState(0);
  const [errorMsg, setErrorMsg]   = useState("");
  const [hoverName, setHoverName] = useState<string | null>(null);
  const [isolatedName, setIsolatedName] = useState<string | null>(null);

  const namesLower = interactiveObjectNames.map((n) => n.toLowerCase());

  // ── Helpers ─────────────────────────────────────────────────────────────────

  /** Climb from a hit mesh to the nearest ancestor whose name matches an interactive name. */
  const findInteractiveRoot = useCallback((obj: THREE.Object3D): THREE.Object3D | null => {
    let cur: THREE.Object3D | null = obj;
    while (cur) {
      const nm = (cur.name || "").toLowerCase();
      if (nm && namesLower.some((n) => nm.includes(n))) return cur;
      cur = cur.parent;
    }
    return null;
  }, [namesLower.join("|")]); // eslint-disable-line

  const cacheEmissive = (root: THREE.Object3D) => {
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      for (const mat of mats) {
        const sm = mat as THREE.MeshStandardMaterial;
        if (sm && sm.emissive && !emissiveCache.current.has(m)) {
          emissiveCache.current.set(m, { color: sm.emissive.clone(), intensity: sm.emissiveIntensity ?? 0 });
        }
      }
    });
  };

  const applyHoverHighlight = (root: THREE.Object3D, color: THREE.Color, intensity: number) => {
    cacheEmissive(root);
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      for (const mat of mats) {
        const sm = mat as THREE.MeshStandardMaterial;
        if (sm && sm.emissive) { sm.emissive.copy(color); sm.emissiveIntensity = intensity; }
      }
    });
  };

  const clearHoverHighlight = (root: THREE.Object3D | null) => {
    if (!root) return;
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const snap = emissiveCache.current.get(m);
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      for (const mat of mats) {
        const sm = mat as THREE.MeshStandardMaterial;
        if (sm && sm.emissive) {
          sm.emissive.copy(snap?.color ?? new THREE.Color(0x000000));
          sm.emissiveIntensity = snap?.intensity ?? 0;
        }
      }
    });
  };

  const focusCameraToObject = useCallback((target: THREE.Object3D, padding = 1.8) => {
    if (!camRef.current || !ctrlRef.current) return;
    const box = new THREE.Box3().setFromObject(target);
    const size = new THREE.Vector3(); box.getSize(size);
    const center = new THREE.Vector3(); box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const dist = maxDim * padding;
    camRef.current.position.set(center.x + dist * 0.55, center.y + dist * 0.45, center.z + dist * 0.9);
    camRef.current.near = dist / 200;
    camRef.current.far  = dist * 20;
    camRef.current.updateProjectionMatrix();
    ctrlRef.current.target.copy(center);
    ctrlRef.current.update();
  }, []);

  const fitCameraToModel = useCallback(() => {
    if (!modelRef.current) return;
    focusCameraToObject(modelRef.current, 1.5);
  }, [focusCameraToObject]);

  const isolateObject = useCallback((target: THREE.Object3D) => {
    if (!modelRef.current) return;
    for (const root of interactiveRootsRef.current) {
      root.visible = root === target;
    }
    // Non-interactive siblings stay visible only if there are no interactive roots.
    setIsolatedName(target.name || "Room");
    focusCameraToObject(target, 1.7);
    if (ctrlRef.current) ctrlRef.current.autoRotate = false;
  }, [focusCameraToObject]);

  const restoreAllObjects = useCallback(() => {
    for (const root of interactiveRootsRef.current) root.visible = true;
    setIsolatedName(null);
    fitCameraToModel();
    if (ctrlRef.current) ctrlRef.current.autoRotate = true;
  }, [fitCameraToModel]);

  // ── Scene setup ───────────────────────────────────────────────────────────
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const W = el.clientWidth || 640;
    const H = el.clientHeight || 420;

    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;

    const cam = new THREE.PerspectiveCamera(42, W / H, 0.01, 2000);
    cam.position.set(4, 3, 6);
    camRef.current = cam;

    const rend = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rend.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rend.setSize(W, H);
    rend.outputColorSpace = THREE.SRGBColorSpace;
    rend.toneMapping = THREE.ACESFilmicToneMapping;
    rend.toneMappingExposure = 1.1;
    rend.setClearColor(0x000000, 0);
    el.appendChild(rend.domElement);
    rendRef.current = rend;

    // Clean even lighting (per note)
    scene.add(new THREE.AmbientLight(0xffffff, 1.3));
    scene.add(new THREE.HemisphereLight(0xffffff, 0x1b3650, 1.6));
    const key = new THREE.DirectionalLight(0xffffff, 2.0);
    key.position.set(6, 9, 6); scene.add(key);
    const fillL = new THREE.DirectionalLight(0xffffff, 1.1);
    fillL.position.set(-7, 4, 5); scene.add(fillL);
    const fillR = new THREE.DirectionalLight(0xffffff, 0.9);
    fillR.position.set(8, 3, -3); scene.add(fillR);
    const rim = new THREE.DirectionalLight(0xffffff, 0.8);
    rim.position.set(-2, 5, -8); scene.add(rim);

    const grid = new THREE.GridHelper(20, 30, 0x1e3a5f, 0x0d2035);
    (grid.material as THREE.Material).opacity = 0.4;
    (grid.material as THREE.Material).transparent = true;
    scene.add(grid);

    const ctrl = new OrbitControls(cam, rend.domElement);
    ctrl.enableDamping = true;
    ctrl.dampingFactor = 0.07;
    ctrl.autoRotate = true;
    ctrl.autoRotateSpeed = 0.5;
    ctrl.maxPolarAngle = Math.PI * 0.85;
    ctrlRef.current = ctrl;
    let userActive = false;
    const onStart = () => { userActive = true; ctrl.autoRotate = false; };
    const onEnd = () => { userActive = false; setTimeout(() => { if (!userActive && !isolatedNameRef.current) ctrl.autoRotate = true; }, 3500); };
    ctrl.addEventListener("start", onStart);
    ctrl.addEventListener("end", onEnd);

    const ro = new ResizeObserver(() => {
      const nw = el.clientWidth, nh = el.clientHeight;
      if (nw === 0 || nh === 0) return;
      rend.setSize(nw, nh);
      cam.aspect = nw / nh;
      cam.updateProjectionMatrix();
    });
    ro.observe(el);

    // Render loop
    const loop = (t: number) => {
      rafRef.current = requestAnimationFrame(loop);
      timerRef.current.update(t);
      const delta = timerRef.current.getDelta();
      if (mixerRef.current) mixerRef.current.update(delta);
      ctrl.update();
      rend.render(scene, cam);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ctrl.removeEventListener("start", onStart);
      ctrl.removeEventListener("end", onEnd);
      ctrl.dispose();
      ro.disconnect();
      rend.dispose();
      try { el.removeChild(rend.domElement); } catch (_) {}
    };
  }, []); // eslint-disable-line

  // keep an up-to-date ref of isolatedName for the autorotate timeout closure
  const isolatedNameRef = useRef<string | null>(null);
  useEffect(() => { isolatedNameRef.current = isolatedName; }, [isolatedName]);

  // ── Load model ──────────────────────────────────────────────────────────────
  const loadModel = useCallback((url: string) => {
    const scene = sceneRef.current;
    if (!scene) return;
    setLoadState("loading");
    setProgress(0);
    setErrorMsg("");

    // remove any previous model
    if (modelRef.current) { scene.remove(modelRef.current); modelRef.current = null; }
    interactiveRootsRef.current = [];
    emissiveCache.current.clear();
    hoveredRootRef.current = null;
    mixerRef.current = null;
    setIsolatedName(null);
    setHoverName(null);

    let cancelled = false;
    createBmsGltfLoader().then((loader) => {
      if (cancelled) return;
      loader.load(
        url,
        (gltf) => {
          if (cancelled) return;
          const model = gltf.scene;

          // Auto center + scale to a comfortable size
          const box = new THREE.Box3().setFromObject(model);
          const size = new THREE.Vector3(); box.getSize(size);
          const center = new THREE.Vector3(); box.getCenter(center);
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          const scale = 6 / maxDim;
          model.scale.setScalar(scale);
          model.position.sub(center.multiplyScalar(scale));
          const box2 = new THREE.Box3().setFromObject(model);
          model.position.y -= box2.min.y;

          model.traverse((o) => {
            const m = o as THREE.Mesh;
            if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; }
          });

          scene.add(model);
          modelRef.current = model;

          // Find interactive roots (Fix 1 demo rooms)
          if (namesLower.length > 0) {
            const roots = new Set<THREE.Object3D>();
            model.traverse((o) => {
              const nm = (o.name || "").toLowerCase();
              if (nm && namesLower.some((n) => nm.includes(n))) roots.add(o);
            });
            interactiveRootsRef.current = Array.from(roots);
          }

          // Highlight a specific object on load (Fix 3)
          if (highlightObjectName) {
            const hl = highlightObjectName.toLowerCase();
            model.traverse((o) => {
              if ((o.name || "").toLowerCase().includes(hl)) {
                applyHoverHighlight(o, FOCUS_EMISSIVE, FOCUS_INTENSITY);
              }
            });
          }

          // Animations
          if (gltf.animations.length > 0) {
            const mixer = new THREE.AnimationMixer(model);
            mixerRef.current = mixer;
            const action = mixer.clipAction(gltf.animations[0]);
            action.loop = THREE.LoopRepeat;
            action.play();
          }

          fitCameraToModel();
          setLoadState("loaded");
        },
        (xhr) => { if (xhr.total > 0) setProgress(Math.round((xhr.loaded / xhr.total) * 100)); },
        (err) => {
          if (cancelled) return;
          console.error("[BMSModelViewer] load error:", url, err);
          setErrorMsg(String(err instanceof Error ? err.message : err));
          setLoadState("error");
        },
      );
    });

    return () => { cancelled = true; };
  }, [namesLower.join("|"), highlightObjectName, fitCameraToModel]); // eslint-disable-line

  useEffect(() => {
    const cancel = loadModel(modelUrl);
    return cancel;
  }, [modelUrl, loadModel]);

  // ── Pointer interaction (hover + click) ──────────────────────────────────────
  useEffect(() => {
    const el = mountRef.current;
    if (!el || interactiveObjectNames.length === 0) return;

    const raycastRoot = (clientX: number, clientY: number): THREE.Object3D | null => {
      if (!camRef.current || !modelRef.current) return null;
      const rect = el.getBoundingClientRect();
      pointer.current.x =  ((clientX - rect.left) / rect.width)  * 2 - 1;
      pointer.current.y = -((clientY - rect.top)  / rect.height) * 2 + 1;
      raycaster.current.setFromCamera(pointer.current, camRef.current);
      const hits = raycaster.current.intersectObject(modelRef.current, true);
      for (const h of hits) {
        const root = findInteractiveRoot(h.object);
        if (root && root.visible) return root;
      }
      return null;
    };

    const onMove = (e: MouseEvent) => {
      if (isolatedNameRef.current) { el.style.cursor = "default"; return; }
      const root = raycastRoot(e.clientX, e.clientY);
      if (hoveredRootRef.current && hoveredRootRef.current !== root) {
        clearHoverHighlight(hoveredRootRef.current);
        hoveredRootRef.current = null;
        setHoverName(null);
      }
      if (root && hoveredRootRef.current !== root) {
        hoveredRootRef.current = root;
        applyHoverHighlight(root, HOVER_EMISSIVE, HOVER_INTENSITY);
        setHoverName(root.name || "Room");
      }
      el.style.cursor = root ? "pointer" : "default";
    };

    const onClick = (e: MouseEvent) => {
      if (isolatedNameRef.current) return;
      const root = raycastRoot(e.clientX, e.clientY);
      if (root) {
        clearHoverHighlight(root);
        hoveredRootRef.current = null;
        setHoverName(null);
        isolateObject(root);
      }
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("click", onClick);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("click", onClick);
    };
  }, [interactiveObjectNames.join("|"), findInteractiveRoot, isolateObject]); // eslint-disable-line

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={`relative w-full h-full overflow-hidden rounded-xl ${className}`}
         style={{ background: "linear-gradient(155deg,#0c1e38 0%,#041020 60%,#071828 100%)" }}>
      <div ref={mountRef} className="absolute inset-0" />

      {/* Loading */}
      {loadState === "loading" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[#041020]/80 backdrop-blur-sm">
          <Loader size={26} className="animate-spin" style={{ color: accentColor }} />
          <p className="text-[11px] font-mono" style={{ color: accentColor }}>Đang tải model 3D... {progress > 0 ? `${progress}%` : ""}</p>
        </div>
      )}

      {/* Error */}
      {loadState === "error" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[#041020]/85 backdrop-blur-sm px-6 text-center">
          <AlertTriangle size={30} className="text-red-400" />
          <p className="text-sm font-semibold text-red-300">Không tải được model 3D</p>
          <p className="text-[10px] font-mono text-slate-500 break-all">{errorMsg || modelUrl}</p>
          <button onClick={() => loadModel(modelUrl)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs border transition-all"
            style={{ background: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.3)", color: "#fca5a5" }}>
            <RefreshCw size={11} /> Thử lại
          </button>
        </div>
      )}

      {/* Hover label */}
      {loadState === "loaded" && hoverName && !isolatedName && (
        <div className="absolute top-3 left-3 z-10 pointer-events-none px-2.5 py-1 rounded-lg bg-black/65 backdrop-blur-md border text-[11px] font-medium"
             style={{ borderColor: `${accentColor}55`, color: accentColor }}>
          {hoverName}
        </div>
      )}

      {/* Isolated banner + back */}
      {loadState === "loaded" && isolatedName && (
        <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-2">
          <div className="px-2.5 py-1 rounded-lg bg-black/65 backdrop-blur-md border text-[11px] font-medium"
               style={{ borderColor: `${accentColor}55`, color: accentColor }}>
            Đang xem: {isolatedName}
          </div>
          <button onClick={restoreAllObjects}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all"
            style={{ background: "rgba(0,0,0,0.6)", borderColor: `${accentColor}55`, color: accentColor }}>
            <Undo2 size={12} /> Quay lại toàn bộ
          </button>
        </div>
      )}

      {/* Reset camera (when not isolated) */}
      {loadState === "loaded" && !isolatedName && (
        <button onClick={fitCameraToModel} title="Reset view"
          className="absolute bottom-3 right-3 z-10 p-2 rounded-lg border transition-all"
          style={{ background: "rgba(0,0,0,0.55)", borderColor: "rgba(255,255,255,0.12)", color: "#cbd5e1" }}>
          <RotateCcw size={14} />
        </button>
      )}
    </div>
  );
};
