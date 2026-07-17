export interface Airport3DTarget {
  id: string;
  label: string;
  objectPatterns: string[];
  materialPatterns?: string[];
  module: string;
  cameraPadding?: number;
}

/**
 * Temporary mappings for the retained reference GLB. The geometry is still the
 * source model supplied with the industrial-park project; labels and navigation
 * are hospital-specific until the official hospital GLB is provided.
 */
export const AIRPORT_3D_TARGETS: Airport3DTarget[] = [
  {
    id: "hospital-buildings",
    label: "Hospital Clinical Buildings",
    objectPatterns: ["building", "factory", "warehouse", "workshop", "mesh"],
    materialPatterns: ["concrete", "wall", "roof", "glass"],
    module: "SPATIAL",
    cameraPadding: 1.55,
  },
  {
    id: "hospital-infrastructure",
    label: "Hospital Roads & Critical Infrastructure",
    objectPatterns: ["road", "street", "utility", "infrastructure"],
    materialPatterns: ["road", "asphalt", "pavement"],
    module: "CRITICAL_UTILITIES",
    cameraPadding: 1.45,
  },
  {
    id: "hospital-landscape",
    label: "Hospital Campus & Landscape",
    objectPatterns: ["landscape", "terrain", "water", "tree", "grass"],
    materialPatterns: ["grass", "water", "terrain", "landscape"],
    module: "SPATIAL",
    cameraPadding: 1.35,
  },
];
