import React, { useMemo, useState } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import {
  Activity, AlertTriangle, Boxes, Building2, CheckCircle2, CircleGauge, Cpu,
  Database, Droplets, ExternalLink, Flame, GitBranch, HardHat, Map, MapPin,
  Network, Play, Route, ShieldCheck, Sparkles, Users, Workflow, Wrench, Zap,
  Wind, Waves, Gauge, Clock3, Siren, AirVent, ScanLine,
} from "lucide-react";
import { toast } from "sonner";
import type { AirportModuleId } from "../config/airportRegistry";
import { getAirportModule } from "../config/airportRegistry";
import {
  SYSTEM_CONNECTIONS, getAssetPage, getHospitalTrend, getPatientFlowPage,
  type AssetRow, type PageSize, type PatientFlowRow,
} from "../data/airportMockData";
import {
  AirportDataTable, AirportDetailDrawer, AirportFilterBar, AirportMetricCard,
  AirportPanel, AirportSectionHeader, AirportStatusBadge, AirportTimeline,
  AirportTrendChart, type AirportColumn,
} from "../shared/AirportUI";
import { useAirportLanguage } from "../i18n/AirportLanguage";
import { BimModelViewer } from "./BimModelViewer";
import { FacilityOperationsModule } from "./FacilityOperationsModule";
import { EnergyUtilityModule } from "./EnergyUtilityModule";
import { AIRPORT_3D_CONFIG } from "../overview/airport3DConfig";

type Tone = "cyan" | "blue" | "emerald" | "amber" | "red" | "violet";
type Metric = [string, string, string, Tone?];
type DomainProfile = {
  metrics: Metric[];
  entities: string[];
  capacities: Array<[string, number]>;
  events: string[][];
  layers: Array<[string, string, string]>;
  workflow: string[];
};

