/**
 * BMS Texture Animator
 *
 * Babylon Sandbox handles some texture/material animation automatically via
 * extensions that Three.js GLTFLoader doesn't process. This module provides
 * manual runtime fallbacks:
 *   - UV scroll  (water / airflow / pipe / coolant textures)
 *   - Texture rotation (fan / blade)
 *   - Emissive pulse (glow / alarm / active)
 *
 * Usage:
 *   const ctrl = createTextureAnimationController(gltfScene, equipmentId);
 *   // in render loop:
 *   ctrl.update(delta, elapsed);
 */

import * as THREE from "three";

// ─── Per-equipment manual keyword overrides ───────────────────────────────────
// Add mesh/material name fragments that MUST be animated for each equipment.
// These are checked FIRST so you can force animation even without keyword match.

export const EQUIPMENT_ANIM_RULES: Record<string, string[]> = {
  chiller:              ["water", "flow", "pipe", "fan", "coolant", "chilled"],
  ahu:                  ["fan", "air", "filter", "flow", "supply", "return", "blade"],
  fcu:                  ["fan", "air", "blade", "coil"],
  vav:                  ["damper", "air", "flow", "blade"],
  "plate-heat-exchanger": ["water", "flow", "heat", "pipe", "primary", "secondary"],
  "crah-unit":          ["fan", "air", "blade", "flow", "cool", "supply", "return", "rack"],
};

// ─── Auto-detect keyword patterns ────────────────────────────────────────────

const FLOW_KW  = /water|flow|pipe|air|wind|airflow|liquid|arrow|stream|coolant|chilled|supply|return|uv|animated|hvac|duct/i;
const ROTATE_KW = /fan|rotate|rotation|blade|wheel|impeller|propeller/i;
const PULSE_KW  = /glow|led|light|alarm|active|indicator|status|emissive/i;

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScrollEntry {
  texture: THREE.Texture;
  axis: "x" | "y";
  speed: number;
}

interface RotateEntry {
  texture: THREE.Texture;
  speed: number;
}

interface PulseEntry {
  material: THREE.MeshStandardMaterial;
  base: number;
}

export interface TextureAnimationController {
  update(delta: number, elapsed: number): void;
  /** Total number of animated textures + materials found */
  count: number;
  /** Human-readable summary for debug */
  summary(): string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Only OVERLAY textures are animated — never the base albedo `map`, normal,
// roughness or metalness. Scrolling those shifts the whole visible surface and
// makes the entire model look like it's animating (the FCU bug).
const ANIMATABLE_SLOTS = ["emissiveMap", "alphaMap"] as const;

function collectTextures(mat: THREE.MeshStandardMaterial): { slot: string; texture: THREE.Texture }[] {
  const out: { slot: string; texture: THREE.Texture }[] = [];
  for (const slot of ANIMATABLE_SLOTS) {
    const tex = (mat as any)[slot] as THREE.Texture | null;
    if (tex?.isTexture) out.push({ slot, texture: tex });
  }
  return out;
}

/**
 * Build the name used for keyword matching.
 * IMPORTANT: only the MATERIAL name and the TEXTURE's own name are used —
 * NOT mesh.name or mesh.parent.name. A shared parent/mesh name would otherwise
 * taint every child mesh and animate the whole model.
 */
function getMatchName(mat: THREE.MeshStandardMaterial): string {
  return [
    mat.name,
    (mat.emissiveMap as any)?.name ?? "",
    (mat.alphaMap as any)?.name ?? "",
  ].join(" ").toLowerCase();
}

/**
 * Flow match requires a REAL keyword hit on the material/texture name.
 * The broad equipment keyword list is NOT applied blindly here — it only
 * augments the auto-detect regex, and only when the name genuinely contains it.
 */
function matchesFlow(name: string, equipKeywords: string[]): boolean {
  if (!name.trim()) return false;
  return FLOW_KW.test(name) || equipKeywords.some((k) => name.includes(k));
}

function matchesRotate(name: string, equipKeywords: string[]): boolean {
  if (!name.trim()) return false;
  return ROTATE_KW.test(name) || equipKeywords.some((k) => ROTATE_KW.test(k) && name.includes(k));
}

// ─── Main factory ─────────────────────────────────────────────────────────────

export function createTextureAnimationController(
  model: THREE.Object3D,
  equipmentId?: string,
): TextureAnimationController {
  const equipKw = EQUIPMENT_ANIM_RULES[equipmentId ?? ""] ?? [];

  const scrollEntries: ScrollEntry[] = [];
  const rotateEntries: RotateEntry[] = [];
  const pulseEntries:  PulseEntry[]  = [];

  const seenTextures = new Set<THREE.Texture>();
  const seenMaterials = new Set<THREE.Material>();

  model.traverse((obj) => {
    if (!(obj as THREE.Mesh).isMesh) return;
    const mesh = obj as THREE.Mesh;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

    for (const rawMat of mats) {
      if (!rawMat || seenMaterials.has(rawMat)) continue;
      seenMaterials.add(rawMat);

      const mat = rawMat as THREE.MeshStandardMaterial;
      const name = getMatchName(mat);
      const textures = collectTextures(mat);

      const isFlow   = matchesFlow(name, equipKw);
      const isRotate = matchesRotate(name, equipKw);

      for (const { texture: tex } of textures) {
        if (seenTextures.has(tex)) continue;
        seenTextures.add(tex);

        if (isRotate) {
          tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
          tex.center.set(0.5, 0.5);
          tex.needsUpdate = true;
          rotateEntries.push({ texture: tex, speed: 1.8 });
        } else if (isFlow) {
          tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
          tex.needsUpdate = true;
          const speed = /return/i.test(name) ? -0.22 : 0.28;
          const axis: "x" | "y" = /duct|horizontal|return/i.test(name) ? "x" : "y";
          scrollEntries.push({ texture: tex, axis, speed });
        }
      }

      // Emissive pulse: only on materials whose name explicitly matches pulse keywords
      if (PULSE_KW.test(name) && (mat as THREE.MeshStandardMaterial).emissive !== undefined) {
        pulseEntries.push({ material: mat, base: mat.emissiveIntensity ?? 0.5 });
      }
    }
  });

  const totalCount = scrollEntries.length + rotateEntries.length + pulseEntries.length;

  console.log(
    `[BMS TexAnim] equipment=${equipmentId ?? "unknown"} ` +
    `scroll=${scrollEntries.length} rotate=${rotateEntries.length} pulse=${pulseEntries.length}`,
  );

  return {
    count: totalCount,

    update(delta: number, elapsed: number) {
      for (const e of scrollEntries) {
        if (e.axis === "x") e.texture.offset.x -= delta * e.speed;
        else                 e.texture.offset.y -= delta * e.speed;
        e.texture.needsUpdate = true;
      }
      for (const e of rotateEntries) {
        e.texture.rotation += delta * e.speed;
        e.texture.needsUpdate = true;
      }
      for (const e of pulseEntries) {
        e.material.emissiveIntensity = e.base + Math.sin(elapsed * 2.5) * 0.2;
      }
    },

    summary() {
      return (
        `scroll:${scrollEntries.length} rotate:${rotateEntries.length} ` +
        `pulse:${pulseEntries.length}`
      );
    },
  };
}
