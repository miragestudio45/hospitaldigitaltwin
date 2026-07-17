/**
 * BMS Equipment Configuration
 * Temporary reference asset source retained from the approved Facility Operations & EBO build.
 * Replace ASSET_BASE_URL or individual modelUrl values when official hospital assets are available.
 */

export const ASSET_BASE_URL = "https://bms-ioc-danang-vercel-updated.vercel.app/";

export function resolveModelUrl(rel: string): string {
  return new URL(rel, ASSET_BASE_URL).toString();
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type AnimationType = "fan" | "flow" | "valve" | "heat" | "air" | string;

export interface EquipmentParameter {
  key: string;
  label: string;
  value: string | number;
  unit: string;
  status?: "healthy" | "warning" | "fault" | "offline";
}

export interface BMSEquipment {
  id: string;
  name: string;
  nameVi: string;
  category: string;
  /** Absolute CDN URL from resolved manifest path */
  modelUrl: string;
  accentColor: string;
  defaultAnimation: AnimationType;
  parameters: EquipmentParameter[];
  schematicType: "ahu" | "fcu" | "vav" | "chiller" | "phx" | "crah";
}

// ─── Per-equipment camera angle presets for thumbnail ─────────────────────────
// [x, y, z] multipliers of the camera distance (dist * factor).
// These give each equipment a natural "hero angle" in the card preview.

export const THUMBNAIL_CAM_PRESETS: Record<string, [number, number, number]> = {
  ahu:                    [0.50, 0.44, 0.88], // top-down-ish → see duct top + body
  fcu:                    [0.65, 0.30, 0.82], // 3/4 front
  vav:                    [0.30, 0.52, 0.85], // steep top → see duct opening
  chiller:                [0.72, 0.26, 0.72], // side-elongated → show full length
  "plate-heat-exchanger": [0.78, 0.34, 0.70], // 3/4 slightly high → see plates
  "crah-unit":            [0.58, 0.32, 0.82], // 3/4 front → see fan/duct face
};

// ─── Animation label resolver ─────────────────────────────────────────────────

export const ANIMATION_LABEL_MAP: Array<{ patterns: string[]; label: string }> = [
  { patterns: ["fan", "rotate", "rotation", "spin", "blade", "impeller", "propeller"], label: "Fan Rotate"       },
  { patterns: ["flow", "water", "pipe", "liquid", "fluid", "pump", "coolant"],         label: "Water Flow"       },
  { patterns: ["air", "airflow", "wind", "ventil", "supply", "exhaust", "duct"],       label: "Air Flow"         },
  { patterns: ["valve", "open", "close", "door", "damper"],                            label: "Valve Open/Close" },
  { patterns: ["run", "running", "start", "system", "operate"],                        label: "System Run"       },
  { patterns: ["heat", "exchange", "thermal"],                                          label: "Heat Exchange"    },
  { patterns: ["stop", "off", "idle", "shutdown"],                                      label: "Stop"             },
];

export function resolveAnimationLabel(clipName: string): string {
  const lower = clipName.toLowerCase();
  for (const { patterns, label } of ANIMATION_LABEL_MAP) {
    if (patterns.some((p) => lower.includes(p))) return label;
  }
  return clipName;
}

// ─── Equipment list ───────────────────────────────────────────────────────────
// Order: HVAC group first, then Cooling, Heat Exchange, Data Center Cooling

export const BMS_EQUIPMENT_LIST: BMSEquipment[] = [
  // ── HVAC ──────────────────────────────────────────────────────────────────
  {
    id: "ahu",
    name: "AHU",
    nameVi: "Máy Xử Lý Không Khí",
    category: "HVAC",
    modelUrl: resolveModelUrl("./models/ahu-air-handling-unit.glb"),
    accentColor: "#06b6d4",
    defaultAnimation: "fan",
    schematicType: "ahu",
    parameters: [
      { key: "enable",    label: "Enable",          value: "Enabled", unit: "",    status: "healthy" },
      { key: "fan",       label: "Fan",              value: "Running", unit: "",    status: "healthy" },
      { key: "filter",    label: "Filter",           value: "Healthy", unit: "",    status: "healthy" },
      { key: "supplyT",   label: "Supply Air Temp",  value: 16.5,      unit: "°C",  status: "healthy" },
      { key: "returnT",   label: "Return Air Temp",  value: 24.2,      unit: "°C",  status: "healthy" },
      { key: "humidity",  label: "Humidity",         value: 58,        unit: "%",   status: "healthy" },
      { key: "co2",       label: "CO₂",              value: 620,       unit: "ppm", status: "warning" },
      { key: "damper",    label: "Damper",           value: 72,        unit: "%",   status: "healthy" },
    ],
  },
  {
    id: "fcu",
    name: "FCU",
    nameVi: "Dàn Lạnh",
    category: "HVAC",
    modelUrl: resolveModelUrl("./models/fcu.glb"),
    accentColor: "#22d3ee",
    defaultAnimation: "fan",
    schematicType: "fcu",
    parameters: [
      { key: "power",   label: "Power",         value: "On",     unit: "",   status: "healthy" },
      { key: "fan",     label: "Fan Speed",      value: "Medium", unit: "",   status: "healthy" },
      { key: "roomT",   label: "Room Temp",      value: 24.0,     unit: "°C", status: "healthy" },
      { key: "sp",      label: "Setpoint",       value: 23.0,     unit: "°C", status: "healthy" },
      { key: "valve",   label: "Valve Position", value: 64,       unit: "%",  status: "healthy" },
      { key: "alarm",   label: "Alarm",          value: "Normal", unit: "",   status: "healthy" },
    ],
  },
  {
    id: "vav",
    name: "VAV",
    nameVi: "Van Điều Chỉnh Lưu Lượng",
    category: "HVAC",
    modelUrl: resolveModelUrl("./models/vav.glb"),
    accentColor: "#38bdf8",
    defaultAnimation: "valve",
    schematicType: "vav",
    parameters: [
      { key: "damper",    label: "Damper Position", value: 68,       unit: "%",   status: "healthy" },
      { key: "airflow",   label: "Air Flow",         value: 420,      unit: "CFM", status: "healthy" },
      { key: "zoneT",     label: "Zone Temp",        value: 23.8,     unit: "°C",  status: "healthy" },
      { key: "sp",        label: "Setpoint",         value: 23.0,     unit: "°C",  status: "healthy" },
      { key: "pressure",  label: "Pressure",         value: "Normal", unit: "",    status: "healthy" },
      { key: "occupancy", label: "Occupancy",        value: "Active", unit: "",    status: "healthy" },
    ],
  },
  // ── Cooling System ─────────────────────────────────────────────────────────
  {
    id: "chiller",
    name: "Chiller",
    nameVi: "Máy Làm Lạnh Trung Tâm",
    category: "Cooling System",
    modelUrl: resolveModelUrl("./models/chiller.glb"),
    accentColor: "#0891b2",
    defaultAnimation: "flow",
    schematicType: "chiller",
    parameters: [
      { key: "enable",   label: "Enable",            value: "Enabled", unit: "",       status: "healthy" },
      { key: "run",      label: "Run",               value: "Running", unit: "",       status: "healthy" },
      { key: "fault",    label: "Fault",             value: "Healthy", unit: "",       status: "healthy" },
      { key: "supplyWT", label: "Supply Water Temp",  value: 6.0,       unit: "°C",     status: "healthy" },
      { key: "returnWT", label: "Return Water Temp",  value: 17.5,      unit: "°C",     status: "healthy" },
      { key: "flow",     label: "Flow Rate",          value: 128,       unit: "m³/h",   status: "healthy" },
      { key: "power",    label: "Power",              value: 186,       unit: "kW",     status: "healthy" },
      { key: "eff",      label: "Efficiency",         value: "0.62",    unit: "kW/RT",  status: "healthy" },
    ],
  },
  // ── Heat Exchange ──────────────────────────────────────────────────────────
  {
    id: "plate-heat-exchanger",
    name: "Plate Heat Exchanger",
    nameVi: "Thiết Bị Trao Đổi Nhiệt",
    category: "Heat Exchange",
    modelUrl: resolveModelUrl("./models/plate-heat-exchanger.glb"),
    accentColor: "#0e7490",
    defaultAnimation: "heat",
    schematicType: "phx",
    parameters: [
      { key: "priIn",   label: "Primary Inlet",    value: 45.0,     unit: "°C",   status: "healthy" },
      { key: "priOut",  label: "Primary Outlet",   value: 36.5,     unit: "°C",   status: "healthy" },
      { key: "secIn",   label: "Secondary Inlet",  value: 28.0,     unit: "°C",   status: "healthy" },
      { key: "secOut",  label: "Secondary Outlet", value: 34.8,     unit: "°C",   status: "healthy" },
      { key: "flow",    label: "Flow Rate",        value: 82,        unit: "m³/h", status: "healthy" },
      { key: "press",   label: "Pressure",         value: "Normal", unit: "",      status: "healthy" },
      { key: "xfer",    label: "Heat Transfer",    value: "Active", unit: "",      status: "healthy" },
    ],
  },
  // ── Data Center Cooling ────────────────────────────────────────────────────
  {
    id: "crah-unit",
    name: "CRAH Unit",
    nameVi: "Máy Làm Lạnh Phòng Máy Chủ",
    category: "Data Center Cooling",
    modelUrl: resolveModelUrl("./models/crah-unit.glb"),
    accentColor: "#818cf8",
    defaultAnimation: "fan",
    schematicType: "crah",
    parameters: [
      { key: "enable",   label: "Enable",           value: "Enabled", unit: "",   status: "healthy" },
      { key: "run",      label: "Run",              value: "Running", unit: "",   status: "healthy" },
      { key: "fault",    label: "Fault",            value: "Healthy", unit: "",   status: "healthy" },
      { key: "supplyT",  label: "Supply Air Temp",   value: 18.0,      unit: "°C", status: "healthy" },
      { key: "returnT",  label: "Return Air Temp",   value: 27.5,      unit: "°C", status: "healthy" },
      { key: "fanSpeed", label: "Fan Speed",         value: 78,        unit: "%",  status: "healthy" },
      { key: "humidity", label: "Humidity",          value: 46,        unit: "%",  status: "healthy" },
      { key: "cooling",  label: "Cooling Capacity",  value: 42,        unit: "kW", status: "healthy" },
      { key: "hall",     label: "Data Hall",         value: "Active",  unit: "",   status: "healthy" },
    ],
  },
];

export const BMS_EQUIPMENT_MAP: Record<string, BMSEquipment> = Object.fromEntries(
  BMS_EQUIPMENT_LIST.map((e) => [e.id, e]),
);