const DOMAIN_PROFILES: Record<Exclude<AirportModuleId, "OVERVIEW" | "BMS" | "ENERGY">, DomainProfile> = {
  SPATIAL: {
    metrics: [["Mapped rooms","1,248","98.6%","cyan"],["Mapped beds","506","97.3%","blue"],["BIM assets","28,640","94.9% linked","emerald"],["Clinical zones","186","Room data sheets","cyan"],["Open coordination issues","38","7 priority","amber"],["Model freshness","6 min","Federated","emerald"]],
    entities: ["Acute Care Tower · BIM federation current","Isolation Ward · pressure zones mapped","Operating Theatre · room data sheets complete","Medical Gas Network · 386 outlets linked","Fire Compartment L06 · evacuation route validated","CSSD · clean/dirty flow reviewed"],
    capacities: [["Room data completeness",96],["Bed mapping",97],["Medical assets",95],["MEP systems",93],["Documents",91],["Spatial accuracy",99]],
    events: [["10:42","BIM","Room classification updated","OR Suite","Normal"],["10:34","Digital Thread","Medical gas asset linked","ISO-12","Normal"],["10:20","CDE","Coordination issue assigned","L06","Warning"],["10:05","Model","Federation completed","Campus","Normal"]],
    layers: [["Campus & buildings","Towers, support blocks, ambulance access and public entrances","Current"],["Clinical spaces","Departments, rooms, beds, sterile and restricted zones","Current"],["Assets & systems","Medical equipment, MEP, medical gas, power and sensors","Connected"],["Digital thread","Alarm, clinical impact, work order, document and history","Connected"]],
    workflow: ["Select campus, building, floor or department","Open room classification and operational requirements","Inspect linked equipment, sensors and current alarms","Create coordination or maintenance issue with spatial evidence"],
  },
  PATIENT_FLOW: {
    metrics: [["Occupied beds","418","86.7%","blue"],["Beds available","34","12 isolation","emerald"],["ED waiting","31","4 high acuity","amber"],["Door-to-doctor","28 min","Target <30","cyan"],["ICU occupancy","86%","6 available","amber"],["Expected discharge","46","By 16:00","emerald"]],
    entities: ["Emergency Department · 31 waiting · surge watch","ICU · 6 beds available · ventilators ready","Ward 6B · 8 discharge pending","Operating Theatre · 8/10 rooms active","Imaging · CT queue 6 · MRI queue 4","Outpatient · predicted peak at 11:30"],
    capacities: [["Emergency bays",82],["ICU beds",86],["Inpatient beds",87],["Operating rooms",80],["PACU",73],["Diagnostics",68]],
    events: [["10:42","Emergency","High-acuity arrival accepted","Resus 02","Warning"],["10:36","Bed Management","Bed released after terminal clean","Ward 6B","Normal"],["10:28","Operating Theatre","Case transferred to PACU","OR-04","Normal"],["10:14","ICU","Transfer request prioritized","ICU-03","Warning"]],
    layers: [["Demand","Arrivals, appointments, transfers and forecast demand","Live"],["Capacity","Beds, bays, rooms, equipment and staffing","Live"],["Constraints","Cleaning, isolation, diagnostics, transport and discharge","Correlated"],["Decisions","Escalation, transfer, surge capacity and discharge actions","Human approved"]],
    workflow: ["Detect queue, occupancy or capacity constraint","Trace the bottleneck to bed, room, staff or support service","Compare current demand with near-term forecast","Assign a coordinated action and monitor outcome"],
  },
  CLINICAL: {
    metrics: [["Clinical systems","18 / 19","1 degraded","cyan"],["HIS / EMR","99.98%","38 ms","emerald"],["LIS TAT compliance","94.8%","+1.2 pt","blue"],["PACS availability","99.94%","Latency watch","amber"],["Critical results open","7","2 due","amber"],["Connected devices","2,846","97.9%","cyan"]],
    entities: ["HIS / EMR · ADT and order interfaces nominal","LIS · 12 analyzers online · 7 critical results","RIS / PACS · transfer latency under monitoring","Pharmacy · 46 orders pending verification","Nurse Call · median response 2.8 min","Clinical devices · 61 data quality flags"],
    capacities: [["HIS/EMR",99],["Laboratory",95],["Imaging",89],["Pharmacy",84],["Nurse call",96],["Device connectivity",98]],
    events: [["10:41","LIS","Critical result acknowledged","Lab-04","Normal"],["10:32","PACS","Transfer latency exceeded target","CT-02","Warning"],["10:18","Pharmacy","STAT order dispensed","ICU","Normal"],["10:04","Nurse Call","Escalation completed","Ward 5A","Normal"]],
    layers: [["Clinical applications","HIS, EMR, LIS, RIS, PACS, pharmacy and nurse call","Monitored"],["Interoperability","HL7, FHIR, DICOMweb, API and event queues","Validated"],["Clinical devices","Selected monitor, ventilator and pump connectivity","Observed"],["Downtime readiness","Fallback procedures, recovery priorities and communication","Governed"]],
    workflow: ["Monitor application and interface service health","Correlate degraded service with affected clinical workflow","Notify the clinical and technical owner","Activate downtime or recovery procedure when required"],
  },
  EXPERIENCE: {
    metrics: [["Appointments today","1,284","92% confirmed","cyan"],["Checked in","842","65.6%","blue"],["Average wait","16 min","-3 min","emerald"],["Visitors onsite","386","Within policy","cyan"],["Wayfinding requests","2,418","96% completed","blue"],["Satisfaction","4.62 / 5","+0.08","emerald"]],
    entities: ["Main Lobby · 42 people in check-in queue","Outpatient Level 2 · predicted wait 18 min","Imaging · accessible route available","Visitor Desk · 38 active QR passes","Parking A · 84% occupied","Patient Transport · 12 active tasks"],
    capacities: [["Check-in kiosks",72],["Registration desks",81],["Waiting areas",74],["Accessible routes",96],["Visitor desk",58],["Parking",84]],
    events: [["10:39","Check-in","Queue dynamically rebalanced","Lobby","Normal"],["10:31","Wayfinding","Isolation route avoidance enabled","L06","Info"],["10:22","Visitor","Restricted-zone credential denied","ICU","Warning"],["10:08","Transport","Priority wheelchair task accepted","Imaging","Normal"]],
    layers: [["Before arrival","Appointment, pre-registration, preparation and parking","Digital"],["Arrival","Identity, check-in, queue and navigation","Orchestrated"],["During visit","Waiting, notifications, accessibility and support","Responsive"],["After visit","Feedback, service recovery and follow-up","Measured"]],
    workflow: ["Capture appointment or walk-in arrival","Guide the patient to the correct service and route","Update expected wait and notify changes","Collect feedback and trigger service recovery when needed"],
  },
  ASSETS_FM: {
    metrics: [["Medical assets","8,420","Hospital-wide","cyan"],["Available equipment","92.8%","+0.6 pt","emerald"],["RTLS located","96.7%","Last 5 min","blue"],["PM compliance","95.4%","Target 96%","amber"],["Calibration due","38","7 overdue","amber"],["Critical downtime","4.2 h","This month","emerald"]],
    entities: ["Ventilator Fleet · 42 ready · 6 in use","Infusion Pumps · 84 available · 12 cleaning","Anaesthesia Workstations · 10/10 serviceable","CT-02 · planned maintenance tonight","Defibrillator AED-018 · battery replacement due","AHU-OR-03 · condition monitoring active"],
    capacities: [["Critical care equipment",91],["Infusion devices",76],["Imaging",82],["Operating theatre",88],["Mobile diagnostics",69],["Facility critical assets",93]],
    events: [["10:38","RTLS","Infusion pump located","Ward 6B","Normal"],["10:29","Calibration","Certificate approved","Ventilator 018","Normal"],["10:16","Work Order","Priority repair dispatched","AED-018","Warning"],["09:58","Recall","Affected serials reconciled","Closed","Normal"]],
    layers: [["Asset master","Identity, model, serial, ownership and criticality","Governed"],["Location & state","Room, RTLS, availability, cleaning and quarantine","Live"],["Maintenance","PM, condition, calibration, repair and parts","Managed"],["Digital thread","Clinical impact, alarm, work order, evidence and history","Traceable"]],
    workflow: ["Locate equipment and verify readiness state","Review condition, maintenance and calibration history","Assess clinical-service impact of downtime","Create and track work order through return to service"],
  },
  CRITICAL_UTILITIES: {
    metrics: [["Oxygen reserve","37 h","Target >48","amber"],["Main line pressure","4.2 bar","Stable","emerald"],["Medical air","7.4 bar","N+1 ready","cyan"],["Vacuum","-62 kPa","N+1 ready","cyan"],["Essential power","99.999%","2N path","emerald"],["UPS autonomy","84 min","At current load","blue"]],
    entities: ["LOX Tank 01 · 68% · estimated 37 hours","Oxygen Manifold B · standby and tested","Medical Air Plant · 3/3 compressors available","Vacuum Plant · 3/4 pumps running","Generator G02 · auto standby · fuel 62 h","RO Plant · quality compliant · N+1 pump"],
    capacities: [["Oxygen reserve",68],["Medical air",62],["Vacuum",74],["Essential power",58],["UPS",72],["Critical water",64]],
    events: [["10:24","Medical Gas","Oxygen reserve below target","Plant","Warning"],["10:17","Area Alarm","Pressure self-test passed","ICU","Normal"],["10:08","Generator","Weekly auto-test completed","G02","Normal"],["09:52","RO Water","Conductivity validated","Dialysis","Normal"]],
    layers: [["Source","Tank, manifold, compressor, vacuum, generator, UPS and water plant","Redundant"],["Distribution","Pipelines, feeders, valves, panels and isolation points","Mapped"],["Clinical endpoints","Departments, rooms, beds, outlets and essential loads","Linked"],["Contingency","Reserve, alternate source, transfer and escalation procedure","Tested"]],
    workflow: ["Detect source, distribution or endpoint abnormality","Calculate departments, rooms and services at risk","Verify reserve and alternate-source readiness","Execute approved contingency and monitor restored service"],
  },
  SAFETY: {
    metrics: [["Isolation rooms ready","16 / 18","1 pressure alert","amber"],["Pressure compliance","98.7%","24 h","emerald"],["Terminal cleans due","12","4 priority","amber"],["Fire readiness","99.1%","2 actions","emerald"],["Security events","7","1 escalated","amber"],["Emergency teams","6 / 6","Available","cyan"]],
    entities: ["Isolation ISO-12 · negative pressure restored","Operating Theatre · positive pressure compliant","Ward 6B · terminal clean queue 4","Healthcare Waste Store · pickup confirmed","Infant Protection · all tags accounted","Fire Compartment L05 · door inspection due"],
    capacities: [["Isolation capacity",89],["Environmental compliance",99],["Cleaning services",78],["Waste traceability",96],["Security coverage",94],["Emergency readiness",92]],
    events: [["10:36","Isolation","Negative pressure restored","ISO-12","Normal"],["10:21","Cleaning","Terminal clean accepted","Ward 6B","Normal"],["10:12","Security","Staff duress test completed","ED","Normal"],["09:58","Fire Safety","Compartment door fault detected","L05","Warning"]],
    layers: [["Prevention","Isolation, pressure, cleaning, access and environmental controls","Continuous"],["Detection","Sensors, alarms, video, staff reports and clinical escalation","Integrated"],["Response","SOP, teams, communication, zoning and command","Coordinated"],["Learning","Evidence, root cause, corrective action and exercise review","Audited"]],
    workflow: ["Validate alarm and identify affected clinical area","Protect patients, staff and critical services","Coordinate IPC, security, clinical and facility response","Capture evidence, corrective actions and lessons learned"],
  },
  LOGISTICS: {
    metrics: [["Open logistics tasks","184","18 priority","cyan"],["Pharmacy fill SLA","96.2%","STAT 99.1%","emerald"],["Blood units ready","286","8 groups","blue"],["Sterile trays ready","118","14 reserved","cyan"],["Specimen TAT","18 min","Target <20","emerald"],["Porter SLA","92.6%","+1.8 pt","amber"]],
    entities: ["Central Pharmacy · 46 orders pending","Blood Bank · O negative stock 18 units","CSSD · Sterilizer 03 under maintenance","Pneumatic Tube · 32/33 stations online","Linen · Ward 6B delivery in progress","Food Services · 428 lunch trays dispatched"],
    capacities: [["Pharmacy",72],["Blood bank",61],["CSSD",83],["Linen",68],["Food services",74],["Internal transport",79]],
    events: [["10:37","Blood Bank","Urgent issue released","OR-06","Normal"],["10:29","CSSD","Tray batch sterilized","Cycle 260717-34","Normal"],["10:18","Pneumatic Tube","Station PT-18 offline","Laboratory","Warning"],["10:06","Pharmacy","Cold-chain delivery verified","ICU","Normal"]],
    layers: [["Demand","Orders, cases, wards, schedules and replenishment signals","Live"],["Inventory","Stock, expiry, cold chain, sterile status and reservation","Controlled"],["Movement","Porter, AGV, pneumatic tube, routes and chain of custody","Tracked"],["Service level","Priority, turnaround, exceptions and clinical impact","Measured"]],
    workflow: ["Receive demand from clinical or support service","Reserve inventory, tray, transport or production capacity","Track movement and chain of custody to destination","Confirm delivery and resolve exceptions against SLA"],
  },
  INTELLIGENCE: {
    metrics: [["Active predictions","28","6 high value","violet"],["Forecast confidence","92.4%","Median","cyan"],["Capacity alerts","7","Next 8 h","amber"],["Asset risk models","184","9 priority","blue"],["Scenarios ready","7","Validated","emerald"],["Approved actions","18","Today","emerald"]],
    entities: ["ED arrivals · +18% forecast between 11:00–13:00","ICU demand · 2 transfers likely within 6 h","Oxygen reserve · below 48 h target","CSSD · tray constraint may delay OR-08","Chiller Plant · efficiency opportunity 6.2%","PACS · latency anomaly correlated with storage tier"],
    capacities: [["Patient flow AI",92],["Capacity forecast",89],["Utility simulation",94],["Maintenance prediction",87],["Energy optimization",91],["Governance",96]],
    events: [["10:40","AI Forecast","ED surge probability updated","78%","Warning"],["10:27","Simulation","Oxygen outage scenario validated","37 h reserve","Info"],["10:15","Maintenance AI","AHU-OR-03 risk increased","Review","Warning"],["10:02","Optimization","Chiller sequence approved","-6.2%","Normal"]],
    layers: [["Observe","Trusted data, spatial context and operating constraints","Live"],["Predict","Forecast, anomaly, risk and confidence","Explainable"],["Simulate","What-if impact, alternatives and uncertainty","Decision support"],["Act","Human approval, controlled workflow, audit and rollback","Governed"]],
    workflow: ["Select scenario and define operational assumptions","Run model with current capacity and constraints","Compare baseline, impact and response alternatives","Approve, reject or revise recommended actions"],
  },
  SYSTEMS: {
    metrics: [["Connected systems","118 / 121","97.5%","cyan"],["Messages / sec","84,620","Peak 112k","blue"],["API availability","99.98%","Healthy","emerald"],["Median latency","38 ms","Target <80","cyan"],["Data quality","97.6%","+0.7 pt","emerald"],["Cyber events","12","1 priority","amber"]],
    entities: ["HIS / EMR · nominal · 38 ms","LIS · nominal · 42 ms","RIS / PACS · transfer latency watch","EBO / BMS · nominal · 22 ms","Medical Gas SCADA · nominal · 31 ms","RTLS · 96.8% data quality"],
    capacities: [["Clinical applications",98],["Integration",96],["Facility OT",99],["Medical devices",94],["Network",97],["Recovery readiness",92]],
    events: [["10:41","Integration","FHIR message queue normalized","HIS","Normal"],["10:32","PACS","Storage-tier latency elevated","Imaging","Warning"],["10:18","Cybersecurity","Device certificate rotated","ICU","Normal"],["10:04","Backup","Clinical DB restore test passed","DR","Normal"]],
    layers: [["Clinical & enterprise","HIS, EMR, LIS, RIS, PACS, pharmacy, ERP and CMMS","Integrated"],["OT & medical devices","EBO, SCADA, medical gas, meters, sensors and selected devices","Segmented"],["Data platform","Streaming, time series, lakehouse, master data and semantic layer","Governed"],["Security & resilience","Identity, segmentation, monitoring, backup, recovery and audit","Controlled"]],
    workflow: ["Monitor service, interface and data-product health","Correlate technical event with affected clinical workflow","Apply security, recovery or integration runbook","Verify restoration and retain complete audit evidence"],
  },
};

