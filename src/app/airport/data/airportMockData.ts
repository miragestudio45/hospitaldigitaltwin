import { seededNumber, seededText } from "./seededRandom";

export type PageSize = 25 | 50 | 100;
export type AssetRow = {
  id: string; bimGuid: string; name: string; system: string; area: string; location: string;
  manufacturer: string; condition: "Good" | "Attention" | "Critical"; criticality: string;
  health: number; runtime: number; nextService: string; predictedFailure: string; dataQuality: number;
};
export type PatientFlowRow = {
  id: string; episode: string; department: string; stage: string; wait: number; acuity: string;
  bed: string; status: string; owner: string; updated: string;
};

export const AIRPORT_OVERVIEW_KPIS = [
  ["Licensed beds", "520", "482 staffed", "cyan"],
  ["Occupied beds", "418", "86.7%", "blue"],
  ["Available beds", "34", "12 isolation", "emerald"],
  ["ED waiting", "31", "4 high acuity", "amber"],
  ["Door-to-doctor", "28 min", "Target <30", "cyan"],
  ["ICU occupancy", "86%", "6 beds free", "amber"],
  ["OR active", "8 / 10", "2 turnover", "blue"],
  ["Expected discharge", "46", "By 16:00", "emerald"],
  ["Critical utilities", "99.7%", "1 warning", "emerald"],
  ["Open incidents", "7", "1 priority", "amber"],
] as const;

export const OPERATION_EVENTS = [
  ["10:42", "Emergency", "High-acuity arrival surge forecast", "ED", "Warning"],
  ["10:36", "Isolation", "Room pressure restored", "ISO-12", "Normal"],
  ["10:31", "Operating Theatre", "Case 04 moved to PACU", "OR-04", "Normal"],
  ["10:24", "Medical Gas", "Oxygen reserve threshold approaching", "Plant", "Warning"],
  ["10:18", "Bed Management", "Discharge cleaning completed", "Ward 6B", "Normal"],
] as const;

export const INCIDENTS = [
  ["INC-HSP-260717-01", "Emergency arrivals above forecast", "High", "Emergency Department", "Responding", "Hospital Command"],
  ["INC-HSP-260717-02", "Oxygen reserve below operational target", "High", "Medical Gas Plant", "Investigating", "Facility Operations"],
  ["INC-HSP-260717-03", "Negative pressure excursion", "Medium", "Isolation Room ISO-12", "Resolved", "IPC Team"],
  ["INC-HSP-260717-04", "PACS transfer latency elevated", "Low", "Imaging", "Monitoring", "Clinical IT"],
] as const;

const ASSET_NAMES = ["Ventilator", "Infusion Pump", "Patient Monitor", "Anaesthesia Workstation", "Defibrillator", "Ultrasound", "Dialysis Unit", "AHU", "UPS", "Medical Air Compressor"];
const SYSTEMS = ["Critical Care", "Medication Delivery", "Patient Monitoring", "Operating Theatre", "Emergency", "Imaging", "Dialysis", "HVAC", "Critical Power", "Medical Gas"];
const AREAS = ["Emergency", "ICU", "Operating Theatre", "Imaging", "Ward 6B", "Dialysis", "CSSD", "Central Plant"];
export const ASSETS: AssetRow[] = Array.from({ length: 420 }, (_, index) => {
  const critical = index % 47 === 0;
  const attention = !critical && index % 11 === 0;
  return {
    id: `MED-${String(index + 1).padStart(5, "0")}`,
    bimGuid: `HSP-${seededText(index, 14)}`,
    name: `${ASSET_NAMES[index % ASSET_NAMES.length]} ${String((index % 38) + 1).padStart(2, "0")}`,
    system: SYSTEMS[index % SYSTEMS.length], area: AREAS[index % AREAS.length],
    location: `${AREAS[index % AREAS.length]} · L${(index % 9) + 1} · R${String((index % 42) + 1).padStart(3, "0")}`,
    manufacturer: ["Philips", "GE HealthCare", "Dräger", "Siemens", "Schneider Electric", "Grundfos"][index % 6],
    condition: critical ? "Critical" : attention ? "Attention" : "Good",
    criticality: index % 5 === 0 ? "Life safety" : index % 3 === 0 ? "Clinical critical" : "Operational",
    health: critical ? seededNumber(index, 42, 61) : attention ? seededNumber(index, 62, 78) : seededNumber(index, 82, 99),
    runtime: seededNumber(index, 180, 16800), nextService: `2026-${String((index % 5) + 8).padStart(2, "0")}-${String((index % 24) + 1).padStart(2, "0")}`,
    predictedFailure: critical ? "< 30 days" : attention ? "30–90 days" : "> 180 days", dataQuality: seededNumber(index, 91, 100),
  };
});

