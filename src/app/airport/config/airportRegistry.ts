import type { LucideIcon } from "lucide-react";
import {
  Activity, AirVent, BarChart3, Boxes, BrainCircuit, Building2, Camera, CircleGauge,
  Database, Droplets, ArrowUpDown, Fan, Flame, Gauge, HardHat, LayoutDashboard,
  Lightbulb, LockKeyhole, Map, MapPin, MonitorCog, Network, ParkingCircle, Radar,
  ShieldCheck, Snowflake, Sparkles, Users, Wrench, Zap, Leaf, Truck, Waves,
  FileCheck2, Route, Workflow, Cpu, Cable, Wind, GitBranch, Siren, Server,
  ScanLine, Layers3, Satellite, ClipboardList, Clock3,
} from "lucide-react";

export type AirportModuleId =
  | "OVERVIEW"
  | "SPATIAL"
  | "PATIENT_FLOW"
  | "CLINICAL"
  | "EXPERIENCE"
  | "ASSETS_FM"
  | "BMS"
  | "CRITICAL_UTILITIES"
  | "ENERGY"
  | "SAFETY"
  | "LOGISTICS"
  | "INTELLIGENCE"
  | "SYSTEMS";

export type AirportStatus = "normal" | "optimized" | "warning" | "critical" | "offline";

export interface AirportSectionDefinition {
  id: string;
  label: string;
  description: string;
  icon?: LucideIcon;
}

export interface AirportModuleDefinition {
  id: AirportModuleId;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  accent: string;
  defaultSection: string;
  sections: AirportSectionDefinition[];
}