const SECTION_METRICS: Record<string, Metric[]> = {
  "emergency-operations": [["Patients in ED","84","31 waiting","cyan"],["Resus bays","6 / 8","2 available","emerald"],["Door-to-triage","6 min","Target <10","emerald"],["Door-to-doctor","28 min","Target <30","cyan"],["Boarding patients","14","3 >4 h","amber"],["Ambulances inbound","5","Next 30 min","blue"]],
  "bed-management": [["Staffed beds","482","520 licensed","cyan"],["Occupied","418","86.7%","blue"],["Ready now","34","12 isolation","emerald"],["Cleaning","18","Median 34 min","amber"],["Blocked","12","Clinical reasons","amber"],["Expected discharge","46","By 16:00","emerald"]],
  "icu-operations": [["ICU beds","42","36 occupied","cyan"],["Occupancy","86%","6 available","amber"],["Ventilators ready","14","8 in use","emerald"],["Isolation ready","8 / 9","1 cleaning","blue"],["Transfers pending","4","2 priority","amber"],["Nurse ratio","1:1.8","Within plan","emerald"]],
  "operating-theatre": [["Operating rooms","10","8 active","cyan"],["Cases today","42","26 completed","blue"],["On-time starts","91.2%","+2.1 pt","emerald"],["Average turnover","31 min","Target <35","emerald"],["Delayed cases","4","1 >30 min","amber"],["PACU occupancy","73%","8 bays free","cyan"]],
  "medical-gas-overview": [["Oxygen reserve","37 h","Target >48","amber"],["Oxygen pressure","4.2 bar","Stable","emerald"],["Medical air","7.4 bar","N+1","cyan"],["Vacuum","-62 kPa","N+1","cyan"],["Area alarms","1","Investigating","amber"],["Outlets monitored","386","99.5%","emerald"]],
  "critical-power": [["Grid availability","99.999%","2 feeders","emerald"],["Generators","3 / 3","Auto standby","cyan"],["UPS autonomy","84 min","Current load","blue"],["ATS ready","18 / 18","Tested","emerald"],["Fuel reserve","62 h","At N-1","cyan"],["Essential load","3.28 MW","58% capacity","blue"]],
  "isolation-room-readiness": [["Isolation rooms","18","16 ready","cyan"],["Negative pressure","17 / 18","1 excursion","amber"],["Doors compliant","96.8%","24 h","emerald"],["HEPA DP","98.9%","1 review","emerald"],["Terminal clean","2","In progress","blue"],["Rooms occupied","11","61%","cyan"]],
  "cssd-sterile-supply": [["Sterile trays ready","118","14 reserved","cyan"],["Sterilizers","3 / 4","1 maintenance","amber"],["Cycles today","34","100% released","emerald"],["Urgent requests","7","2 due","amber"],["Traceability","99.6%","Complete","emerald"],["OR case coverage","96.4%","Next 8 h","blue"]],
  "his-emr-health": [["HIS availability","99.98%","Healthy","emerald"],["ADT queue","0","Real time","cyan"],["Order messages","42.8k/d","99.7% valid","blue"],["Interface errors","12","2 open","amber"],["Concurrent users","1,842","Peak 2,140","cyan"],["Downtime readiness","92%","Exercise due","amber"]],
  "ris-pacs-imaging": [["PACS availability","99.94%","Latency watch","amber"],["Studies today","684","+8.2%","blue"],["CT queue","6","18 min","cyan"],["MRI queue","4","32 min","cyan"],["Reporting backlog","28","5 priority","amber"],["Storage headroom","42%","18 months","emerald"]],
};

