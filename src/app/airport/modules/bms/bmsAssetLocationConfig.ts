/**
 * BMS 2D/3D + Asset Location configuration.
 *
 * Model URLs are served from the YooTek dev host. They are loaded at runtime
 * by BMSModelViewer via Three.js GLTFLoader. Scoped to BMS only.
 */

// ─── Model URLs (from Fix.pdf) ────────────────────────────────────────────────

/** Fix 1 — SITE overview (TOÀN CẢNH) 3D model. Contains Demo room 1 / Demo room 2. */
export const OVERVIEW_3D_MODEL_URL =
  "https://development.imaxhitech.com:9990/yootek/1783500667198-9862.glb";

/** Fix 2 — BMS HVAC Floor Plan 3D model. */
export const FLOORPLAN_3D_MODEL_URL =
  "https://development.imaxhitech.com:9990/yootek/1783500737848-7399.glb";

/** Fix 3 — asset location model. */
export const ASSET_LOCATION_MODEL_URL =
  "https://development.imaxhitech.com:9990/yootek/1783500739532-5370.glb";

// ─── Fix 1: interactive rooms in the overview model ───────────────────────────
// Object names to detect via object.name / parent.name (case-insensitive,
// matched by substring so "Demo room 1", "DemoRoom_1", "demo-room-1" all hit).

export const OVERVIEW_INTERACTIVE_ROOMS: string[] = [
  "Demo room 1",
  "Demo room 2",
];

// ─── Fix 3: building / floor mock data ────────────────────────────────────────
// availableFloors are the floors that actually contain the selected asset.

export interface BmsBuilding {
  id: string;
  name: string;
}

export interface BmsFloor {
  id: string;
  name: string;
}

export const BMS_BUILDINGS: BmsBuilding[] = [
  { id: "terminal-t1", name: "Acute Care Tower" },
  { id: "utility-plant", name: "Central Utility Plant" },
  { id: "mini-dc", name: "Hospital Data Center" },
];

/** High-tech park zones that contain the currently viewed equipment type. */
export const ASSET_AVAILABLE_FLOORS: Record<string, BmsFloor[]> = {
  ahu: [
    { id: "t1-b1", name: "T1 · B1 Mechanical" },
    { id: "t1-l2", name: "T1 · Level 2 Departures" },
    { id: "t1-l3", name: "T1 · Level 3 Concourse" },
  ],
  fcu: [
    { id: "t1-l1", name: "T1 · Level 1 Arrivals" },
    { id: "t1-l2", name: "T1 · Level 2 Retail" },
    { id: "t1-l3", name: "T1 · Level 3 Lounges" },
  ],
  vav: [
    { id: "t1-l2", name: "T1 · Level 2 Zone B" },
    { id: "t1-l3", name: "T1 · Level 3 Zone C" },
  ],
  chiller: [
    { id: "cup-b1", name: "Central Utility Plant · Chiller Hall" },
  ],
  "plate-heat-exchanger": [
    { id: "cup-b1", name: "Central Utility Plant · Heat Exchange Room" },
  ],
  "crah-unit": [
    { id: "dc-l1", name: "Mini DC · Data Hall 1" },
    { id: "dc-l2", name: "Mini DC · Data Hall 2" },
  ],
};

/** High-tech park-specific location metadata used by the EBO / BMS workflow. */
export interface AssetLocationInfo {
  code: string;
  building: string;
  floor: string;
  area: string;
  locationObjectName?: string;
}

export const ASSET_LOCATION_INFO: Record<string, AssetLocationInfo> = {
  ahu:     { code: "DHTP-AHU-RD-L2-01", building: "Acute Care Tower", floor: "Level 2", area: "R&D Mechanical Zone" },
  fcu:     { code: "DHTP-FCU-RD-L2-18", building: "Acute Care Tower", floor: "Level 2", area: "Laboratory Support Zone B" },
  vav:     { code: "DHTP-VAV-RD-L3-05", building: "Acute Care Tower", floor: "Level 3", area: "Cleanroom Support Zone C" },
  chiller: { code: "DHTP-CH-CUP-01", building: "Central Utility Plant", floor: "B1", area: "Chiller Hall" },
  "plate-heat-exchanger": { code: "DHTP-PHX-CUP-02", building: "Central Utility Plant", floor: "B1", area: "Heat Exchange Room" },
  "crah-unit": { code: "HSP-CRAH-DC-03", building: "Hospital Data Center", floor: "Level 1", area: "Data Hall 1" },
};

export function getAvailableFloors(equipmentId: string): BmsFloor[] {
  return ASSET_AVAILABLE_FLOORS[equipmentId] ?? [];
}

export function getAssetLocationInfo(equipmentId: string): AssetLocationInfo | undefined {
  return ASSET_LOCATION_INFO[equipmentId];
}