export const AIRPORT_MODULES: AirportModuleDefinition[] = [
  {
    id: "OVERVIEW", label: "Hospital Command Center", shortLabel: "Overview", icon: LayoutDashboard,
    accent: "cyan", defaultSection: "command-center",
    sections: [
      { id: "command-center", label: "Hospital Command Center", description: "Live operating picture across clinical capacity, patient flow, critical utilities, safety and facility operations", icon: CircleGauge },
      { id: "spatial-hierarchy", label: "Hospital Spatial Hierarchy", description: "Campus, building, floor, department, clinical zone, room, bed, system and asset context", icon: Map },
      { id: "operational-readiness", label: "Operational Readiness", description: "Hospital-wide readiness, constraints, continuity and incident posture", icon: Activity },
      { id: "digital-twin-maturity", label: "Digital Twin Maturity", description: "Roadmap from spatial visualization to connected monitoring, simulation and human-governed optimization", icon: Sparkles },
    ],
  },
  {
    id: "SPATIAL", label: "BIM & Clinical Space Twin", shortLabel: "BIM & Space", icon: Layers3,
    accent: "cyan", defaultSection: "spatial-command",
    sections: [
      { id: "spatial-command", label: "Clinical Spatial Command", description: "Unified BIM and spatial operating picture across campus, buildings, floors, departments, rooms and beds", icon: Satellite },
      { id: "campus-building-map", label: "Campus & Building Map", description: "Hospital campus, towers, support buildings, entrances, ambulance routes and external access", icon: Map },
      { id: "floor-department-explorer", label: "Floor & Department Explorer", description: "Navigate floors, clinical departments, rooms, functional zones and operational status", icon: Building2 },
      { id: "clinical-room-classification", label: "Clinical Room Classification", description: "Operating rooms, ICU, isolation, clean rooms, laboratories, imaging and support-space requirements", icon: FileCheck2 },
      { id: "bed-bay-mapping", label: "Bed & Bay Mapping", description: "Spatially map inpatient beds, emergency bays, ICU beds, recovery bays and readiness state", icon: MapPin },
      { id: "clean-dirty-flow", label: "Clean / Dirty Flow", description: "Patient, staff, sterile material, waste, linen and specimen routes with separation controls", icon: Route },
      { id: "restricted-sterile-zones", label: "Restricted & Sterile Zones", description: "Access rules for operating theatres, pharmacy, CSSD, laboratories and critical clinical areas", icon: LockKeyhole },
      { id: "fire-compartment-evacuation", label: "Fire Compartments & Evacuation", description: "Compartment boundaries, refuge areas, horizontal evacuation and assisted-patient routes", icon: Flame },
      { id: "bim-federation", label: "BIM Federation & Digital Thread", description: "IFC/Revit federation linked to rooms, medical assets, sensors, alarms, work orders and documents", icon: Boxes },
      { id: "spatial-data-cde", label: "Spatial Data & CDE", description: "Model versioning, room data sheets, O&M documents, approvals, issue tracking and common identifiers", icon: ClipboardList },
    ],
  },
  {
    id: "PATIENT_FLOW", label: "Patient Flow & Capacity", shortLabel: "Patient Flow", icon: Activity,
    accent: "blue", defaultSection: "flow-command",
    sections: [
      { id: "flow-command", label: "Patient Flow Command Center", description: "Hospital-wide arrivals, transfers, bed demand, discharge and bottleneck overview", icon: Radar },
      { id: "emergency-operations", label: "Emergency Department", description: "Triage, door-to-doctor, admission holds, resuscitation bays and ambulance arrivals", icon: Siren },
      { id: "bed-management", label: "Bed Management", description: "Available, occupied, cleaning, blocked, isolation and discharge-pending beds", icon: Building2 },
      { id: "icu-operations", label: "ICU Operations", description: "ICU capacity, ventilators, isolation readiness, staffing and transfer planning", icon: Activity },
      { id: "operating-theatre", label: "Operating Theatre", description: "OR schedule, case progress, delays, turnover, PACU capacity and sterile instrument readiness", icon: Clock3 },
      { id: "outpatient-operations", label: "Outpatient Operations", description: "Appointments, check-in, queues, consultation rooms and waiting-time performance", icon: Users },
      { id: "diagnostics-capacity", label: "Diagnostics Capacity", description: "CT, MRI, X-ray, ultrasound, laboratory demand, queues and turnaround time", icon: ScanLine },
      { id: "admission-transfer-discharge", label: "Admission, Transfer & Discharge", description: "ADT workflow, transfer requests, expected discharge and bed turnaround coordination", icon: GitBranch },
      { id: "staffing-capacity", label: "Staffing & Capacity", description: "Operational staffing, skill coverage, workload and escalation by department", icon: Users },
    ],
  },
  {
    id: "CLINICAL", label: "Clinical Operations Integration", shortLabel: "Clinical Ops", icon: MonitorCog,
    accent: "violet", defaultSection: "clinical-systems-overview",
    sections: [
      { id: "clinical-systems-overview", label: "Clinical Systems Overview", description: "Operational status of HIS, EMR, LIS, RIS/PACS, pharmacy, nurse call and clinical device integration", icon: CircleGauge },
      { id: "his-emr-health", label: "HIS / EMR Service Health", description: "ADT, orders, documentation, scheduling, interface queues and downtime readiness", icon: Database },
      { id: "laboratory-operations", label: "Laboratory Operations", description: "Order volume, specimen flow, analyzer status, critical results and turnaround time", icon: Activity },
      { id: "ris-pacs-imaging", label: "RIS / PACS & Imaging", description: "Modality worklists, study throughput, PACS availability, reporting queues and image transfer", icon: ScanLine },
      { id: "pharmacy-medication", label: "Pharmacy & Medication Workflow", description: "Medication orders, verification, dispensing queues, cold chain and delivery status", icon: Boxes },
      { id: "nurse-call", label: "Nurse Call & Clinical Communications", description: "Calls, escalation, response time, staff presence and communication-system health", icon: Activity },
      { id: "critical-results", label: "Critical Result Workflow", description: "Critical laboratory and imaging result acknowledgement, escalation and audit trail", icon: ShieldCheck },
      { id: "clinical-device-connectivity", label: "Clinical Device Connectivity", description: "Connectivity and data quality for monitors, ventilators, pumps and selected clinical systems", icon: Cpu },
    ],
  },
  {
    id: "EXPERIENCE", label: "Patient & Visitor Experience", shortLabel: "Experience", icon: Users,
    accent: "cyan", defaultSection: "experience-overview",
    sections: [
      { id: "experience-overview", label: "Experience Overview", description: "End-to-end patient and visitor journey, waiting, access, navigation and service quality", icon: Sparkles },
      { id: "appointments-checkin", label: "Appointments & Check-in", description: "Digital appointments, pre-registration, kiosk, identity verification and arrival management", icon: FileCheck2 },
      { id: "queue-management", label: "Queue Management", description: "Real-time queues, predicted waits, virtual tickets and demand balancing", icon: Clock3 },
      { id: "indoor-wayfinding", label: "Indoor Wayfinding", description: "Accessible 2D/3D navigation with restricted, isolation and clean-flow avoidance", icon: Route },
      { id: "visitor-management", label: "Visitor Management", description: "Registration, QR credentials, visiting hours, restricted areas and visitor notifications", icon: Users },
      { id: "patient-transport", label: "Patient Transport", description: "Porter requests, wheelchair and stretcher transport, priority and SLA tracking", icon: Truck },
      { id: "parking-access", label: "Parking & Arrival Access", description: "Parking occupancy, accessible spaces, drop-off, ambulance routes and traffic guidance", icon: ParkingCircle },
      { id: "feedback-service-quality", label: "Feedback & Service Quality", description: "Patient feedback, complaints, service recovery, SLA and improvement actions", icon: BarChart3 },
    ],
  },
  {
    id: "ASSETS_FM", label: "Medical Equipment & Asset Lifecycle", shortLabel: "Medical Assets", icon: Wrench,
    accent: "emerald", defaultSection: "fm-overview",
    sections: [
      { id: "fm-overview", label: "Medical Asset Command", description: "Medical equipment availability, condition, maintenance, calibration and service impact", icon: CircleGauge },
      { id: "bim-explorer", label: "Hospital BIM Explorer", description: "Federated model, room context, MEP systems, equipment positions and digital thread", icon: Boxes },
      { id: "asset-registry", label: "Medical Asset Registry", description: "Master data for clinical equipment and facility assets linked to location and criticality", icon: Database },
      { id: "equipment-location-rtls", label: "Equipment Location & RTLS", description: "Live or last-known location, availability, geofence and utilization of mobile equipment", icon: MapPin },
      { id: "equipment-availability", label: "Equipment Availability", description: "Ready, in-use, cleaning, maintenance, quarantine and unavailable equipment", icon: Activity },
      { id: "maintenance-plans", label: "Maintenance Plans", description: "Preventive, predictive, condition-based, statutory and manufacturer plans", icon: Wrench },
      { id: "work-orders", label: "Work Orders", description: "Request, triage, dispatch, field execution, SLA, downtime, parts and root cause", icon: HardHat },
      { id: "calibration-compliance", label: "Calibration & Compliance", description: "Calibration due dates, certificates, inspection evidence and compliance exceptions", icon: ShieldCheck },
      { id: "recall-field-notice", label: "Recall & Field Safety Notice", description: "Affected equipment, quarantine, corrective action and completion evidence", icon: Siren },
      { id: "warranty-contracts", label: "Warranty & Service Contracts", description: "Coverage, expiry, vendor SLA, cost, uptime and service performance", icon: FileCheck2 },
    ],
  },
  {
    id: "BMS", label: "Facility Operations & EBO", shortLabel: "Facility Ops", icon: MonitorCog,
    accent: "cyan", defaultSection: "facility-ops-overview",
    sections: [
      { id: "facility-ops-overview", label: "Facility Operations Overview", description: "Hospital-wide operating posture across integrated EBO facility systems", icon: CircleGauge },
      { id: "ebo-command", label: "EBO Command Center", description: "Integrated EBO tree, monitoring, commands, alarms, historian and audit trail", icon: MonitorCog },
      { id: "bms-hvac", label: "BMS / HVAC", description: "Chiller, AHU, FCU, VAV, heat exchanger and CRAH operation", icon: Fan },
      { id: "bms-chiller-plant", label: "Chiller Plant", description: "Central cooling plant, schematic, 3D model and controls", icon: Snowflake },
      { id: "bms-floor-plan", label: "HVAC Floor Plan", description: "2D and 3D hospital HVAC context and asset positions", icon: Map },
      { id: "energy-power", label: "Energy & Power", description: "Power monitoring, single-line diagram, UPS, generators and essential distribution", icon: Zap },
      { id: "clinical-environment", label: "Clinical Environment", description: "Operating theatre, ICU, isolation, pharmacy and laboratory environmental compliance", icon: AirVent },
      { id: "cctv-vms-ebo", label: "CCTV / VMS", description: "Camera wall, video analytics, events and recording health", icon: Camera },
      { id: "access-control-ebo", label: "Access Control", description: "Doors, readers, credentials and restricted clinical-zone access", icon: LockKeyhole },
      { id: "smart-parking-ebo", label: "Smart Parking", description: "Parking occupancy, guidance, entry-exit, accessible spaces and EV charging", icon: ParkingCircle },
      { id: "fire-life-safety-ebo", label: "Fire & Life Safety", description: "Fire panels, detectors, suppression, compartments and evacuation readiness", icon: Flame },
      { id: "water-utilities-ebo", label: "Water & Utilities", description: "Water supply, pumps, wastewater and quality monitoring", icon: Droplets },
      { id: "lighting-ebo", label: "Lighting", description: "Public, clinical-support and facility lighting control and schedules", icon: Lightbulb },
      { id: "vertical-transport-ebo", label: "Vertical Transport", description: "Patient, staff, service and fire-fighting elevators with traffic and maintenance status", icon: ArrowUpDown },
      { id: "ebo-alarms-events", label: "Alarms & Events", description: "Cross-domain EBO alarm queue, ownership, escalation and response", icon: Activity },
      { id: "ebo-trends-reports", label: "Trends & Reports", description: "Historian, performance trends, SLA, compliance and automated reporting", icon: BarChart3 },
    ],
  },
  {
    id: "CRITICAL_UTILITIES", label: "Critical Utilities & Medical Gases", shortLabel: "Critical Utilities", icon: Droplets,
    accent: "amber", defaultSection: "critical-utilities-overview",
    sections: [
      { id: "critical-utilities-overview", label: "Critical Utilities Command", description: "Life-safety utility availability, redundancy, reserve and clinical impact", icon: CircleGauge },
      { id: "medical-gas-overview", label: "Medical Gas Overview", description: "Oxygen, medical air, vacuum, nitrous oxide, CO₂ and AGSS supply status", icon: Gauge },
      { id: "oxygen-supply", label: "Oxygen Supply & Reserve", description: "Tank level, manifold, pressure, consumption, reserve hours and escalation", icon: Activity },
      { id: "medical-air-vacuum", label: "Medical Air & Vacuum", description: "Compressor, dryer, receiver, vacuum pumps, dew point, pressure and redundancy", icon: AirVent },
      { id: "zone-valves-alarms", label: "Zone Valves & Area Alarms", description: "Zone valve boxes, master alarms, area alarms, isolation readiness and audit", icon: ShieldCheck },
      { id: "critical-power", label: "Critical Power Continuity", description: "Grid, essential distribution, UPS, generators, ATS, fuel and load-shedding readiness", icon: Zap },
      { id: "critical-water", label: "Critical Water & RO", description: "Domestic, hot, RO, dialysis and sterilization water availability and quality", icon: Droplets },
      { id: "utility-impact-analysis", label: "Clinical Impact Analysis", description: "Map utility failure to departments, rooms, beds, procedures and contingency actions", icon: GitBranch },
    ],
  },
  {
    id: "ENERGY", label: "Energy, Utilities & ESG — YooEnergy", shortLabel: "YooEnergy", icon: Gauge,
    accent: "cyan", defaultSection: "energy-command",
    sections: [
      { id: "energy-command", label: "Energy Command Center", description: "Hospital-wide electricity, water, thermal, fuel gas, budget, emissions and operational posture", icon: CircleGauge },
      { id: "electricity", label: "Electricity", description: "Demand, energy, peak, power factor, harmonics, tariff and carbon performance", icon: Zap },
      { id: "water-utilities", label: "Water Utilities", description: "Cold water, hot water, RO water, flow, pressure, balance, leakage and cost", icon: Droplets },
      { id: "thermal-btu", label: "Thermal & BTU", description: "Chilled water, supply-return temperature, ΔT, cooling allocation and plant performance", icon: Snowflake },
      { id: "gas", label: "Fuel Gas", description: "Fuel gas flow, pressure, consumption, leak status and cost allocation", icon: Flame },
      { id: "meter-management", label: "Meter Management", description: "Meter registry, hierarchy, protocol, gateway, mapping, data quality and diagnostics", icon: Gauge },
      { id: "tenant-billing", label: "Cost Allocation & Billing", description: "Cost-center allocation, outsourced services, tariff versions, validation, approval and statements", icon: FileCheck2 },
      { id: "budgets-alerts", label: "Budget & Alerts", description: "Self-service budgets, thresholds, notification channels and escalation workflows", icon: Activity },
      { id: "ai-analytics", label: "AI Analytics", description: "Forecasting, anomaly detection, leakage, low ΔT, peak demand and explainable recommendations", icon: BrainCircuit },
      { id: "reports", label: "Reports", description: "Scheduled and on-demand energy, power quality, water, thermal, cost and ESG reports", icon: BarChart3 },
      { id: "gateway-management", label: "Gateway Management", description: "MQTT, HTTP, Modbus, BACnet/IP, M-Bus, OPC UA and edge health", icon: Cpu },
      { id: "ebo-digital-twin-integration", label: "EBO & Digital Twin Integration", description: "Bidirectional EBO, SCADA, ERP, data lake and Hospital Digital Twin integration", icon: GitBranch },
    ],
  },
  {
    id: "SAFETY", label: "Infection Prevention, Safety & Emergency", shortLabel: "Safety & IPC", icon: ShieldCheck,
    accent: "amber", defaultSection: "infection-safety-overview",
    sections: [
      { id: "infection-safety-overview", label: "Integrated Safety Overview", description: "Infection prevention, life safety, security, waste and emergency-response posture", icon: ShieldCheck },
      { id: "isolation-room-readiness", label: "Isolation Room Readiness", description: "Availability, pressure, door status, environmental compliance and cleaning state", icon: AirVent },
      { id: "pressure-environment", label: "Pressure & Environmental Compliance", description: "Positive/negative pressure, temperature, humidity, HEPA differential pressure and excursions", icon: Gauge },
      { id: "cleaning-terminal-clean", label: "Cleaning & Terminal Clean", description: "Room cleaning queues, terminal clean, verification and bed-release readiness", icon: Sparkles },
      { id: "healthcare-waste", label: "Healthcare Waste Traceability", description: "Infectious, sharps, pharmaceutical, cytotoxic, chemical and radioactive waste chain", icon: Boxes },
      { id: "security-overview", label: "Healthcare Security", description: "CCTV, access, infant protection, patient wandering, staff duress and restricted zones", icon: Camera },
      { id: "fire-life-safety", label: "Fire & Life Safety", description: "Detection, suppression, compartments, horizontal evacuation and assisted-patient readiness", icon: Flame },
      { id: "emergency-command", label: "Emergency Command", description: "Code response, mass casualty, outbreak, utility failure, cyber incident and evacuation", icon: Siren },
      { id: "incident-management", label: "Incident Management", description: "Ownership, clinical impact, field response, evidence, lessons learned and closure", icon: Activity },
    ],
  },
  {
    id: "LOGISTICS", label: "Hospital Logistics & Support Services", shortLabel: "Logistics", icon: Truck,
    accent: "blue", defaultSection: "logistics-command",
    sections: [
      { id: "logistics-command", label: "Logistics Command Center", description: "Hospital-wide material, specimen, linen, food, waste and transport workflow", icon: Radar },
      { id: "pharmacy-logistics", label: "Pharmacy Logistics", description: "Inventory, expiry, cold chain, replenishment, dispensing delivery and controlled storage", icon: Boxes },
      { id: "blood-bank", label: "Blood Bank & Cold Chain", description: "Blood-group inventory, requests, expiry, storage temperature and delivery chain", icon: Activity },
      { id: "cssd-sterile-supply", label: "CSSD & Sterile Supply", description: "Dirty receiving, washing, packing, sterilization, sterile storage and tray availability", icon: Workflow },
      { id: "linen-laundry", label: "Linen & Laundry", description: "Clean and soiled linen inventory, collection, processing, delivery and route separation", icon: Boxes },
      { id: "food-services", label: "Food & Nutrition Services", description: "Meal orders, production, allergen controls, delivery rounds and temperature compliance", icon: ClipboardList },
      { id: "specimen-transport", label: "Specimen & Pneumatic Tube", description: "Specimen pickup, chain of custody, pneumatic tube health and turnaround time", icon: Route },
      { id: "porter-agv", label: "Porter, AGV & Internal Transport", description: "Patient, material and waste transport tasks, prioritization, routes and SLA", icon: Truck },
    ],
  },
  {
    id: "INTELLIGENCE", label: "AI, Simulation & Optimization", shortLabel: "AI & Simulation", icon: BrainCircuit,
    accent: "violet", defaultSection: "intelligence-overview",
    sections: [
      { id: "intelligence-overview", label: "Intelligence Overview", description: "AI insights, scenario readiness, confidence and quantified operational value", icon: BrainCircuit },
      { id: "emergency-surge", label: "Emergency Surge What-if", description: "Simulate arrivals, triage mix, staffing, bays, imaging and inpatient-bed constraints", icon: Siren },
      { id: "mass-casualty", label: "Mass Casualty Simulation", description: "Model ED, OR, ICU, blood, staff and temporary-treatment capacity", icon: Users },
      { id: "infectious-outbreak", label: "Infectious Outbreak Simulation", description: "Isolation, cohorting, clean/dirty routes, PPE and environmental capacity", icon: ShieldCheck },
      { id: "utility-outage", label: "Critical Utility Outage", description: "Power, oxygen, water and HVAC failure impact with contingency options", icon: GitBranch },
      { id: "fire-evacuation", label: "Fire, Smoke & Evacuation", description: "Smoke movement, compartments, horizontal evacuation, assisted patients and safe destinations", icon: Flame },
      { id: "predictive-maintenance", label: "Predictive Maintenance", description: "Failure probability, remaining useful life and proactive work for critical assets", icon: Wrench },
      { id: "capacity-forecast", label: "Capacity Forecast", description: "Forecast ED arrivals, beds, ICU, OR, diagnostics, oxygen and staffing demand", icon: BarChart3 },
      { id: "human-governed-optimization", label: "Human-governed Optimization", description: "Approval-based recommendations, audit, override, rollback and safety guardrails", icon: Workflow },
    ],
  },
  {
    id: "SYSTEMS", label: "Systems, Data, Integration & Cybersecurity", shortLabel: "Systems & Data", icon: Database,
    accent: "cyan", defaultSection: "systems-overview",
    sections: [
      { id: "systems-overview", label: "Systems Overview", description: "Clinical, enterprise, OT, medical-device, spatial and security service health", icon: CircleGauge },
      { id: "integration-hub", label: "Healthcare Integration Hub", description: "HL7, FHIR, DICOMweb, APIs, event bus, device feeds and master data", icon: Boxes },
      { id: "clinical-data-platform", label: "Clinical & Operational Data Platform", description: "Governed data products across clinical operations, assets, space, energy and safety", icon: Database },
      { id: "edge-architecture", label: "Edge & Data Architecture", description: "Medical devices, IoT, OT gateways, resilient network and application layers", icon: Cpu },
      { id: "facility-ot", label: "Facility OT & SCADA", description: "BMS, EBO, power, water, medical gas, lighting, pumps and utility automation", icon: MonitorCog },
      { id: "medical-device-network", label: "Medical Device Network", description: "Connected device inventory, segmentation, certificates, vulnerability and availability", icon: Network },
      { id: "his-lis-ris-pacs", label: "HIS, LIS, RIS & PACS", description: "Application availability, interfaces, queues, storage, recovery and downtime readiness", icon: Server },
      { id: "network-wifi", label: "Network, Wi-Fi & Private 5G", description: "Coverage, capacity, latency, roaming, segmentation and resilience", icon: Network },
      { id: "data-center", label: "Data Center / Edge", description: "Compute, storage, network, UPS, environmental health and recovery readiness", icon: Server },
      { id: "bim-gis", label: "BIM & Spatial Platform", description: "Campus, building, floor, room, bed, asset and digital-thread context", icon: MapPin },
      { id: "cybersecurity", label: "Healthcare OT/IT Cybersecurity", description: "Segmentation, identities, threats, vulnerabilities, medical-device risk and response", icon: ShieldCheck },
      { id: "privacy-access", label: "Privacy & Access Governance", description: "Minimum necessary access, masking, break-glass, audit and data-retention controls", icon: LockKeyhole },
      { id: "data-quality", label: "Data Quality & Governance", description: "Completeness, freshness, accuracy, lineage, semantic mapping and stewardship", icon: BarChart3 },
      { id: "iot-devices", label: "IoT & Edge Devices", description: "Sensors, gateways, firmware, calibration, connectivity and lifecycle", icon: Activity },
      { id: "downtime-recovery", label: "Downtime & Disaster Recovery", description: "Clinical downtime procedures, backup, recovery objectives, failover and exercises", icon: Workflow },
    ],
  },
];