export default function AirportModuleContent({ moduleId, sectionId, onNavigateSection }: { moduleId: AirportModuleId; sectionId: string; onNavigateSection?: (sectionId: string) => void }) {
  const { localizeModule, tr, language } = useAirportLanguage();
  const sourceModule = getAirportModule(moduleId);
  const module = localizeModule(sourceModule);
  const section = module.sections.find((item) => item.id === sectionId) ?? module.sections[0];
  const fullHeight = (moduleId === "ASSETS_FM" && sectionId === "bim-explorer") || (moduleId === "SPATIAL" && sectionId === "bim-federation");

  if (moduleId === "BMS") {
    return <motion.div key={`${moduleId}-${sectionId}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="h-full min-h-0"><FacilityOperationsModule sectionId={sectionId} /></motion.div>;
  }

  return (
    <motion.div key={`${moduleId}-${sectionId}`} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .22 }} className={fullHeight ? "flex h-full min-h-0 flex-col gap-3" : "space-y-4 pb-28"}>
      <AirportSectionHeader eyebrow={module.label} title={section.label} description={section.description} actions={<>
        {moduleId === "ENERGY" && <Link to="/site/yooenergy" className="airport-button !border-cyan-300/25 !bg-cyan-300/10 !text-cyan-100"><ExternalLink size={13}/>{language === "vi" ? "Mở YooEnergy" : "Open YooEnergy"}</Link>}
        <AirportStatusBadge status={moduleId === "ENERGY" ? "info" : "normal"} label={moduleId === "ENERGY" ? (language === "vi" ? "Dữ liệu trình diễn" : "Presentation data") : tr("Live demo")} />
        <button onClick={() => toast.success(language === "vi" ? "Đã tạo ảnh chụp dashboard" : "Dashboard snapshot created")} className="airport-button">{tr("Create snapshot")}</button>
      </>} />
      {moduleId === "ENERGY" && <EnergyUtilityModule sectionId={sectionId} onNavigateSection={onNavigateSection} />}
      {moduleId === "SPATIAL" && sectionId === "bim-federation" && <HospitalBimExplorer />}
      {moduleId === "ASSETS_FM" && sectionId === "bim-explorer" && <HospitalBimExplorer medical />}
      {moduleId === "ASSETS_FM" && sectionId === "asset-registry" && <MedicalAssetRegistry />}
      {moduleId === "PATIENT_FLOW" && ["flow-command","bed-management","admission-transfer-discharge"].includes(sectionId) && <PatientFlowRegistry sectionId={sectionId} />}
      {moduleId === "SYSTEMS" && sectionId === "integration-hub" && <IntegrationHub />}
      {moduleId === "INTELLIGENCE" && ["emergency-surge","mass-casualty","infectious-outbreak","utility-outage","fire-evacuation"].includes(sectionId) && <HospitalScenarioStudio type={sectionId} />}
      {moduleId !== "ENERGY" && !(moduleId === "SPATIAL" && sectionId === "bim-federation") && !(moduleId === "ASSETS_FM" && ["bim-explorer","asset-registry"].includes(sectionId)) && !(moduleId === "PATIENT_FLOW" && ["flow-command","bed-management","admission-transfer-discharge"].includes(sectionId)) && !(moduleId === "SYSTEMS" && sectionId === "integration-hub") && !(moduleId === "INTELLIGENCE" && ["emergency-surge","mass-casualty","infectious-outbreak","utility-outage","fire-evacuation"].includes(sectionId)) && <HospitalDomainDashboard moduleId={moduleId as Exclude<AirportModuleId, "OVERVIEW" | "BMS" | "ENERGY">} sectionId={sectionId} title={section.label} description={section.description} />}
    </motion.div>
  );
}

function HospitalDomainDashboard({ moduleId, sectionId, title, description }: { moduleId: Exclude<AirportModuleId, "OVERVIEW" | "BMS" | "ENERGY">; sectionId: string; title: string; description: string }) {
  const profile = DOMAIN_PROFILES[moduleId];
  const metrics = SECTION_METRICS[sectionId] ?? profile.metrics;
  const trend = useMemo(() => getHospitalTrend(sectionId, 96, moduleId === "PATIENT_FLOW" ? 74 : moduleId === "CRITICAL_UTILITIES" ? 68 : 72, 12), [sectionId, moduleId]);
  return <>
    <MetricGrid metrics={metrics}/>
    <div className="grid gap-4 xl:grid-cols-[1.45fr_.75fr]">
      <AirportPanel title={title} subtitle={description}><div className="p-3"><AirportTrendChart data={trend} height={250} unit={moduleId === "PATIENT_FLOW" ? "%" : ""}/></div></AirportPanel>
      <AirportPanel title="Live operational context"><EntityList entities={profile.entities}/></AirportPanel>
    </div>
    <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
      <AirportPanel title="Capacity and readiness"><div className="grid gap-3 p-4 sm:grid-cols-2">{profile.capacities.map(([label,value])=><CapacityBar key={label} label={label} value={value}/>)}</div></AirportPanel>
      <AirportPanel title="Live events"><div className="p-3"><AirportTimeline events={profile.events}/></div></AirportPanel>
    </div>
    <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
      <AirportPanel title="Operational architecture"><div className="grid gap-3 p-4 sm:grid-cols-2">{profile.layers.map(([name, detail, state], index)=><div key={name} className="rounded-xl border border-cyan-400/15 bg-cyan-400/[.045] p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[8px] uppercase tracking-[.15em] text-cyan-300">Layer 0{index+1}</p><h3 className="mt-1 text-xs font-semibold text-white">{name}</h3></div><AirportStatusBadge status={state === "Human approved" || state === "Governed" ? "info" : "normal"} label={state}/></div><p className="mt-3 text-[10px] leading-relaxed text-slate-400">{detail}</p></div>)}</div></AirportPanel>
      <AirportPanel title="Coordinated workflow"><div className="space-y-2 p-4">{profile.workflow.map((step,index)=><button key={step} onClick={()=>toast.info(step)} className="flex w-full items-center gap-3 rounded-xl border border-white/[.07] bg-white/[.025] p-3 text-left hover:border-cyan-400/20"><span className="grid h-7 w-7 flex-none place-items-center rounded-lg bg-cyan-400/10 text-[10px] font-bold text-cyan-200">{index+1}</span><span className="text-[10px] leading-relaxed text-slate-300">{step}</span></button>)}</div></AirportPanel>
    </div>
  </>;
}

function PatientFlowRegistry({ sectionId }: { sectionId: string }) {
  const [page,setPage]=useState(1); const [pageSize,setPageSize]=useState<PageSize>(25); const [search,setSearch]=useState(""); const [selected,setSelected]=useState<PatientFlowRow|null>(null);
  const result=useMemo(()=>getPatientFlowPage(page,pageSize,search),[page,pageSize,search]);
  const metrics=SECTION_METRICS[sectionId] ?? DOMAIN_PROFILES.PATIENT_FLOW.metrics;
  const columns:AirportColumn<PatientFlowRow>[]=[
    {key:"episode",label:"Episode",render:r=><span className="font-mono text-cyan-300">{r.episode}</span>},{key:"department",label:"Department"},{key:"stage",label:"Current stage",render:r=><span className="font-semibold text-white">{r.stage}</span>},{key:"wait",label:"Wait",render:r=><span className={r.wait>60?"text-amber-300":"text-slate-300"}>{r.wait} min</span>},{key:"acuity",label:"Acuity"},{key:"bed",label:"Bed / Bay"},{key:"status",label:"Status",render:r=><AirportStatusBadge status={r.status==="Escalated"?"critical":r.status==="At risk"?"warning":"normal"} label={r.status}/>},{key:"owner",label:"Owner"},{key:"updated",label:"Updated"},
  ];
  return <><MetricGrid metrics={metrics}/><AirportFilterBar search={search} onSearch={v=>{setSearch(v);setPage(1)}}><select className="airport-select"><option>All departments</option><option>Emergency</option><option>ICU</option><option>Inpatient</option><option>Operating Theatre</option></select><select className="airport-select"><option>All flow states</option><option>Escalated</option><option>At risk</option><option>On plan</option></select></AirportFilterBar><AirportDataTable rows={result.rows} columns={columns} total={result.total} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={s=>{setPageSize(s);setPage(1)}} onRowClick={setSelected} selectedId={selected?.id}/><AirportDetailDrawer open={Boolean(selected)} title={selected?.episode??"Flow episode"} subtitle={selected?.department} onClose={()=>setSelected(null)}>{selected&&<div className="space-y-4"><div className="grid grid-cols-2 gap-2"><AirportMetricCard label="Wait" value={`${selected.wait} min`} compact tone={selected.wait>60?"amber":"cyan"}/><AirportMetricCard label="Status" value={selected.status} compact tone={selected.status==="Escalated"?"red":"emerald"}/><AirportMetricCard label="Bed / Bay" value={selected.bed} compact/><AirportMetricCard label="Updated" value={selected.updated} compact/></div><AirportPanel title="Operational context"><div className="space-y-2 p-3">{[["Department",selected.department],["Current stage",selected.stage],["Acuity",selected.acuity],["Coordinator",selected.owner]].map(([a,b])=><div key={a} className="flex justify-between border-b border-white/[.06] pb-2 text-[10px]"><span className="text-slate-500">{a}</span><b className="text-right text-white">{b}</b></div>)}</div></AirportPanel><button onClick={()=>toast.success("Flow escalation assigned to Hospital Command")} className="airport-button w-full justify-center">Escalate flow constraint</button></div>}</AirportDetailDrawer></>;
}

function MedicalAssetRegistry(){
  const [page,setPage]=useState(1); const [pageSize,setPageSize]=useState<PageSize>(25); const [search,setSearch]=useState(""); const [selected,setSelected]=useState<AssetRow|null>(null);
  const result=useMemo(()=>getAssetPage(page,pageSize,search),[page,pageSize,search]);
  const columns:AirportColumn<AssetRow>[]=[{key:"id",label:"Asset ID",render:r=><span className="font-mono text-cyan-300">{r.id}</span>},{key:"name",label:"Equipment",render:r=><span className="font-semibold text-white">{r.name}</span>},{key:"system",label:"Clinical / Facility system"},{key:"area",label:"Department"},{key:"location",label:"Room / Location"},{key:"manufacturer",label:"Manufacturer"},{key:"condition",label:"Condition",render:r=><AirportStatusBadge status={r.condition==="Critical"?"critical":r.condition==="Attention"?"warning":"normal"} label={r.condition}/>},{key:"criticality",label:"Criticality"},{key:"health",label:"Health",render:r=><span className={r.health<65?"text-red-300":r.health<80?"text-amber-300":"text-emerald-300"}>{r.health}%</span>},{key:"nextService",label:"Next service"},{key:"predictedFailure",label:"Predicted failure"},{key:"dataQuality",label:"Data quality",render:r=><span>{r.dataQuality}%</span>}];
  return <><MetricGrid metrics={DOMAIN_PROFILES.ASSETS_FM.metrics}/><AirportFilterBar search={search} onSearch={v=>{setSearch(v);setPage(1)}}><select className="airport-select"><option>All equipment classes</option><option>Life-support equipment</option><option>Diagnostic equipment</option><option>Facility critical assets</option></select></AirportFilterBar><AirportDataTable rows={result.rows} columns={columns} total={result.total} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={s=>{setPageSize(s);setPage(1)}} onRowClick={setSelected} selectedId={selected?.id}/><AirportDetailDrawer open={Boolean(selected)} title={selected?.name??"Medical equipment"} subtitle={selected?.id} onClose={()=>setSelected(null)}>{selected&&<div className="space-y-4"><div className="grid grid-cols-2 gap-2"><AirportMetricCard label="Health" value={`${selected.health}%`} compact tone={selected.health<65?"red":selected.health<80?"amber":"emerald"}/><AirportMetricCard label="Runtime" value={`${selected.runtime.toLocaleString()} h`} compact/><AirportMetricCard label="Data quality" value={`${selected.dataQuality}%`} compact tone="blue"/><AirportMetricCard label="Next service" value={selected.nextService} compact/></div><AirportPanel title="Medical asset digital thread"><div className="space-y-2 p-3">{[["System",selected.system],["Department",selected.area],["Room / Location",selected.location],["BIM GUID",selected.bimGuid],["Manufacturer",selected.manufacturer],["Criticality",selected.criticality],["Predicted failure",selected.predictedFailure]].map(([a,b])=><div key={a} className="flex justify-between gap-4 border-b border-white/[.06] pb-2 text-[10px]"><span className="text-slate-500">{a}</span><b className="text-right text-white">{b}</b></div>)}</div></AirportPanel><button onClick={()=>toast.success("Condition-based work order created")} className="airport-button w-full justify-center">Create work order</button></div>}</AirportDetailDrawer></>;
}

function HospitalBimExplorer({medical=false}:{medical?:boolean}){
  const [node,setNode]=useState(medical?"Medical Equipment Federation":"Hospital Campus Federation");
  const nodes=medical?["Medical Equipment Federation","Emergency & ICU Assets","Operating Theatre Equipment","Imaging Equipment","Facility Critical Assets","Mobile Equipment & RTLS"]:["Hospital Campus Federation","Acute Care Tower","Inpatient Tower","Diagnostics & Treatment","Clinical Support Services","Critical Utility Infrastructure","Fire Compartments & Evacuation"];
  return <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[260px_minmax(0,1fr)_320px]"><AirportPanel title="Hospital BIM federation tree" className="min-h-0 overflow-auto"><div className="space-y-1 p-3">{nodes.map((item,index)=><button key={item} onClick={()=>setNode(item)} className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left ${node===item?"border-cyan-400/25 bg-cyan-400/10 text-white":"border-transparent text-slate-400 hover:bg-white/[.035]"}`}>{index===0?<Map size={15}/>:index===nodes.length-1?<GitBranch size={15}/>:<Building2 size={15}/>}<span className="text-[10px]">{item}</span></button>)}</div></AirportPanel><AirportPanel title={node} subtitle="Temporary 3D model retained from the current platform until the official hospital model is supplied" className="relative min-h-[620px] overflow-hidden"><BimModelViewer modelUrl={AIRPORT_3D_CONFIG.modelUrl} label={node}/></AirportPanel><AirportPanel title="BIM and digital thread"><div className="space-y-3 p-4">{[["Mapped rooms","1,248 / 1,266"],["Mapped beds","506 / 520"],["Linked assets","27,184 / 28,640"],["Clinical requirements","186 room types"],["Open issues","38"],["Linked documents","64,820"],["Last federation","6 min ago"]].map(([a,b],i)=><div key={a} className="rounded-lg border border-white/[.06] bg-white/[.025] p-3"><div className="flex justify-between"><span className="text-[9px] text-slate-500">{a}</span><AirportStatusBadge status={i===4?"warning":"normal"}/></div><p className="mt-2 text-sm font-semibold text-white">{b}</p></div>)}<button onClick={()=>toast.success("BIM coordination issue created")} className="airport-button w-full justify-center">Create coordination issue</button></div></AirportPanel></div>;
}

