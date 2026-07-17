import { AIRPORT_3D_TARGETS } from "./airport3DTargets";

export const AIRPORT_3D_CONFIG = {
  enabled: true,
  modelUrl: "/models/hospital-tree-opt.glb",
  dracoPath: "",
  background: "#020a14",
  defaultCamera: {
    position: [51.6161, 65.572, 200.3459] as [number, number, number],
    target: [-55.6017, 40.8681, 76.502] as [number, number, number],
    orbitDirection: [0.84, 1.5, 1] as [number, number, number],
    fov: 38,
    near: 0.02,
    far: 10000,
  },
  defaultWalkCamera: {
    position: [53.1221, 35.8437, 142.8888] as [number, number, number],
    lookDirection: [-0.755, 0.062, -0.6528] as [number, number, number],
    eyeHeight: 35.7897,
  },
  lighting: {
    exposure: 0.82,
    environmentIntensity: 0.85,
    keyIntensity: 3.2,
    fillIntensity: 1.65,
    rimIntensity: 1.35,
  },
  targets: AIRPORT_3D_TARGETS,
};