export const AIRPORT_SECTION_REGISTRY = Object.fromEntries(
  AIRPORT_MODULES.flatMap((module) => module.sections.map((section) => [section.id, { ...section, moduleId: module.id }])),
);

export interface SpatialNode { id: string; label: string; type: string; children?: SpatialNode[] }
const child = (id: string, label: string, type = "Clinical Zone"): SpatialNode => ({ id, label, type });

export const AIRPORT_SPATIAL_HIERARCHY: SpatialNode[] = [
  { id: "acute-care", label: "Acute & Critical Care", type: "Clinical Domain", children: [
    child("emergency", "Emergency Department"), child("icu", "Intensive Care Unit"), child("operating-theatre", "Operating Theatre"), child("pacu", "Post Anaesthesia Care Unit"),
  ] },
  { id: "inpatient", label: "Inpatient Services", type: "Clinical Domain", children: [
    child("medical-wards", "Medical Wards"), child("surgical-wards", "Surgical Wards"), child("isolation-ward", "Isolation Ward"), child("maternity-pediatrics", "Maternity & Paediatrics"),
  ] },
  { id: "diagnostics-treatment", label: "Diagnostics & Treatment", type: "Clinical Domain", children: [
    child("imaging", "Imaging Department"), child("laboratory", "Laboratory"), child("dialysis", "Dialysis"), child("outpatient", "Outpatient Clinics"),
  ] },
  { id: "clinical-support", label: "Clinical Support Services", type: "Support Domain", children: [
    child("pharmacy", "Pharmacy"), child("blood-bank", "Blood Bank"), child("cssd", "CSSD"), child("rehabilitation", "Rehabilitation"),
  ] },
  { id: "facility-infrastructure", label: "Facility & Critical Infrastructure", type: "Infrastructure Domain", children: [
    child("central-utility", "Central Utility Plant", "Facility"), child("oxygen-plant", "Medical Gas Plant", "Facility"), child("electrical-plant", "Essential Power Plant", "Facility"), child("data-center", "Data Center", "Facility"),
  ] },
  { id: "public-support", label: "Public & Support Areas", type: "Hospital Area", children: [
    child("main-lobby", "Main Lobby", "Public Area"), child("visitor-parking", "Visitor Parking", "Public Area"), child("ambulance-bay", "Ambulance Bay", "Emergency Access"), child("logistics-dock", "Logistics Dock", "Service Area"),
  ] },
];