function IntegrationHub(){
  const rows=SYSTEM_CONNECTIONS.map((r,index)=>({id:`INT-${index+1}`,system:r[0],domain:r[1],protocol:r[2],availability:r[3],lastMessage:r[4],latency:r[5],quality:r[6],owner:["Clinical IT","Integration Team","Facility OT","Medical Engineering"][index%4]}));
  type R=(typeof rows)[number];
  const cols:AirportColumn<R>[]=[{key:"system",label:"System",render:r=><span className="font-semibold text-cyan-300">{r.system}</span>},{key:"domain",label:"Domain"},{key:"protocol",label:"Connection / Protocol"},{key:"availability",label:"Availability"},{key:"lastMessage",label:"Last message"},{key:"latency",label:"Latency"},{key:"quality",label:"Data quality"},{key:"owner",label:"Owner"}];
  return <><MetricGrid metrics={DOMAIN_PROFILES.SYSTEMS.metrics}/><div className="grid gap-4 xl:grid-cols-4">{[["Clinical",28,"HIS · EMR · LIS · RIS/PACS"],["Facility OT",24,"EBO · Power · Water · Medical Gas"],["Enterprise",22,"ERP · CMMS · HR · DMS"],["IoT & Devices",47,"RTLS · Sensors · Gateways · Security"]].map(([a,b,c])=><AirportPanel key={String(a)} title={String(a)}><div className="p-4"><p className="text-2xl font-semibold text-white">{b}</p><p className="mt-1 text-[10px] text-slate-500">{c}</p></div></AirportPanel>)}</div><AirportDataTable rows={rows} columns={cols} total={rows.length} page={1} pageSize={25} onPageChange={()=>undefined} onPageSizeChange={()=>undefined} onRowClick={r=>toast.info(`${r.system} integration detail opened`)}/></>;
}

