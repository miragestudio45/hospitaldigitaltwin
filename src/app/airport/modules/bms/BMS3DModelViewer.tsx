/**
 * BMS 3D Model Viewer
 * Loads GLB from Vercel CDN via Three.js + GLTFLoader + OrbitControls.
 *
 * Animation support:
 *  1. gltf.animations → THREE.AnimationMixer (keyframe / skeleton)
 *  2. Manual texture animation → bmsTextureAnimator (UV scroll, rotation, emissive pulse)
 *     Babylon Sandbox handles these automatically via extensions; we replicate them manually.
 *
 * Visual:
 *  - 6-point lighting rig (ambient + hemi + key + front + left + rim + bounce)
 *  - Auto-rotate (pauses on interaction, resumes after 3 s)
 *  - Emissive hover glow + selected pulse
 *  - Contact shadow plane + grid
 */
import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createBmsGltfLoader } from "./bmsGltfLoader";
import { resolveAnimationLabel, THUMBNAIL_CAM_PRESETS } from "./bmsEquipmentConfig";
import { createTextureAnimationController, TextureAnimationController } from "./bmsTextureAnimator";
import { Play, Pause, RotateCcw, RefreshCw, AlertTriangle, Loader, Waves } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnimClip {
  clipName: string;
  label: string;
  action: THREE.AnimationAction;
  playing: boolean;
}