export interface AirportHotspotDefinition {
  id: string; label: string; type: string; x: number; y: number; status: AirportStatus;
  severity: "info" | "low" | "medium" | "high" | "critical"; module: AirportModuleId;
  kpis: Array<{ label: string; value: string }>;
}

export const AIRPORT_HOTSPOTS: AirportHotspotDefinition[] = [
  { id: "emergency", label: "Emergency Department", type: "Acute Care", x: 42, y: 76, status: "warning", severity: "high", module: "PATIENT_FLOW", kpis: [{ label: "Waiting", value: "31" }, { label: "Door-to-doctor", value: "28 min" }] },
  { id: "icu", label: "Intensive Care Unit", type: "Critical Care", x: 58, y: 48, status: "warning", severity: "medium", module: "PATIENT_FLOW", kpis: [{ label: "Occupancy", value: "86%" }, { label: "Ventilators ready", value: "14" }] },
  { id: "or", label: "Operating Theatre", type: "Restricted Clinical Zone", x: 52, y: 38, status: "normal", severity: "low", module: "PATIENT_FLOW", kpis: [{ label: "Rooms active", value: "8 / 10" }, { label: "Next case", value: "10:20" }] },
  { id: "isolation", label: "Isolation Ward", type: "Infection Control Zone", x: 72, y: 36, status: "warning", severity: "high", module: "SAFETY", kpis: [{ label: "Rooms ready", value: "16 / 18" }, { label: "Pressure alerts", value: "1" }] },
  { id: "imaging", label: "Diagnostic Imaging", type: "Clinical Service", x: 35, y: 47, status: "optimized", severity: "info", module: "CLINICAL", kpis: [{ label: "CT queue", value: "6" }, { label: "PACS", value: "Online" }] },
  { id: "laboratory", label: "Central Laboratory", type: "Clinical Service", x: 65, y: 58, status: "normal", severity: "low", module: "CLINICAL", kpis: [{ label: "TAT compliance", value: "94.8%" }, { label: "Analyzers", value: "12 / 12" }] },
  { id: "pharmacy", label: "Central Pharmacy", type: "Clinical Support", x: 30, y: 60, status: "normal", severity: "low", module: "LOGISTICS", kpis: [{ label: "Orders pending", value: "46" }, { label: "Cold chain", value: "Compliant" }] },
  { id: "cssd", label: "CSSD", type: "Sterile Supply", x: 74, y: 68, status: "warning", severity: "medium", module: "LOGISTICS", kpis: [{ label: "Trays ready", value: "118" }, { label: "Sterilizers", value: "3 / 4" }] },
  { id: "oxygen", label: "Medical Gas Plant", type: "Critical Utility", x: 18, y: 52, status: "warning", severity: "high", module: "CRITICAL_UTILITIES", kpis: [{ label: "Oxygen reserve", value: "37 h" }, { label: "Pressure", value: "4.2 bar" }] },
  { id: "utility", label: "Central Utility Plant", type: "Facility OT", x: 22, y: 70, status: "normal", severity: "low", module: "BMS", kpis: [{ label: "Cooling load", value: "78%" }, { label: "Systems online", value: "99.2%" }] },
  { id: "datacenter", label: "Hospital Data Center", type: "IT Facility", x: 84, y: 49, status: "normal", severity: "low", module: "SYSTEMS", kpis: [{ label: "Availability", value: "99.98%" }, { label: "PUE", value: "1.46" }] },
  { id: "main-lobby", label: "Main Lobby & Outpatient Arrival", type: "Public Area", x: 49, y: 88, status: "warning", severity: "medium", module: "EXPERIENCE", kpis: [{ label: "Check-in queue", value: "42" }, { label: "Predicted wait", value: "16 min" }] },
  { id: "medical-assets", label: "Mobile Medical Equipment", type: "RTLS Domain", x: 80, y: 78, status: "optimized", severity: "info", module: "ASSETS_FM", kpis: [{ label: "Located", value: "96.7%" }, { label: "Available pumps", value: "84" }] },
  { id: "energy", label: "Hospital Energy & Utilities", type: "ESG Domain", x: 14, y: 31, status: "optimized", severity: "info", module: "ENERGY", kpis: [{ label: "Demand", value: "5.84 MW" }, { label: "Today vs baseline", value: "-4.8%" }] },
  { id: "bim", label: "BIM & Clinical Space Federation", type: "Digital Thread", x: 57, y: 25, status: "optimized", severity: "info", module: "SPATIAL", kpis: [{ label: "Rooms mapped", value: "1,248" }, { label: "Asset mapping", value: "94.9%" }] },
];

export const AIRPORT_LAYERS = [
  "Hospital Campus & Buildings", "Floors & Departments", "Rooms, Beds & Bays", "BIM & Digital Thread",
  "Patient Flow & Capacity", "Medical Equipment & RTLS", "Critical Power", "Medical Gases", "Water & RO",
  "HVAC & Clinical Environment", "Infection Control", "Fire & Evacuation", "Security & Access",
  "Logistics & Support Services", "Energy & ESG", "Clinical Systems & Data",
];

export function getAirportModule(id: AirportModuleId) {
  return AIRPORT_MODULES.find((module) => module.id === id) ?? AIRPORT_MODULES[0];
}