const SCENARIOS: Record<string,{icon:React.ElementType;title:string;statement:string;metrics:Metric[];steps:string[];outputs:string[]}>={
  "emergency-surge":{icon:Siren,title:"Emergency surge simulation",statement:"Emergency arrivals increase 35% over the next four hours with high-acuity mix above baseline.",metrics:[["Forecast arrivals","126","4 hours","violet"],["High acuity","28","22%","amber"],["ED bays required","42","6 short","red"],["Inpatient beds","18","Required","amber"],["Staff actions","12","Coordinated","cyan"],["Confidence","92.8%","Validated","emerald"]],steps:["Load arrival forecast and triage mix","Model ED bays, diagnostics and staffing","Propagate admission demand to beds and ICU","Compare surge areas and elective deferral options","Issue human-approved activation plan"],outputs:["Open 8 flex bays","Call 2 surge teams","Protect 6 inpatient beds","Pre-alert CT and laboratory"]},
  "mass-casualty":{icon:Users,title:"Mass casualty simulation",statement:"Scenario with 60 casualties arriving over 90 minutes, including 12 immediate and 18 delayed cases.",metrics:[["Casualties","60","90 min","violet"],["Immediate","12","Red triage","red"],["OR demand","8 cases","4 urgent","amber"],["ICU demand","7 beds","2 short","red"],["Blood demand","34 units","O negative watch","amber"],["Readiness","88%","Actions required","cyan"]],steps:["Define casualty count and triage distribution","Model ambulance arrival and decontamination","Allocate ED, OR, ICU, blood and imaging","Identify temporary treatment and staffing gaps","Generate incident-command action board"],outputs:["Activate MCI level 2","Open treatment zone B","Protect 4 operating rooms","Request regional blood support"]},
  "infectious-outbreak":{icon:ShieldCheck,title:"Infectious outbreak simulation",statement:"A cluster of 24 suspected airborne-infection cases requires cohorting and protected patient routes.",metrics:[["Suspected cases","24","Scenario","violet"],["Isolation rooms","18","2 unavailable","amber"],["Cohort beds","16","Convertible","cyan"],["PPE runway","38 h","At surge use","amber"],["Staff exposure zones","4","Modelled","red"],["Confidence","90.6%","Environmental","emerald"]],steps:["Identify suspected cases and exposure locations","Calculate isolation and cohort capacity","Validate pressure, cleaning and clean/dirty routes","Model PPE, staffing and diagnostic demand","Publish approved zoning and communication plan"],outputs:["Convert Ward 7A cohort zone","Reserve 10 negative-pressure rooms","Separate imaging route","Increase terminal-clean team"]},
  "utility-outage":{icon:GitBranch,title:"Critical utility outage simulation",statement:"Loss of oxygen primary source combined with essential feeder interruption during peak clinical load.",metrics:[["Departments affected","8","Critical","red"],["Oxygen reserve","37 h","Current","amber"],["UPS autonomy","84 min","Current load","cyan"],["Generators","3 / 3","Available","emerald"],["Patients at risk","42","Ventilated / OR","red"],["Recovery target","18 min","Approved sequence","blue"]],steps:["Traverse source and distribution topology","Map affected rooms, beds and clinical services","Check reserve, alternate source and transfer capacity","Recommend isolation, switching and load sequence","Validate restored pressure, voltage and safety"],outputs:["Transfer oxygen to manifold B","Start generator G02","Protect ICU/OR feeders","Suspend nonessential imaging"]},
  "fire-evacuation":{icon:Flame,title:"Fire, smoke and evacuation simulation",statement:"Smoke event in Level 5 service zone with assisted patients and one elevator bank unavailable.",metrics:[["Fire compartment","L05-C","Scenario","red"],["Patients in zone","68","14 assisted","amber"],["Refuge capacity","96","Available","emerald"],["Safe routes","3","Validated","cyan"],["Elevators available","2 / 3","Fire mode","amber"],["Clearance time","14 min","Modelled","blue"]],steps:["Set fire origin, smoke and compartment status","Identify patients by mobility and care dependency","Calculate horizontal evacuation routes and destinations","Assign teams, equipment and communication","Run clearance time and route-conflict check"],outputs:["Evacuate to L05-B","Protect ICU route","Deploy 4 assisted-transfer teams","Close elevator bank E2"]},
};

