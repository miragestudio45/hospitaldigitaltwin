import { AIRPORT_3D_TARGETS } from "./airport3DTargets";

export const AIRPORT_3D_CONFIG = {
  enabled: true,
  modelUrl: "/models/hospital-tree-opt.glb",
  dracoPath: "",
  background: "#020a14",
  defaultCamera: {
    position: [18, 12, 20] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    orbitDirection: [0.84, 1.5, 1] as [number, number, number],
    fov: 36,
    near: 0.02,
    far: 10000,
  },
  lighting: {
    exposure: 0.3,
    environmentIntensity: 0.85,
    keyIntensity: 3.2,
    fillIntensity: 1.65,
    rimIntensity: 1.35,
  },
  targets: AIRPORT_3D_TARGETS,
};