export interface BMS3DModelViewerProps {
  modelUrl: string;
  equipmentId?: string;
  equipmentName: string;
  accentColor?: string;
  defaultAnimation?: string;
  onMeshClick?: (meshName: string) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HOVER_EMISSIVE   = new THREE.Color(0x00c8ff);
const SELECT_EMISSIVE  = new THREE.Color(0x00ffc8);
const HOVER_INTENSITY  = 0.6;
const SELECT_INTENSITY = 0.4;
const AUTO_ROTATE_SPEED = 0.5;

function disposeModel(root: THREE.Object3D) {
  root.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const mesh = child as THREE.Mesh;
    mesh.geometry?.dispose();
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((material) => {
      const disposable = material as THREE.Material & Record<string, unknown>;
      Object.values(disposable).forEach((value) => {
        if (value instanceof THREE.Texture) value.dispose();
      });
      material.dispose();
    });
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export const BMS3DModelViewer: React.FC<BMS3DModelViewerProps> = ({
  modelUrl,
  equipmentId,
  equipmentName,
  accentColor = "#06b6d4",
  defaultAnimation,
  onMeshClick,
}) => {
  const mountRef  = useRef<HTMLDivElement>(null);
  const rendRef   = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef  = useRef<THREE.Scene | null>(null);
  const camRef    = useRef<THREE.PerspectiveCamera | null>(null);
  const ctrlRef   = useRef<OrbitControls | null>(null);
  const mixerRef  = useRef<THREE.AnimationMixer | null>(null);
  const texCtrl   = useRef<TextureAnimationController | null>(null);
  const clockRef  = useRef(new THREE.Timer());
  const rafRef    = useRef(0);
  const modelRef  = useRef<THREE.Object3D | null>(null);
  const loadRequestRef = useRef(0);

  const hoveredRef  = useRef<THREE.Mesh | null>(null);
  const selectedRef = useRef<THREE.Mesh | null>(null);
  const origEmissive = useRef<Map<THREE.Mesh, { color: THREE.Color; intensity: number }>>(new Map());
  const pulsePhase  = useRef(0);
  const userActive  = useRef(false);

  const raycaster = useRef(new THREE.Raycaster());
  const mouse     = useRef(new THREE.Vector2());

  const [clips,       setClips]       = useState<AnimClip[]>([]);
  const [texAnimCount, setTexAnimCount] = useState(0);
  const [loadState,   setLoadState]   = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [progress,    setProgress]    = useState(0);
  const [errorMsg,    setErrorMsg]    = useState("");
  const [hoveredName, setHoveredName] = useState<string | null>(null);

  // ── Scene init ──────────────────────────────────────────────────────────────
  const initScene = useCallback(() => {
    const el = mountRef.current;
    if (!el) return;
    const W = el.clientWidth  || 640;
    const H = el.clientHeight || 420;

    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;

    const cam = new THREE.PerspectiveCamera(42, W / H, 0.01, 500);
    camRef.current = cam;

    const rend = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rend.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rend.setSize(W, H);
    rend.shadowMap.enabled = true;
    rend.shadowMap.type = THREE.PCFShadowMap;
    rend.outputColorSpace = THREE.SRGBColorSpace;
    rend.toneMapping = THREE.ACESFilmicToneMapping;
    rend.toneMappingExposure = 1.05;
    rend.setClearColor(0x000000, 0);
    el.appendChild(rend.domElement);
    rendRef.current = rend;

    // ── Studio lighting rig — neutral white, even from ALL directions ──────
    // All lights are pure white so no colour cast (fixes the cyan wash-out).
    // Multiple directional lights around the model give flat, even coverage.

    // 1. Ambient — strong base fill so no face is dark
    scene.add(new THREE.AmbientLight(0xffffff, 1.6));

    // 2. Hemisphere — neutral top/bottom gradient (subtle, not blue)
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 1.4));

    // 3. Key — main light, front-top-right (only one casts shadow)
    const key = new THREE.DirectionalLight(0xffffff, 1.9);
    key.position.set(6, 9, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 0.5; key.shadow.camera.far = 50;
    key.shadow.camera.left = -8; key.shadow.camera.right = 8;
    key.shadow.camera.top  =  8; key.shadow.camera.bottom = -8;
    key.shadow.bias = -0.001;
    scene.add(key);

    // 4. Front-left fill
    const fillL = new THREE.DirectionalLight(0xffffff, 1.1);
    fillL.position.set(-7, 4, 5);
    scene.add(fillL);

    // 5. Right side fill
    const fillR = new THREE.DirectionalLight(0xffffff, 1.0);
    fillR.position.set(8, 3, -2);
    scene.add(fillR);

    // 6. Back / rim — separates silhouette from dark bg (white, not cyan)
    const back = new THREE.DirectionalLight(0xffffff, 0.9);
    back.position.set(-2, 5, -8);
    scene.add(back);

    // 7. Bottom bounce — lifts undersides
    const bottom = new THREE.DirectionalLight(0xffffff, 0.5);
    bottom.position.set(0, -5, 3);
    scene.add(bottom);

    // ── Contact shadow / grid ───────────────────────────────────────────────
    const groundGeo = new THREE.PlaneGeometry(16, 16);
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.25 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(12, 28, 0x1e3a5f, 0x0d2035);
    (grid.material as THREE.Material).opacity = 0.45;
    (grid.material as THREE.Material).transparent = true;
    grid.position.y = 0.002;
    scene.add(grid);

    // ── OrbitControls ───────────────────────────────────────────────────────
    const ctrl = new OrbitControls(cam, rend.domElement);
    ctrl.enableDamping = true;
    ctrl.dampingFactor = 0.07;
    ctrl.autoRotate = true;
    ctrl.autoRotateSpeed = AUTO_ROTATE_SPEED;
    ctrl.minDistance = 0.3;
    ctrl.maxDistance = 50;
    ctrl.maxPolarAngle = Math.PI * 0.82;
    ctrlRef.current = ctrl;

    const onStart = () => { userActive.current = true;  ctrl.autoRotate = false; };
    const onEnd   = () => {
      userActive.current = false;
      setTimeout(() => { if (!userActive.current) ctrl.autoRotate = true; }, 3000);
    };
    ctrl.addEventListener("start", onStart);
    ctrl.addEventListener("end",   onEnd);

    // ── Resize observer ─────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      const nw = el.clientWidth, nh = el.clientHeight;
      rend.setSize(nw, nh);
      cam.aspect = nw / nh;
      cam.updateProjectionMatrix();
    });
    ro.observe(el);

    return () => {
      ctrl.removeEventListener("start", onStart);
      ctrl.removeEventListener("end",   onEnd);
      ro.disconnect();
    };
  }, [accentColor]);

  // ── Load model ──────────────────────────────────────────────────────────────
  const loadModel = useCallback(async (url: string) => {
    if (!sceneRef.current) return;
    const requestId = ++loadRequestRef.current;
    setLoadState("loading");
    setProgress(0);
    setErrorMsg("");

    const loader = await createBmsGltfLoader();
    if (requestId !== loadRequestRef.current) return;
    loader.load(
      url,
      (gltf) => {
        if (requestId !== loadRequestRef.current || !sceneRef.current) {
          disposeModel(gltf.scene);
          return;
        }
        const scene = sceneRef.current!;
        const model = gltf.scene;

        // ── Center & scale (fills viewport nicely) ──────────────────────────
        const box  = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        const ctr  = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(ctr);
        const maxDim = Math.max(size.x, size.y, size.z);
        // Scale up so the model fills ~70 % of view at comfortable zoom
        const scale = 5.5 / maxDim;
        model.scale.setScalar(scale);
        model.position.sub(ctr.multiplyScalar(scale));

        // Sit on ground plane
        const box2 = new THREE.Box3().setFromObject(model);
        model.position.y -= box2.min.y;

        // ── Shadow + emissive cache ─────────────────────────────────────────
        model.traverse((child) => {
          if (!(child as THREE.Mesh).isMesh) return;
          const mesh = child as THREE.Mesh;
          mesh.castShadow = mesh.receiveShadow = true;
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const m of mats) {
            const sm = m as THREE.MeshStandardMaterial;
            if (sm.emissive) {
              origEmissive.current.set(mesh, {
                color:     sm.emissive.clone(),
                intensity: sm.emissiveIntensity ?? 0,
              });
            }
          }
        });

        scene.add(model);
        modelRef.current = model;

        // ── Fit camera to model (generous framing) ──────────────────────────
        const box3  = new THREE.Box3().setFromObject(model);
        const size3 = new THREE.Vector3();
        const fCtr  = new THREE.Vector3();
        box3.getSize(size3);
        box3.getCenter(fCtr);
        const maxS = Math.max(size3.x, size3.y, size3.z);
        const dist = maxS * 1.55; // tighter = model fills more of viewport
        const cam  = camRef.current!;
        // Use per-equipment angle preset, fallback to default 3/4 view
        const [cx, cy, cz] = THUMBNAIL_CAM_PRESETS[equipmentId ?? ""] ?? [0.5, 0.38, 0.88];
        cam.position.set(fCtr.x + dist * cx, fCtr.y + dist * cy, fCtr.z + dist * cz);
        cam.near = dist / 200;
        cam.far  = dist * 15;
        cam.updateProjectionMatrix();
        ctrlRef.current!.target.copy(fCtr);
        ctrlRef.current!.update();

        // ── Keyframe animations (gltf.animations) ──────────────────────────
        console.log(`[BMS Viewer] ${equipmentId} — gltf.animations: ${gltf.animations.length}`);

        if (gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(model);
          mixerRef.current = mixer;

          const newClips: AnimClip[] = gltf.animations.map((clip) => {
            const action = mixer.clipAction(clip);
            action.clampWhenFinished = false;
            action.loop = THREE.LoopRepeat;
            return { clipName: clip.name, label: resolveAnimationLabel(clip.name), action, playing: false };
          });

          const def = defaultAnimation?.toLowerCase();
          const toPlay = (def
            ? newClips.find((c) => c.clipName.toLowerCase().includes(def) || c.label.toLowerCase().includes(def))
            : null) ?? newClips[0];
          if (toPlay) { toPlay.action.play(); toPlay.playing = true; }
          setClips(newClips);
        }

        // ── Texture / material animation (Babylon-compatible fallback) ──────
        const tc = createTextureAnimationController(model, equipmentId);
        texCtrl.current = tc;
        setTexAnimCount(tc.count);
        console.log(`[BMS Viewer] ${equipmentId} — texture animations: ${tc.summary()}`);

        setLoadState("loaded");
      },
      (xhr) => { if (xhr.total > 0) setProgress(Math.round((xhr.loaded / xhr.total) * 100)); },
      (err) => {
        if (requestId !== loadRequestRef.current) return;
        console.error("[BMS Viewer] load error:", url, err);
        setLoadState("error");
        setErrorMsg(String(err instanceof Error ? err.message : err));
      },
    );
  }, [defaultAnimation, equipmentId]);

  // ── Emissive helpers ────────────────────────────────────────────────────────
  const setEmissive = (mesh: THREE.Mesh, color: THREE.Color, intensity: number) => {
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) {
      const sm = m as THREE.MeshStandardMaterial;
      if (sm.emissive) { sm.emissive.copy(color); sm.emissiveIntensity = intensity; }
    }
  };
  const restoreEmissive = (mesh: THREE.Mesh) => {
    const orig = origEmissive.current.get(mesh);
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) {
      const sm = m as THREE.MeshStandardMaterial;
      if (sm.emissive) {
        sm.emissive.copy(orig?.color ?? new THREE.Color(0));
        sm.emissiveIntensity = orig?.intensity ?? 0;
      }
    }
  };

  // ── Mouse interactions ──────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const el = mountRef.current;
    if (!el || !camRef.current || !sceneRef.current) return;
    const r = el.getBoundingClientRect();
    mouse.current.x =  ((e.clientX - r.left) / r.width)  * 2 - 1;
    mouse.current.y = -((e.clientY - r.top)  / r.height) * 2 + 1;

    raycaster.current.setFromCamera(mouse.current, camRef.current);
    const hits = raycaster.current.intersectObjects(sceneRef.current.children, true);
    const hit  = hits.find((i) => (i.object as THREE.Mesh).isMesh && i.object !== selectedRef.current);

    if (hoveredRef.current && hoveredRef.current !== selectedRef.current) {
      restoreEmissive(hoveredRef.current);
      hoveredRef.current = null;
      setHoveredName(null);
    }
    if (hit) {
      const mesh = hit.object as THREE.Mesh;
      if (mesh !== selectedRef.current) {
        hoveredRef.current = mesh;
        setEmissive(mesh, HOVER_EMISSIVE, HOVER_INTENSITY);
        setHoveredName(mesh.name || mesh.parent?.name || "Component");
        el.style.cursor = "pointer";
      }
    } else {
      el.style.cursor = "default";
    }
  }, []);

  const handleClick = useCallback(() => {
    const el = mountRef.current;
    if (!el || !camRef.current || !sceneRef.current) return;
    raycaster.current.setFromCamera(mouse.current, camRef.current);
    const hits = raycaster.current.intersectObjects(sceneRef.current.children, true);
    const hit  = hits.find((i) => (i.object as THREE.Mesh).isMesh);

    if (selectedRef.current) { restoreEmissive(selectedRef.current); selectedRef.current = null; }

    if (hit) {
      const mesh = hit.object as THREE.Mesh;
      selectedRef.current = mesh;
      setEmissive(mesh, SELECT_EMISSIVE, SELECT_INTENSITY);
      const name = mesh.name || mesh.parent?.name || "Component";
      onMeshClick?.(name);

      // Trigger related animation clip if any
      const lower = name.toLowerCase();
      const related = clips.find((c) => {
        const cl = c.clipName.toLowerCase();
        return lower.split(/[_\s]/).some((p) => p.length > 2 && cl.includes(p)) ||
               cl.split(/[_\s]/).some((p) => p.length > 2 && lower.includes(p));
      });
      if (related && !related.playing) {
        related.action.play();
        setClips((prev) => prev.map((c) => c.clipName === related.clipName ? { ...c, playing: true } : c));
      }
    }
  }, [clips, onMeshClick]);

  // ── Render loop ─────────────────────────────────────────────────────────────
  const startLoop = useCallback(() => {
    const loop = (timestamp: number) => {
      rafRef.current = requestAnimationFrame(loop);
      clockRef.current.update(timestamp);
      const delta   = clockRef.current.getDelta();
      const elapsed = clockRef.current.getElapsed();

      // 1. Keyframe animation
      if (mixerRef.current) mixerRef.current.update(delta);
      // 2. Texture / material animation (Babylon-compat fallback)
      if (texCtrl.current) texCtrl.current.update(delta, elapsed);
      // 3. Selected mesh pulse
      if (selectedRef.current) {
        pulsePhase.current += delta * 2.2;
        const intensity = SELECT_INTENSITY + Math.sin(pulsePhase.current) * 0.15;
        const mats = Array.isArray(selectedRef.current.material)
          ? selectedRef.current.material : [selectedRef.current.material];
        for (const m of mats) { const sm = m as THREE.MeshStandardMaterial; if (sm.emissive) sm.emissiveIntensity = intensity; }
      }
      ctrlRef.current?.update();
      if (rendRef.current && sceneRef.current && camRef.current) {
        rendRef.current.render(sceneRef.current, camRef.current);
      }
    };
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  // ── Mount / unmount ─────────────────────────────────────────────────────────
  useEffect(() => {
    const cleanup = initScene();
    startLoop();
    const el = mountRef.current;
    el?.addEventListener("mousemove", handleMouseMove);
    el?.addEventListener("click",     handleClick);
    return () => {
      loadRequestRef.current += 1;
      cancelAnimationFrame(rafRef.current);
      el?.removeEventListener("mousemove", handleMouseMove);
      el?.removeEventListener("click",     handleClick);
      if (modelRef.current) {
        sceneRef.current?.remove(modelRef.current);
        disposeModel(modelRef.current);
        modelRef.current = null;
      }
      if (rendRef.current && el) try { el.removeChild(rendRef.current.domElement); } catch (_) {}
      rendRef.current?.dispose();
      cleanup?.();
    };
  }, []); // eslint-disable-line

  // ── Reload when URL changes ─────────────────────────────────────────────────
  useEffect(() => {
    if (!sceneRef.current) return;
    if (modelRef.current) {
      sceneRef.current.remove(modelRef.current);
      disposeModel(modelRef.current);
      modelRef.current = null;
    }
    hoveredRef.current = selectedRef.current = null;
    origEmissive.current.clear();
    mixerRef.current = null;
    texCtrl.current  = null;
    setClips([]); setTexAnimCount(0); setHoveredName(null);
    if (modelUrl) loadModel(modelUrl);
  }, [modelUrl]); // eslint-disable-line

  // ── Animation clip controls ─────────────────────────────────────────────────
  const toggleClip = (clipName: string) => {
    setClips((prev) => prev.map((c) => {
      if (c.clipName !== clipName) return c;
      if (c.playing) { c.action.stop(); return { ...c, playing: false }; }
      c.action.play(); return { ...c, playing: true };
    }));
  };
  const stopAll = () => setClips((prev) => prev.map((c) => { c.action.stop(); return { ...c, playing: false }; }));
  const resetCamera = () => {
    if (!modelRef.current || !camRef.current || !ctrlRef.current) return;
    const box = new THREE.Box3().setFromObject(modelRef.current);
    const ctr = new THREE.Vector3(); box.getCenter(ctr);
    const sz  = new THREE.Vector3(); box.getSize(sz);
    const d   = Math.max(sz.x, sz.y, sz.z) * 1.55;
    const [cx, cy, cz] = THUMBNAIL_CAM_PRESETS[equipmentId ?? ""] ?? [0.5, 0.38, 0.88];
    camRef.current.position.set(ctr.x + d * cx, ctr.y + d * cy, ctr.z + d * cz);
    ctrlRef.current.target.copy(ctr);
    ctrlRef.current.update();
    ctrlRef.current.autoRotate = true;
  };

  const hasAnyAnimation = clips.length > 0 || texAnimCount > 0;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden rounded-xl"
         style={{ background: "linear-gradient(155deg, #0c1e38 0%, #041020 55%, #071828 100%)" }}>

      {/* Canvas */}
      <div ref={mountRef} className="flex-1 w-full" style={{ minHeight: 0 }} />

      {/* Loading */}
      {loadState === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-[#041020]/80 backdrop-blur-sm gap-3">
          <Loader size={26} className="animate-spin" style={{ color: accentColor }} />
          <p className="text-[11px] font-mono tracking-wide" style={{ color: accentColor }}>
            Loading {equipmentName}...
          </p>
          <div className="w-44 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300"
                 style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${accentColor}, #00e5ff)` }} />
          </div>
          <p className="text-[9px] text-slate-500">{progress}%</p>
        </div>
      )}

      {/* Error */}
      {loadState === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-[#041020]/85 backdrop-blur-sm gap-3 px-6 text-center">
          <AlertTriangle size={30} className="text-red-400" />
          <p className="text-red-300 text-sm font-semibold">Model không tải được</p>
          <p className="text-slate-500 text-[10px] font-mono">{errorMsg || modelUrl}</p>
          <button onClick={() => loadModel(modelUrl)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs border transition-all"
            style={{ background: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.3)", color: "#fca5a5" }}>
            <RefreshCw size={11} /> Thử lại
          </button>
        </div>
      )}

      {/* Hover name */}
      {loadState === "loaded" && hoveredName && (
        <div className="absolute top-3 left-3 z-10 pointer-events-none">
          <div className="px-2.5 py-1 rounded-lg bg-black/65 backdrop-blur-md border border-cyan-500/30 text-cyan-200 text-[10px] font-mono">
            {hoveredName}
          </div>
        </div>
      )}

      {/* Compact floating animation controls */}
      {loadState === "loaded" && hasAnyAnimation && (
        <div className="absolute bottom-3 left-3 z-10 max-w-[calc(100%-4rem)]">
          <div
            className="airport-scrollbar flex max-w-full items-center gap-1 overflow-x-auto rounded-lg p-1 shadow-xl"
            style={{ background: "rgba(0,0,0,0.62)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            {clips.map((c) => (
              <button
                key={c.clipName}
                onClick={() => toggleClip(c.clipName)}
                title={`${c.playing ? "Pause" : "Play"} ${c.label}`}
                className="flex flex-shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 text-[9px] font-medium transition-all"
                style={c.playing
                  ? { background: `${accentColor}18`, borderColor: `${accentColor}45`, color: accentColor }
                  : { background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)", color: "#94a3b8" }}
              >
                {c.playing ? <Pause size={9} /> : <Play size={9} />}
                <span className="max-w-28 truncate">{c.label}</span>
              </button>
            ))}

            {texAnimCount > 0 && (
              <span
                title="Material motion active"
                className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-md border"
                style={{ background: `${accentColor}12`, borderColor: `${accentColor}35`, color: accentColor }}
              >
                <Waves size={10} />
              </span>
            )}

            {clips.length > 1 && (
              <button
                onClick={stopAll}
                title="Stop all animations"
                className="flex-shrink-0 rounded-md border px-2 py-1 text-[9px] transition-all"
                style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", color: "#64748b" }}
              >
                Stop all
              </button>
            )}
          </div>
        </div>
      )}

      {loadState === "loaded" && (
        <button
          onClick={resetCamera}
          title="Reset camera"
          className="absolute bottom-3 right-3 z-10 grid h-7 w-7 place-items-center rounded-lg border shadow-xl transition-all hover:text-white"
          style={{ background: "rgba(0,0,0,0.62)", backdropFilter: "blur(16px)", borderColor: "rgba(255,255,255,0.12)", color: "#94a3b8" }}
        >
          <RotateCcw size={12} />
        </button>
      )}
    </div>
  );
};
