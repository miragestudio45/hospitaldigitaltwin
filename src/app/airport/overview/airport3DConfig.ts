import { AIRPORT_3D_TARGETS } from "./airport3DTargets";

export const AIRPORT_3D_CONFIG = {
  enabled: true,
  modelUrl: "https://pub-ad3c98c8c26c4e95ad475279f7257940.r2.dev/ff_opt.glb",
  dracoPath: "",
  background: "#020a14",
  defaultCamera: {
    position: [18, 12, 20] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    fov: 38,
    near: 0.02,
    far: 10000,
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
