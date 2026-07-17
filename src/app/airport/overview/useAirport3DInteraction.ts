import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { AIRPORT_3D_CONFIG } from "./airport3DConfig";

export type Airport3DControlMode = "orbit" | "walk";

export type Airport3DViewSettings = {
  cameraHeight: number;
  walkHeight: number;
  distance: number;
  fov: number;
  brightness: number;
};

export const DEFAULT_AIRPORT_3D_VIEW_SETTINGS: Airport3DViewSettings = {
  cameraHeight: 1.5,
  walkHeight: 4,
  distance: 0.68,
  fov: 36,
  brightness: 0.3,
};

const VIEW_SETTINGS_STORAGE_KEY = "hospital-3d-view-settings-v3";
const DEFAULT_WALK_EYE_HEIGHT = DEFAULT_AIRPORT_3D_VIEW_SETTINGS.walkHeight;

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function gaussian(random: () => number) {
  let u = 0;
  let v = 0;
  while (u === 0) u = random();
  while (v === 0) v = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(Math.PI * 2 * v);
}

function createRadialTexture(stops: Array<[number, string]>, size = 128) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) return new THREE.CanvasTexture(canvas);
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([position, color]) => gradient.addColorStop(position, color));
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createNightSkyMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    fog: false,
    vertexShader: `
      varying vec3 vDirection;
      void main() {
        vDirection = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vDirection;
      void main() {
        float heightFactor = max(vDirection.y, 0.0);
        vec3 zenith = vec3(0.004, 0.010, 0.030);
        vec3 upper = vec3(0.008, 0.030, 0.075);
        vec3 horizon = vec3(0.020, 0.060, 0.115);
        vec3 color = mix(horizon, upper, smoothstep(0.0, 0.46, heightFactor));
        color = mix(color, zenith, smoothstep(0.38, 1.0, heightFactor));
        float airglow = exp(-abs(vDirection.y - 0.065) * 28.0);
        color += vec3(0.010, 0.036, 0.048) * airglow;
        float softBlueGlow = exp(-length(vDirection.xz - vec2(-0.25, 0.25)) * 2.7);
        color += vec3(0.005, 0.018, 0.045) * softBlueGlow;
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
}

function createStarMaterial(texture: THREE.Texture, opacity: number) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTexture: { value: texture },
      uScale: { value: 1 },
      uOpacity: { value: opacity },
    },
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    fog: false,
    vertexShader: `
      attribute float aSize;
      attribute vec3 aColor;
      uniform float uScale;
      varying vec3 vColor;
      void main() {
        vColor = aColor;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float pointSize = aSize * uScale;
        gl_PointSize = max(1.0, floor(pointSize * 2.0 + 0.5) / 2.0);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D uTexture;
      uniform float uOpacity;
      varying vec3 vColor;
      void main() {
        vec4 sprite = texture2D(uTexture, gl_PointCoord);
        float alpha = sprite.a * uOpacity;
        if (alpha < 0.003) discard;
        gl_FragColor = vec4(vColor * sprite.rgb * 1.34, alpha);
      }
    `,
  });
}

function createSphericalStars(
  count: number,
  radius: number,
  seed: number,
  texture: THREE.Texture,
  opacity: number,
  minSize: number,
  maxSize: number,
) {
  const random = seededRandom(seed);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const palette = [
    new THREE.Color(0xb9ceff),
    new THREE.Color(0xd8e4ff),
    new THREE.Color(0xf7f4e8),
    new THREE.Color(0xffe3b8),
  ];
  for (let index = 0; index < count; index += 1) {
    const z = random() * 2 - 1;
    const theta = random() * Math.PI * 2;
    const radial = Math.sqrt(1 - z * z);
    const distance = radius * (0.93 + random() * 0.07);
    positions[index * 3] = radial * Math.cos(theta) * distance;
    positions[index * 3 + 1] = z * distance;
    positions[index * 3 + 2] = radial * Math.sin(theta) * distance;
    const brightness = Math.pow(random(), 3.2);
    sizes[index] = minSize + brightness * (maxSize - minSize);
    const color = palette[Math.min(palette.length - 1, Math.floor(random() * palette.length))].clone();
    color.multiplyScalar(0.76 + brightness * 0.58);
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  const material = createStarMaterial(texture, opacity);
  return new THREE.Points(geometry, material);
}

function createMilkyWay(
  starTexture: THREE.Texture,
  glowTexture: THREE.Texture,
) {
  const group = new THREE.Group();
  group.rotation.set(1.08, 0.58, 0.32);
  const random = seededRandom(940117);
  const count = 10500;
  const radius = 1120;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  for (let index = 0; index < count; index += 1) {
    const longitude = random() < 0.58 ? gaussian(random) * 0.9 : (random() * 2 - 1) * Math.PI;
    const width = 0.055 + 0.105 * Math.exp(-Math.pow(longitude / 1.05, 2));
    const latitude = gaussian(random) * width;
    const cosLatitude = Math.cos(latitude);
    positions[index * 3] = radius * cosLatitude * Math.cos(longitude);
    positions[index * 3 + 1] = radius * Math.sin(latitude);
    positions[index * 3 + 2] = radius * cosLatitude * Math.sin(longitude);
    const brightness = Math.pow(random(), 3.8);
    sizes[index] = 0.55 + brightness * 1.75;
    const centerWarmth = Math.exp(-Math.pow(longitude / 0.72, 2));
    colors[index * 3] = (0.74 + centerWarmth * 0.25) * (0.50 + brightness * 0.58);
    colors[index * 3 + 1] = (0.79 + centerWarmth * 0.12) * (0.50 + brightness * 0.58);
    colors[index * 3 + 2] = (0.94 - centerWarmth * 0.16) * (0.50 + brightness * 0.58);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  const material = createStarMaterial(starTexture, 0.78);
  const bandStars = new THREE.Points(geometry, material);
  group.add(bandStars);

  const cloudMaterials: THREE.SpriteMaterial[] = [];
  for (let index = 0; index < 120; index += 1) {
    const longitude = (random() * 2 - 1) * 2.3;
    const latitude = gaussian(random) * 0.065;
    const centerGlow = Math.exp(-Math.pow(longitude / 0.9, 2));
    const spriteMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      color: new THREE.Color().setHSL(0.60 - centerGlow * 0.075, 0.18 + centerGlow * 0.12, 0.69),
      transparent: true,
      opacity: 0.02 + random() * 0.024 + centerGlow * 0.018,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
      fog: false,
      rotation: random() * Math.PI,
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    const cosLatitude = Math.cos(latitude);
    sprite.position.set(
      radius * cosLatitude * Math.cos(longitude),
      radius * Math.sin(latitude),
      radius * cosLatitude * Math.sin(longitude),
    );
    const scale = 34 + random() * 62 + centerGlow * 45;
    sprite.scale.set(scale * (1.8 + random() * 1.2), scale, 1);
    group.add(sprite);
    cloudMaterials.push(spriteMaterial);
  }
  return { group, starMaterial: material, cloudMaterials };
}

function createGridTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const baseGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  baseGradient.addColorStop(0, "#06111c");
  baseGradient.addColorStop(0.5, "#081825");
  baseGradient.addColorStop(1, "#09111d");
  ctx.fillStyle = baseGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < canvas.height; y += 8) {
    for (let x = 0; x < canvas.width; x += 8) {
      const alpha = ((x + y) % 16 === 0) ? 0.085 : 0.04;
      ctx.fillStyle = `rgba(102, 225, 255, ${alpha})`;
      ctx.fillRect(x, y, 1.5, 1.5);
    }
  }

  for (let index = 0; index <= 64; index += 1) {
    const position = index * 16;
    ctx.strokeStyle = index % 8 === 0 ? "rgba(55, 206, 255, 0.24)" : "rgba(55, 206, 255, 0.08)";
    ctx.lineWidth = index % 8 === 0 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(position, 0);
    ctx.lineTo(position, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, position);
    ctx.lineTo(canvas.width, position);
    ctx.stroke();
  }

  const centerX = canvas.width * 0.5;
  const centerY = canvas.height * 0.5;
  for (let ring = 1; ring <= 4; ring += 1) {
    ctx.beginPath();
    ctx.strokeStyle = `rgba(39, 214, 255, ${0.18 - ring * 0.025})`;
    ctx.lineWidth = 2;
    ctx.arc(centerX, centerY, ring * 120, 0, Math.PI * 2);
    ctx.stroke();
  }

  const glow = ctx.createRadialGradient(centerX, centerY, 30, centerX, centerY, canvas.width * 0.42);
  glow.addColorStop(0, "rgba(0, 198, 255, 0.12)");
  glow.addColorStop(0.4, "rgba(0, 198, 255, 0.06)");
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 12);
  texture.needsUpdate = true;
  return texture;
}

function materialNames(material: THREE.Material | THREE.Material[]) {
  return (Array.isArray(material) ? material : [material]).map((item) => item.name ?? "").join(" ").toLowerCase();
}

function disposeMaterial(material: THREE.Material | THREE.Material[]) {
  (Array.isArray(material) ? material : [material]).forEach((item) => {
    Object.values(item).forEach((value) => {
      if (value instanceof THREE.Texture) value.dispose();
    });
    item.dispose();
  });
}

export function useAirport3DInteraction(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [controlMode, setControlModeState] = useState<Airport3DControlMode>("orbit");
  const [walkLocked, setWalkLocked] = useState(false);
  const [heading, setHeading] = useState(0);
  const [viewSettings, setViewSettingsState] = useState<Airport3DViewSettings>(() => {
    if (typeof window === "undefined") return DEFAULT_AIRPORT_3D_VIEW_SETTINGS;
    try {
      const stored = JSON.parse(window.localStorage.getItem(VIEW_SETTINGS_STORAGE_KEY) ?? "null");
      return stored ? { ...DEFAULT_AIRPORT_3D_VIEW_SETTINGS, ...stored } : DEFAULT_AIRPORT_3D_VIEW_SETTINGS;
    } catch {
      return DEFAULT_AIRPORT_3D_VIEW_SETTINGS;
    }
  });
  const viewSettingsRef = useRef(viewSettings);
  const resetCameraRef = useRef<() => void>(() => undefined);
  const controlModeRef = useRef<Airport3DControlMode>("orbit");
  const setControlModeRef = useRef<(mode: Airport3DControlMode) => void>(() => undefined);
  const applyViewSettingsRef = useRef<(next: Airport3DViewSettings, previous: Airport3DViewSettings) => void>(() => undefined);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let raf = 0;
    let resizeObserver: ResizeObserver | undefined;
    let loadedRoot: THREE.Object3D | null = null;
    let loadedPlatformParts: THREE.Object3D[] = [];
    let mixer: THREE.AnimationMixer | null = null;
    let homePosition = new THREE.Vector3(...AIRPORT_3D_CONFIG.defaultCamera.position);
    let homeTarget = new THREE.Vector3(...AIRPORT_3D_CONFIG.defaultCamera.target);
    let walkBaseEyeHeight = DEFAULT_WALK_EYE_HEIGHT;
    let walkEyeHeight = DEFAULT_WALK_EYE_HEIGHT;
    let walkGroundY = 0.02;
    let walkRayOriginY = 1000;
    let walkMoveSpeed = 3;
    let walkBounds = new THREE.Box2(new THREE.Vector2(-10, -10), new THREE.Vector2(10, 10));
    let walkSpawn = new THREE.Vector3(0, walkGroundY + walkEyeHeight, 0);
    let walkLookTarget = new THREE.Vector3(1.4, walkGroundY + walkEyeHeight, -0.8);
    let lastHeading = Number.NaN;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(AIRPORT_3D_CONFIG.background);
    scene.fog = new THREE.FogExp2(0x020a14, 0.0012);

    const camera = new THREE.PerspectiveCamera(
      AIRPORT_3D_CONFIG.defaultCamera.fov,
      1,
      AIRPORT_3D_CONFIG.defaultCamera.near,
      AIRPORT_3D_CONFIG.defaultCamera.far,
    );
    camera.position.copy(homePosition);
    camera.lookAt(homeTarget);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance", logarithmicDepthBuffer: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = viewSettingsRef.current.brightness;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.touchAction = "none";
    container.appendChild(renderer.domElement);

    const orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.055;
    orbitControls.screenSpacePanning = true;
    orbitControls.enablePan = true;
    orbitControls.minDistance = 0.02;
    orbitControls.maxDistance = Infinity;
    orbitControls.zoomSpeed = 1.15;
    orbitControls.zoomToCursor = true;
    orbitControls.maxPolarAngle = Math.PI * 0.495;
    orbitControls.target.copy(homeTarget);
    orbitControls.update();

    const walkControls = new PointerLockControls(camera, renderer.domElement);
    const movement = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      boost: false,
    };

    walkControls.addEventListener("lock", () => setWalkLocked(true));
    walkControls.addEventListener("unlock", () => setWalkLocked(false));

    const pmrem = new THREE.PMREMGenerator(renderer);
    const environmentRenderTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = environmentRenderTarget.texture;

    const starTexture = createRadialTexture([
      [0, "rgba(255,255,255,1)"],
      [0.16, "rgba(255,255,255,.96)"],
      [0.42, "rgba(255,255,255,.22)"],
      [1, "rgba(255,255,255,0)"],
    ]);
    const glowTexture = createRadialTexture([
      [0, "rgba(255,255,255,.72)"],
      [0.32, "rgba(255,255,255,.24)"],
      [1, "rgba(255,255,255,0)"],
    ]);
    const skyDome = new THREE.Mesh(
      new THREE.SphereGeometry(1800, 56, 36),
      createNightSkyMaterial(),
    );
    skyDome.renderOrder = -1000;
    scene.add(skyDome);

    const fieldStars = createSphericalStars(6800, 1350, 781223, starTexture, 0.96, 0.6, 2.5);
    const milkyWay = createMilkyWay(starTexture, glowTexture);
    fieldStars.renderOrder = -990;
    milkyWay.group.renderOrder = -985;
    scene.add(fieldStars, milkyWay.group);

    scene.add(new THREE.AmbientLight(0xb7ddff, 0.95));
    scene.add(new THREE.HemisphereLight(0xd4f4ff, 0x05101b, 2.2));

    const key = new THREE.DirectionalLight(0xe7faff, AIRPORT_3D_CONFIG.lighting.keyIntensity);
    key.position.set(45, 72, 35);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 800;
    key.shadow.camera.left = -320;
    key.shadow.camera.right = 320;
    key.shadow.camera.top = 320;
    key.shadow.camera.bottom = -320;
    key.shadow.bias = -0.00015;
    key.shadow.normalBias = 0.05;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0x69d8ff, AIRPORT_3D_CONFIG.lighting.fillIntensity);
    fill.position.set(-56, 34, 20);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0x6172ff, AIRPORT_3D_CONFIG.lighting.rimIntensity);
    rim.position.set(10, 42, -72);
    scene.add(rim);

    const warm = new THREE.DirectionalLight(0xffcf8f, 0.84);
    warm.position.set(-16, 24, -22);
    scene.add(warm);

    const gridTexture = createGridTexture();
    gridTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const gridMajor = new THREE.GridHelper(1400, 280, 0x32dfff, 0x123548);
    (Array.isArray(gridMajor.material) ? gridMajor.material : [gridMajor.material]).forEach((material) => {
      material.transparent = true;
      material.opacity = 0.12;
      material.depthWrite = false;
    });
    gridMajor.position.y = -0.028;
    scene.add(gridMajor);

    const gridMinor = new THREE.GridHelper(1400, 2800, 0x1fe0ff, 0x0c2536);
    (Array.isArray(gridMinor.material) ? gridMinor.material : [gridMinor.material]).forEach((material) => {
      material.transparent = true;
      material.opacity = 0.06;
      material.depthWrite = false;
    });
    gridMinor.position.y = -0.021;
    scene.add(gridMinor);

    const radialRing = new THREE.Mesh(
      new THREE.RingGeometry(18, 42, 96),
      new THREE.MeshBasicMaterial({ color: 0x26d8ff, transparent: true, opacity: 0.055, side: THREE.DoubleSide, depthWrite: false }),
    );
    radialRing.rotation.x = -Math.PI / 2;
    radialRing.position.y = -0.016;
    scene.add(radialRing);


    const raycaster = new THREE.Raycaster();
    const groundRaycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const interactiveMeshes: THREE.Mesh[] = [];
    const walkableGroundMeshes: THREE.Mesh[] = [];
    const targetMeshes = new Map<string, THREE.Mesh[]>();
    const originalMaterials = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
    const highlightMaterials = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
    let hoveredTarget: string | null = null;
    let pointerDown: { x: number; y: number } | null = null;

    const getWalkGroundHeight = (x: number, z: number, fallback: number) => {
      if (!walkableGroundMeshes.length) return fallback;
      groundRaycaster.set(new THREE.Vector3(x, walkRayOriginY, z), new THREE.Vector3(0, -1, 0));
      groundRaycaster.near = 0;
      groundRaycaster.far = Math.max(2000, walkRayOriginY * 2);
      return groundRaycaster.intersectObjects(walkableGroundMeshes, false)[0]?.point.y ?? fallback;
    };

    const restoreHighlight = () => {
      if (!hoveredTarget) return;
      (targetMeshes.get(hoveredTarget) ?? []).forEach((mesh) => {
        const original = originalMaterials.get(mesh);
        if (original) mesh.material = original;
        const highlighted = highlightMaterials.get(mesh);
        if (highlighted) disposeMaterial(highlighted);
        highlightMaterials.delete(mesh);
      });
      hoveredTarget = null;
    };

    const applyHighlight = (targetId: string | null) => {
      if (targetId === hoveredTarget) return;
      restoreHighlight();
      if (!targetId) return;
      (targetMeshes.get(targetId) ?? []).forEach((mesh) => {
        const cloneOne = (material: THREE.Material) => {
          const clone = material.clone();
          if (clone instanceof THREE.MeshStandardMaterial || clone instanceof THREE.MeshPhysicalMaterial) {
            clone.emissive = new THREE.Color(0x00d8ff);
            clone.emissiveIntensity = 0.4;
          }
          clone.needsUpdate = true;
          return clone;
        };
        const highlighted = Array.isArray(mesh.material) ? mesh.material.map(cloneOne) : cloneOne(mesh.material);
        highlightMaterials.set(mesh, highlighted);
        mesh.material = highlighted;
      });
      hoveredTarget = targetId;
    };

    const fitObject = (object: THREE.Object3D, padding = 1.02, saveAsHome = false) => {
      const box = new THREE.Box3().setFromObject(object);
      if (box.isEmpty()) return;
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const sphere = box.getBoundingSphere(new THREE.Sphere());
      const halfFov = THREE.MathUtils.degToRad(camera.fov * 0.5);
      const distanceForHeight = sphere.radius / Math.max(0.12, Math.sin(halfFov));
      const distanceForWidth = distanceForHeight / Math.max(camera.aspect, 0.75);
      const distance = Math.max(distanceForHeight, distanceForWidth) * padding;
      const [orbitX, , orbitZ] = AIRPORT_3D_CONFIG.defaultCamera.orbitDirection;
      const direction = new THREE.Vector3(orbitX, viewSettingsRef.current.cameraHeight, orbitZ).normalize();
      const position = center.clone().add(direction.multiplyScalar(distance));
      camera.near = Math.max(distance / 6000, 0.005);
      camera.far = Math.max(distance * 36, 1600);
      camera.updateProjectionMatrix();
      camera.position.copy(position);
      orbitControls.target.copy(center.clone().add(new THREE.Vector3(0, size.y * 0.02, 0)));
      camera.lookAt(orbitControls.target);
      orbitControls.minDistance = Math.max(size.length() * 0.02, 1.8);
      orbitControls.maxDistance = Math.max(size.length() * 40, 1000);
      orbitControls.update();
      if (saveAsHome) {
        homePosition = camera.position.clone();
        homeTarget = orbitControls.target.clone();
      }
    };

    const applyViewSettings = (next: Airport3DViewSettings, previous: Airport3DViewSettings) => {
      renderer.toneMappingExposure = next.brightness;
      camera.fov = next.fov;
      camera.updateProjectionMatrix();
      walkEyeHeight = Math.max(walkBaseEyeHeight, next.walkHeight);
      if (controlModeRef.current === "walk") {
        camera.position.y = walkGroundY + walkEyeHeight;
        walkLookTarget.y = camera.position.y;
        return;
      }
      const cameraChanged = next.cameraHeight !== previous.cameraHeight
        || next.distance !== previous.distance
        || next.fov !== previous.fov;
      if (cameraChanged && loadedRoot) fitObject(loadedRoot, next.distance, true);
    };
    applyViewSettingsRef.current = applyViewSettings;

    const clearPlatform = () => {
      loadedPlatformParts.forEach((part) => {
        scene.remove(part);
        if (part instanceof THREE.Mesh || part instanceof THREE.LineSegments) {
          part.geometry.dispose();
          disposeMaterial((part as THREE.Mesh | THREE.LineSegments).material);
        }
      });
      loadedPlatformParts = [];
    };

    const createDisplayPlatform = (root: THREE.Object3D) => {
      clearPlatform();
      const box = new THREE.Box3().setFromObject(root);
      if (box.isEmpty()) return;
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const padX = Math.max(size.x * 1.06, 22);
      const padZ = Math.max(size.z * 1.06, 22);

      const platform = new THREE.Mesh(
        new THREE.BoxGeometry(padX, 0.28, padZ),
        new THREE.MeshStandardMaterial({
          color: 0x08131f,
          roughness: 0.48,
          metalness: 0.38,
          emissive: new THREE.Color(0x0c2232),
          emissiveIntensity: 0.22,
        }),
      );
      platform.position.set(center.x, -0.18, center.z);
      platform.receiveShadow = true;
      scene.add(platform);

      const topPlate = new THREE.Mesh(
        new THREE.PlaneGeometry(padX * 1.01, padZ * 1.01),
        new THREE.MeshStandardMaterial({
          color: 0x06111d,
          map: gridTexture,
          emissive: new THREE.Color(0x0b2940),
          emissiveMap: gridTexture,
          emissiveIntensity: 0.15,
          roughness: 0.42,
          metalness: 0.22,
          transparent: true,
          opacity: 0.9,
        }),
      );
      topPlate.rotation.x = -Math.PI / 2;
      topPlate.position.set(center.x, -0.036, center.z);
      topPlate.receiveShadow = true;
      scene.add(topPlate);

      const edge = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(padX, 0.28, padZ)),
        new THREE.LineBasicMaterial({ color: 0x27d7ff, transparent: true, opacity: 0.34 }),
      );
      edge.position.copy(platform.position);
      scene.add(edge);

      const underGlow = new THREE.Mesh(
        new THREE.CircleGeometry(Math.max(padX, padZ) * 0.42, 96),
        new THREE.MeshBasicMaterial({ color: 0x0f4f72, transparent: true, opacity: 0.1, depthWrite: false }),
      );
      underGlow.rotation.x = -Math.PI / 2;
      underGlow.position.set(center.x, -0.17, center.z);
      scene.add(underGlow);

      loadedPlatformParts = [platform, topPlate, edge, underGlow];
    };

    const updateCameraClipPlanes = () => {
      const nextNear = controlModeRef.current === "walk" ? 0.01 : 0.02;
      const nextFar = 5200;
      if (Math.abs(camera.near - nextNear) > 0.0005 || Math.abs(camera.far - nextFar) > 1) {
        camera.near = nextNear;
        camera.far = nextFar;
        camera.updateProjectionMatrix();
      }
    };

    const updateHeading = () => {
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      direction.y = 0;
      if (direction.lengthSq() < 1e-6) return;
      direction.normalize();
      const nextHeading = (THREE.MathUtils.radToDeg(Math.atan2(direction.x, -direction.z)) + 360) % 360;
      if (!Number.isFinite(lastHeading) || Math.abs(nextHeading - lastHeading) >= 1) {
        lastHeading = nextHeading;
        setHeading(nextHeading);
      }
    };

    const resetCamera = () => {
      camera.position.copy(homePosition);
      orbitControls.target.copy(homeTarget);
      camera.lookAt(homeTarget);
      orbitControls.update();
      restoreHighlight();
      setSelectedTarget(null);
      if (controlModeRef.current === "walk" && walkControls.isLocked) {
        walkControls.unlock();
      }
    };
    resetCameraRef.current = resetCamera;

    const setControlMode = (mode: Airport3DControlMode) => {
      controlModeRef.current = mode;
      setControlModeState(mode);
      if (mode === "walk") {
        orbitControls.enabled = false;
        if (!walkControls.isLocked) {
          camera.position.copy(walkSpawn);
          camera.position.y = walkGroundY + walkEyeHeight;
          camera.lookAt(walkLookTarget);
          updateCameraClipPlanes();
          updateHeading();
        }
        renderer.domElement.style.cursor = walkControls.isLocked ? "crosshair" : "pointer";
      } else {
        if (walkControls.isLocked) walkControls.unlock();
        orbitControls.enabled = true;
        camera.position.copy(homePosition);
        orbitControls.target.copy(homeTarget);
        camera.lookAt(homeTarget);
        orbitControls.update();
        updateCameraClipPlanes();
        updateHeading();
        renderer.domElement.style.cursor = "grab";
      }
    };
    setControlModeRef.current = setControlMode;

    const loadModel = async () => {
      if (!AIRPORT_3D_CONFIG.enabled || !AIRPORT_3D_CONFIG.modelUrl.trim()) return;
      setLoading(true);
      setError(null);
      setProgress(0);
      let draco: DRACOLoader | undefined;
      try {
        const loader = new GLTFLoader();
        loader.setMeshoptDecoder(MeshoptDecoder);
        if (AIRPORT_3D_CONFIG.dracoPath.trim()) {
          draco = new DRACOLoader();
          draco.setDecoderPath(AIRPORT_3D_CONFIG.dracoPath);
          loader.setDRACOLoader(draco);
        }
        const gltf = await new Promise<Awaited<ReturnType<GLTFLoader["loadAsync"]>>>((resolve, reject) => {
          loader.load(
            AIRPORT_3D_CONFIG.modelUrl,
            resolve,
            (event) => setProgress(event.total ? Math.min(99, Math.round((event.loaded / event.total) * 100)) : Math.min(95, Math.round(event.loaded / 180000))),
            reject,
          );
        });
        if (disposed) return;

        loadedRoot = gltf.scene;
        const initialBox = new THREE.Box3().setFromObject(loadedRoot);
        const initialCenter = initialBox.getCenter(new THREE.Vector3());
        loadedRoot.position.x -= initialCenter.x;
        loadedRoot.position.z -= initialCenter.z;
        const shiftedBox = new THREE.Box3().setFromObject(loadedRoot);
        loadedRoot.position.y -= shiftedBox.min.y;
        loadedRoot.position.y += 0.024;
        loadedRoot.updateMatrixWorld(true);
        const modelBox = new THREE.Box3().setFromObject(loadedRoot);
        const modelSize = modelBox.getSize(new THREE.Vector3());
        const modelHorizontalSize = Math.min(modelSize.x, modelSize.z);

        loadedRoot.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          object.castShadow = true;
          object.receiveShadow = true;
          originalMaterials.set(object, object.material);
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          const searchable = `${object.name} ${object.parent?.name ?? ""} ${materialNames(object.material)}`.toLowerCase();
          const objectSize = new THREE.Box3().setFromObject(object).getSize(new THREE.Vector3());
          const isBroadHorizontalSurface = objectSize.x >= modelHorizontalSize * 0.25
            && objectSize.z >= modelHorizontalSize * 0.25
            && objectSize.y <= Math.max(0.5, modelSize.y * 0.03);
          const isGroundSurface = /(grass|lawn|asphalt|road|pavement|parking|site|landscape|ground|terrain)/.test(searchable)
            || isBroadHorizontalSurface;
          const isSurfaceOverlay = /(light|marking|line|decal|stripe)/.test(searchable);
          const surfaceLayer = isSurfaceOverlay ? 4 : /asphalt|road|pavement|parking/.test(searchable) ? 2 : isGroundSurface ? 1 : 0;
          if (isGroundSurface || isSurfaceOverlay) {
            object.castShadow = false;
            object.renderOrder = surfaceLayer;
          }
          if (isGroundSurface) walkableGroundMeshes.push(object);
          materials.forEach((material) => {
            if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhysicalMaterial) {
              material.envMapIntensity = AIRPORT_3D_CONFIG.lighting.environmentIntensity;
              material.needsUpdate = true;
              const maps = [material.map, material.normalMap, material.roughnessMap, material.metalnessMap];
              maps.forEach((texture) => {
                if (texture) texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
              });
            }
            if (isGroundSurface || isSurfaceOverlay) {
              material.polygonOffset = true;
              material.polygonOffsetFactor = -surfaceLayer;
              material.polygonOffsetUnits = -surfaceLayer;
              material.needsUpdate = true;
            }
          });
          const target = AIRPORT_3D_CONFIG.targets.find((item) =>
            item.objectPatterns.some((pattern) => searchable.includes(pattern.toLowerCase()))
            || item.materialPatterns?.some((pattern) => searchable.includes(pattern.toLowerCase())),
          );
          if (target) {
            object.userData.airportTarget = target.id;
            interactiveMeshes.push(object);
            targetMeshes.set(target.id, [...(targetMeshes.get(target.id) ?? []), object]);
          }
        });

        scene.add(loadedRoot);
        renderer.shadowMap.needsUpdate = true;
        renderer.shadowMap.autoUpdate = false;

        const overviewBox = new THREE.Box3().setFromObject(loadedRoot);
        const overviewSize = overviewBox.getSize(new THREE.Vector3());
        const overviewCenter = overviewBox.getCenter(new THREE.Vector3());
        walkRayOriginY = overviewBox.max.y + Math.max(overviewSize.y * 2, 10);
        walkBaseEyeHeight = Math.max(3, overviewSize.y * 0.055);
        walkEyeHeight = Math.max(walkBaseEyeHeight, viewSettingsRef.current.walkHeight);
        walkMoveSpeed = THREE.MathUtils.clamp(Math.min(overviewSize.x, overviewSize.z) * 0.025, 3, 10);
        walkGroundY = overviewBox.min.y + 0.012;
        walkBounds = new THREE.Box2(
          new THREE.Vector2(overviewBox.min.x + 0.1, overviewBox.min.z + 0.1),
          new THREE.Vector2(overviewBox.max.x - 0.1, overviewBox.max.z - 0.1),
        );
        walkSpawn = new THREE.Vector3(
          overviewCenter.x + overviewSize.x * 0.12,
          walkGroundY + walkEyeHeight,
          overviewCenter.z + overviewSize.z * 0.16,
        );
        walkGroundY = getWalkGroundHeight(walkSpawn.x, walkSpawn.z, walkGroundY) + 0.018;
        walkSpawn.y = walkGroundY + walkEyeHeight;
        walkLookTarget = new THREE.Vector3(
          overviewCenter.x,
          walkGroundY + walkEyeHeight,
          overviewCenter.z,
        );
        radialRing.position.set(overviewCenter.x, overviewBox.min.y - 0.012, overviewCenter.z);
        camera.fov = viewSettingsRef.current.fov;
        camera.updateProjectionMatrix();
        fitObject(loadedRoot, viewSettingsRef.current.distance, true);
        setProgress(100);

        if (gltf.animations.length) {
          mixer = new THREE.AnimationMixer(loadedRoot);
          gltf.animations.forEach((clip) => mixer?.clipAction(clip).play());
        }
      } catch (loadError) {
        if (!disposed) setError(loadError instanceof Error ? loadError.message : "Unable to load the temporary hospital reference model");
      } finally {
        draco?.dispose();
        if (!disposed) setLoading(false);
      }
    };
    void loadModel();

    const updatePointer = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const raycastTarget = (event: PointerEvent) => {
      updatePointer(event);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(interactiveMeshes, false)[0]?.object as THREE.Mesh | undefined;
      return hit?.userData.airportTarget as string | undefined;
    };

    const onMove = (event: PointerEvent) => {
      if (controlModeRef.current === "walk") {
        renderer.domElement.style.cursor = walkControls.isLocked ? "crosshair" : "pointer";
        return;
      }
      const targetId = interactiveMeshes.length ? raycastTarget(event) : undefined;
      applyHighlight(targetId ?? null);
      renderer.domElement.style.cursor = targetId ? "pointer" : "grab";
    };

    const onPointerDown = (event: PointerEvent) => { pointerDown = { x: event.clientX, y: event.clientY }; };
    const onPointerUp = (event: PointerEvent) => {
      if (controlModeRef.current === "walk") return;
      if (!pointerDown || Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > 6) {
        pointerDown = null;
        return;
      }
      pointerDown = null;
      const targetId = interactiveMeshes.length ? raycastTarget(event) : undefined;
      if (!targetId) return;
      setSelectedTarget(targetId);
      const target = AIRPORT_3D_CONFIG.targets.find((item) => item.id === targetId);
      const meshes = targetMeshes.get(targetId) ?? [];
      if (meshes.length) {
        const box = new THREE.Box3();
        meshes.forEach((mesh) => box.expandByObject(mesh));
        const size = box.getSize(new THREE.Vector3());
        const proxy = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z));
        proxy.position.copy(box.getCenter(new THREE.Vector3()));
        fitObject(proxy, target?.cameraPadding ?? 1.25, false);
        proxy.geometry.dispose();
      }
    };

    const onCanvasClick = () => {
      if (controlModeRef.current === "walk" && !walkControls.isLocked) {
        walkControls.lock();
      }
    };

    const onKeyChange = (pressed: boolean, code: string) => {
      switch (code) {
        case "KeyW": movement.forward = pressed; break;
        case "KeyS": movement.backward = pressed; break;
        case "KeyA": movement.left = pressed; break;
        case "KeyD": movement.right = pressed; break;
        case "ShiftLeft":
        case "ShiftRight":
        case "ControlLeft":
        case "ControlRight":
          movement.boost = pressed;
          break;
        default:
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (controlModeRef.current !== "walk") return;
      if (event.code === "Escape" && walkControls.isLocked) {
        walkControls.unlock();
        return;
      }
      onKeyChange(true, event.code);
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (controlModeRef.current !== "walk") return;
      onKeyChange(false, event.code);
    };

    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointerleave", restoreHighlight);
    renderer.domElement.addEventListener("click", onCanvasClick);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

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

    const clock = new THREE.Clock();
    const animate = () => {
      const delta = clock.getDelta();
      mixer?.update(delta);
      if (controlModeRef.current === "walk") {
        const speed = movement.boost ? walkMoveSpeed * 2.4 : walkMoveSpeed;
        if (movement.forward) walkControls.moveForward(speed * delta);
        if (movement.backward) walkControls.moveForward(-speed * delta);
        if (movement.left) walkControls.moveRight(-speed * delta);
        if (movement.right) walkControls.moveRight(speed * delta);
        camera.position.x = THREE.MathUtils.clamp(camera.position.x, walkBounds.min.x, walkBounds.max.x);
        camera.position.z = THREE.MathUtils.clamp(camera.position.z, walkBounds.min.y, walkBounds.max.y);
        walkGroundY = getWalkGroundHeight(camera.position.x, camera.position.z, walkGroundY - 0.018) + 0.018;
        camera.position.y = walkGroundY + walkEyeHeight;
      } else {
        orbitControls.update();
      }
      updateCameraClipPlanes();
      updateHeading();
      skyDome.position.copy(camera.position);
      fieldStars.position.copy(camera.position);
      milkyWay.group.position.copy(camera.position);
      const starScale = THREE.MathUtils.clamp(
        (Math.max(620, container.clientHeight) / 900) * (38 / Math.max(28, camera.fov)) * renderer.getPixelRatio(),
        0.66,
        1.32,
      );
      (fieldStars.material as THREE.ShaderMaterial).uniforms.uScale.value = starScale;
      milkyWay.starMaterial.uniforms.uScale.value = starScale * 0.92;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      resizeObserver?.disconnect();
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointerleave", restoreHighlight);
      renderer.domElement.removeEventListener("click", onCanvasClick);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      if (walkControls.isLocked) walkControls.unlock();
      orbitControls.dispose();
      walkControls.disconnect();
      restoreHighlight();
      clearPlatform();
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh || object instanceof THREE.LineSegments || object instanceof THREE.Points)) return;
        object.geometry?.dispose();
        disposeMaterial(object.material);
      });
      targetMeshes.clear();
      originalMaterials.clear();
      highlightMaterials.clear();
      interactiveMeshes.length = 0;
      walkableGroundMeshes.length = 0;
      loadedRoot = null;
      mixer = null;
      gridTexture.dispose();
      starTexture.dispose();
      glowTexture.dispose();
      environmentRenderTarget.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement.parentElement === container) container.removeChild(renderer.domElement);
    };
  }, [containerRef]);

  return {
    loading,
    progress,
    error,
    selectedTarget,
    resetCamera: () => resetCameraRef.current(),
    controlMode,
    setControlMode: (mode: Airport3DControlMode) => setControlModeRef.current(mode),
    walkLocked,
    heading,
    viewSettings,
    setViewSettings: (patch: Partial<Airport3DViewSettings>) => {
      setViewSettingsState((current) => {
        const next = { ...current, ...patch };
        viewSettingsRef.current = next;
        applyViewSettingsRef.current(next, current);
        try { window.localStorage.setItem(VIEW_SETTINGS_STORAGE_KEY, JSON.stringify(next)); } catch { /* Persistence is optional. */ }
        return next;
      });
    },
    resetViewSettings: () => {
      const previous = viewSettingsRef.current;
      const next = { ...DEFAULT_AIRPORT_3D_VIEW_SETTINGS };
      viewSettingsRef.current = next;
      setViewSettingsState(next);
      applyViewSettingsRef.current(next, previous);
      try { window.localStorage.setItem(VIEW_SETTINGS_STORAGE_KEY, JSON.stringify(next)); } catch { /* Persistence is optional. */ }
    },
  };
}