function HospitalScenarioStudio({type}:{type:string}){
  const [running,setRunning]=useState(false); const [completed,setCompleted]=useState(false); const scenario=SCENARIOS[type]??SCENARIOS["emergency-surge"]; const Icon=scenario.icon;
  const run=()=>{setRunning(true);setCompleted(false);window.setTimeout(()=>{setRunning(false);setCompleted(true);toast.success("Scenario completed with governed recommendations")},900)};
  return <><MetricGrid metrics={scenario.metrics}/><div className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]"><AirportPanel title={scenario.title} subtitle="Decision-support simulation · no automatic clinical or life-safety command"><div className="p-5"><div className="rounded-2xl border border-violet-400/20 bg-violet-400/[.06] p-5"><div className="flex items-start gap-4"><span className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-violet-400/10 text-violet-300"><Icon size={22}/></span><div><p className="text-[9px] uppercase tracking-[.18em] text-violet-300">Scenario statement</p><p className="mt-2 text-sm leading-relaxed text-white">{scenario.statement}</p></div></div></div><div className="mt-4 grid gap-2">{scenario.steps.map((step,index)=><div key={step} className="flex items-center gap-3 rounded-lg border border-white/[.06] bg-white/[.025] p-3"><span className={`grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold ${completed?"bg-emerald-400/15 text-emerald-300":running?"bg-violet-400/15 text-violet-300":"bg-white/[.05] text-slate-500"}`}>{completed?<CheckCircle2 size={14}/>:index+1}</span><p className="text-[10px] text-slate-300">{step}</p></div>)}</div><button onClick={run} disabled={running} className="airport-button mt-4 w-full justify-center !border-violet-400/25 !bg-violet-400/10 !text-violet-200"><Play size={14}/>{running?"Running simulation…":"Run what-if simulation"}</button></div></AirportPanel><AirportPanel title="Recommended response" subtitle="Requires authorized human review"><div className="space-y-3 p-4">{scenario.outputs.map((output,index)=><div key={output} className="rounded-xl border border-white/[.07] bg-white/[.025] p-4"><div className="flex items-center justify-between"><span className="text-[10px] font-semibold text-white">{output}</span><AirportStatusBadge status={completed?index===0?"warning":"normal":"info"} label={completed?"Review":"Pending"}/></div><p className="mt-2 text-[9px] text-slate-500">Evidence, owner, approval and rollback are recorded in the command workflow.</p></div>)}<div className="rounded-xl border border-amber-400/20 bg-amber-400/[.05] p-4"><div className="flex gap-3"><AlertTriangle size={17} className="text-amber-300"/><p className="text-[10px] leading-relaxed text-slate-300">Simulation results support decisions only. Clinical care, medical gas, power and evacuation actions require authorized human approval and established SOPs.</p></div></div></div></AirportPanel></div></>;
}

