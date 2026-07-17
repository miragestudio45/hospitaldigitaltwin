import React from "react";
import { HOSPITAL_SECTION_SPECS } from "./data/hospitalCatalog";
import { HospitalPatternRenderer } from "./shared/HospitalPatterns";
import type { HospitalSectionProps, HospitalSectionSpec } from "./types";

export { HOSPITAL_SECTION_SPECS } from "./data/hospitalCatalog";

const specById = new Map<string, HospitalSectionSpec>();
HOSPITAL_SECTION_SPECS.forEach((spec) => {
  if (specById.has(spec.id)) throw new Error(`Duplicate hospital section spec: ${spec.id}`);
  specById.set(spec.id, spec);
});

function createHospitalSectionRenderer(id: string): React.ComponentType<HospitalSectionProps> {
  const spec = specById.get(id);
  if (!spec) throw new Error(`Missing hospital section spec: ${id}`);
  const Renderer = () => <HospitalPatternRenderer spec={spec}/>;
  Renderer.displayName = `HospitalSection_${id.replaceAll("-", "_")}`;
  return Renderer;
}

export const HOSPITAL_SECTION_RENDERERS: Record<string, React.ComponentType<HospitalSectionProps>> = {
  "spatial-command": createHospitalSectionRenderer("spatial-command"),
  "campus-building-map": createHospitalSectionRenderer("campus-building-map"),
  "floor-department-explorer": createHospitalSectionRenderer("floor-department-explorer"),
  "clinical-room-classification": createHospitalSectionRenderer("clinical-room-classification"),
  "bed-bay-mapping": createHospitalSectionRenderer("bed-bay-mapping"),
  "clean-dirty-flow": createHospitalSectionRenderer("clean-dirty-flow"),
  "restricted-sterile-zones": createHospitalSectionRenderer("restricted-sterile-zones"),
  "fire-compartment-evacuation": createHospitalSectionRenderer("fire-compartment-evacuation"),
  "bim-federation": createHospitalSectionRenderer("bim-federation"),
  "spatial-data-cde": createHospitalSectionRenderer("spatial-data-cde"),
  "flow-command": createHospitalSectionRenderer("flow-command"),
  "emergency-operations": createHospitalSectionRenderer("emergency-operations"),
  "bed-management": createHospitalSectionRenderer("bed-management"),
  "icu-operations": createHospitalSectionRenderer("icu-operations"),
  "operating-theatre": createHospitalSectionRenderer("operating-theatre"),
  "outpatient-operations": createHospitalSectionRenderer("outpatient-operations"),
  "diagnostics-capacity": createHospitalSectionRenderer("diagnostics-capacity"),
  "admission-transfer-discharge": createHospitalSectionRenderer("admission-transfer-discharge"),
  "staffing-capacity": createHospitalSectionRenderer("staffing-capacity"),
  "clinical-systems-overview": createHospitalSectionRenderer("clinical-systems-overview"),
  "his-emr-health": createHospitalSectionRenderer("his-emr-health"),
  "laboratory-operations": createHospitalSectionRenderer("laboratory-operations"),
  "ris-pacs-imaging": createHospitalSectionRenderer("ris-pacs-imaging"),
  "pharmacy-medication": createHospitalSectionRenderer("pharmacy-medication"),
  "nurse-call": createHospitalSectionRenderer("nurse-call"),
  "critical-results": createHospitalSectionRenderer("critical-results"),
  "clinical-device-connectivity": createHospitalSectionRenderer("clinical-device-connectivity"),
  "experience-overview": createHospitalSectionRenderer("experience-overview"),
  "appointments-checkin": createHospitalSectionRenderer("appointments-checkin"),
  "queue-management": createHospitalSectionRenderer("queue-management"),
  "indoor-wayfinding": createHospitalSectionRenderer("indoor-wayfinding"),
  "visitor-management": createHospitalSectionRenderer("visitor-management"),
  "patient-transport": createHospitalSectionRenderer("patient-transport"),
  "parking-access": createHospitalSectionRenderer("parking-access"),
  "feedback-service-quality": createHospitalSectionRenderer("feedback-service-quality"),
  "fm-overview": createHospitalSectionRenderer("fm-overview"),
  "bim-explorer": createHospitalSectionRenderer("bim-explorer"),
  "asset-registry": createHospitalSectionRenderer("asset-registry"),
  "equipment-location-rtls": createHospitalSectionRenderer("equipment-location-rtls"),
  "equipment-availability": createHospitalSectionRenderer("equipment-availability"),
  "maintenance-plans": createHospitalSectionRenderer("maintenance-plans"),
  "work-orders": createHospitalSectionRenderer("work-orders"),
  "calibration-compliance": createHospitalSectionRenderer("calibration-compliance"),
  "recall-field-notice": createHospitalSectionRenderer("recall-field-notice"),
  "warranty-contracts": createHospitalSectionRenderer("warranty-contracts"),
  "critical-utilities-overview": createHospitalSectionRenderer("critical-utilities-overview"),
  "medical-gas-overview": createHospitalSectionRenderer("medical-gas-overview"),
  "oxygen-supply": createHospitalSectionRenderer("oxygen-supply"),
  "medical-air-vacuum": createHospitalSectionRenderer("medical-air-vacuum"),
  "zone-valves-alarms": createHospitalSectionRenderer("zone-valves-alarms"),
  "critical-power": createHospitalSectionRenderer("critical-power"),
  "critical-water": createHospitalSectionRenderer("critical-water"),
  "utility-impact-analysis": createHospitalSectionRenderer("utility-impact-analysis"),
  "infection-safety-overview": createHospitalSectionRenderer("infection-safety-overview"),
  "isolation-room-readiness": createHospitalSectionRenderer("isolation-room-readiness"),
  "pressure-environment": createHospitalSectionRenderer("pressure-environment"),
  "cleaning-terminal-clean": createHospitalSectionRenderer("cleaning-terminal-clean"),
  "healthcare-waste": createHospitalSectionRenderer("healthcare-waste"),
  "security-overview": createHospitalSectionRenderer("security-overview"),
  "fire-life-safety": createHospitalSectionRenderer("fire-life-safety"),
  "emergency-command": createHospitalSectionRenderer("emergency-command"),
  "incident-management": createHospitalSectionRenderer("incident-management"),
  "logistics-command": createHospitalSectionRenderer("logistics-command"),
  "pharmacy-logistics": createHospitalSectionRenderer("pharmacy-logistics"),
  "blood-bank": createHospitalSectionRenderer("blood-bank"),
  "cssd-sterile-supply": createHospitalSectionRenderer("cssd-sterile-supply"),
  "linen-laundry": createHospitalSectionRenderer("linen-laundry"),
  "food-services": createHospitalSectionRenderer("food-services"),
  "specimen-transport": createHospitalSectionRenderer("specimen-transport"),
  "porter-agv": createHospitalSectionRenderer("porter-agv"),
  "intelligence-overview": createHospitalSectionRenderer("intelligence-overview"),
  "emergency-surge": createHospitalSectionRenderer("emergency-surge"),
  "mass-casualty": createHospitalSectionRenderer("mass-casualty"),
  "infectious-outbreak": createHospitalSectionRenderer("infectious-outbreak"),
  "utility-outage": createHospitalSectionRenderer("utility-outage"),
  "fire-evacuation": createHospitalSectionRenderer("fire-evacuation"),
  "predictive-maintenance": createHospitalSectionRenderer("predictive-maintenance"),
  "capacity-forecast": createHospitalSectionRenderer("capacity-forecast"),
  "human-governed-optimization": createHospitalSectionRenderer("human-governed-optimization"),
  "systems-overview": createHospitalSectionRenderer("systems-overview"),
  "integration-hub": createHospitalSectionRenderer("integration-hub"),
  "clinical-data-platform": createHospitalSectionRenderer("clinical-data-platform"),
  "edge-architecture": createHospitalSectionRenderer("edge-architecture"),
  "facility-ot": createHospitalSectionRenderer("facility-ot"),
  "medical-device-network": createHospitalSectionRenderer("medical-device-network"),
  "his-lis-ris-pacs": createHospitalSectionRenderer("his-lis-ris-pacs"),
  "network-wifi": createHospitalSectionRenderer("network-wifi"),
  "data-center": createHospitalSectionRenderer("data-center"),
  "bim-gis": createHospitalSectionRenderer("bim-gis"),
  "cybersecurity": createHospitalSectionRenderer("cybersecurity"),
  "privacy-access": createHospitalSectionRenderer("privacy-access"),
  "data-quality": createHospitalSectionRenderer("data-quality"),
  "iot-devices": createHospitalSectionRenderer("iot-devices"),
  "downtime-recovery": createHospitalSectionRenderer("downtime-recovery"),
};