export const PATIENT_FLOW_ROWS: PatientFlowRow[] = Array.from({ length: 240 }, (_, index) => ({
  id: `FLOW-${String(index + 1).padStart(5, "0")}`,
  episode: `ENC-${String(2607000 + index)}`,
  department: ["Emergency", "ICU", "Ward 6B", "Operating Theatre", "Imaging", "Outpatient"][index % 6],
  stage: ["Triage", "Waiting clinician", "Awaiting bed", "In treatment", "Ready for transfer", "Discharge pending"][index % 6],
  wait: seededNumber(index, 4, 96), acuity: ["1 · Resuscitation", "2 · Emergent", "3 · Urgent", "4 · Less urgent"][index % 4],
  bed: index % 5 === 0 ? "Unassigned" : `B-${(index % 12) + 1}-${String((index % 38) + 1).padStart(2, "0")}`,
  status: index % 13 === 0 ? "Escalated" : index % 7 === 0 ? "At risk" : "On plan",
  owner: ["ED Flow", "Bed Management", "ICU Coordinator", "OR Control", "Imaging Desk"][index % 5],
  updated: `${seededNumber(index, 0, 18)} min ago`,
}));

export const PREDICTIONS = ASSETS.filter((asset) => asset.health < 80).slice(0, 60);
export const SYSTEM_CONNECTIONS = [
  ["HIS / EMR", "Clinical", "HL7 / FHIR / API", "99.98%", "2 sec", "38 ms", "99.2%"],
  ["LIS", "Clinical", "HL7 / API", "99.96%", "3 sec", "42 ms", "98.9%"],
  ["RIS / PACS", "Imaging", "DICOM / DICOMweb", "99.94%", "4 sec", "68 ms", "98.7%"],
  ["EBO / BMS", "Facility OT", "BACnet / OPC UA", "99.99%", "1 sec", "22 ms", "99.6%"],
  ["Medical Gas", "Critical Utility", "Modbus / OPC UA", "99.97%", "2 sec", "31 ms", "99.1%"],
  ["RTLS", "Assets", "MQTT / API", "99.82%", "6 sec", "84 ms", "96.8%"],
  ["CMMS", "Enterprise", "REST API", "99.91%", "12 sec", "96 ms", "98.4%"],
] as const;

export function getHospitalTrend(seed = "hospital", points = 96, base = 72, spread = 13) {
  return Array.from({ length: points }, (_, index) => {
    const wave = Math.sin(index / 7) * spread * 0.42 + Math.sin(index / 19) * spread * 0.25;
    const noise = seededNumber(index + seed.length * 17, -spread * 0.3, spread * 0.3);
    const value = Math.max(0, Math.round((base + wave + noise) * 10) / 10);
    return { time: points > 120 ? `D${index + 1}` : `${String(Math.floor(index / 4)).padStart(2, "0")}:${String((index % 4) * 15).padStart(2, "0")}`, value, forecast: index > points * 0.78 ? Math.round((value + Math.sin(index / 5) * 2.8) * 10) / 10 : undefined };
  });
}
export const getParkTrend = (range = "24 Hours") => getHospitalTrend(`trend-${range}`, range === "5 Years" ? 360 : 96, 72, 14);
export const getEnergySeries = (range = "24 Hours") => getHospitalTrend(`energy-${range}`, range === "5 Years" ? 360 : 96, 58, 10);
export const getTenantServiceSeries = (range = "24 Hours") => getHospitalTrend(`service-${range}`, 96, 78, 8);

function pageRows<T>(rows: T[], page: number, pageSize: PageSize, search = "") {
  const q = search.trim().toLowerCase();
  const filtered = q ? rows.filter((row) => JSON.stringify(row).toLowerCase().includes(q)) : rows;
  return { rows: filtered.slice((page - 1) * pageSize, page * pageSize), total: filtered.length, page, pageSize };
}
export const getAssetPage = (page = 1, pageSize: PageSize = 25, search = "") => pageRows(ASSETS, page, pageSize, search);
export const getPatientFlowPage = (page = 1, pageSize: PageSize = 25, search = "") => pageRows(PATIENT_FLOW_ROWS, page, pageSize, search);
export const getTenantPage = getPatientFlowPage;
export const getPredictiveAssetPage = (page = 1, pageSize: PageSize = 25) => pageRows(PREDICTIONS, page, pageSize, "");
export const getWorkOrderPage = getAssetPage;