function MetricGrid({metrics}:{metrics:Metric[]}){return <div className={`grid grid-cols-2 gap-2 md:grid-cols-3 ${metrics.length>6?"xl:grid-cols-5":"xl:grid-cols-6"}`}>{metrics.map(([label,value,trend,tone])=><AirportMetricCard key={label} label={label} value={value} trend={trend} compact tone={tone??"cyan"}/>)}</div>}
function EntityList({entities}:{entities:string[]}){return <div className="space-y-2 p-3">{entities.map((entity,index)=><button key={entity} onClick={()=>toast.info(entity)} className="flex w-full items-center justify-between rounded-lg border border-white/[.06] bg-white/[.025] p-3 text-left"><span className="text-[10px] text-slate-300">{entity}</span><AirportStatusBadge status={index===0||String(entity).includes("alert")||String(entity).includes("maintenance")?"warning":"normal"}/></button>)}</div>}
function CapacityBar({label,value}:{label:string;value:number}){return <div><div className="mb-1 flex justify-between text-[10px]"><span className="text-slate-400">{label}</span><b className="text-white">{value}%</b></div><div className="h-2 overflow-hidden rounded-full bg-white/[.06]"><motion.div initial={{width:0}} animate={{width:`${value}%`}} className={`h-full rounded-full ${value>85?"bg-amber-400":"bg-cyan-400"}`}/></div></div>}
