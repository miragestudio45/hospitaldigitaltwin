import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity, BarChart3, Box, ChevronLeft, ChevronRight, Gauge, Layers3,
  LocateFixed, MapPinned, Maximize2, Minimize2, Plane, Route, ShieldAlert,
  SlidersHorizontal, Wind, X,
} from "lucide-react";
import { toast } from "sonner";
import overviewImage from "@/assets/airport/Overview_HighTechPark.webp";
import type { AirportModuleId, AirportStatus, SpatialNode } from "../config/airportRegistry";
import {
  AIRPORT_HOTSPOTS, AIRPORT_LAYERS, AIRPORT_SPATIAL_HIERARCHY,
  type AirportHotspotDefinition,
} from "../config/airportRegistry";
import { AIRPORT_OVERVIEW_KPIS, INCIDENTS, OPERATION_EVENTS, getParkTrend } from "../data/airportMockData";
import { AirportPanel, AirportStatusBadge, AirportTimeline, AirportTrendChart } from "../shared/AirportUI";
import { useAirportLanguage } from "../i18n/AirportLanguage";
import { AirportOverview3D } from "./AirportOverview3D";

type InfoMode = "none" | "summary" | "insights" | "hierarchy" | "readiness" | "maturity";

type SpatialSelection = {
  parent: SpatialNode;
  node: SpatialNode;
};

const SECTION_INFO_MODE: Record<string, InfoMode> = {
  "command-center": "summary",
  "spatial-hierarchy": "hierarchy",
  "operational-readiness": "readiness",
  "digital-twin-maturity": "maturity",
};

const SPATIAL_MODULE_MAP: Record<string, AirportModuleId> = {
  "acute-care": "PATIENT_FLOW", emergency: "PATIENT_FLOW", icu: "PATIENT_FLOW", "operating-theatre": "PATIENT_FLOW", pacu: "PATIENT_FLOW",
  inpatient: "PATIENT_FLOW", "medical-wards": "PATIENT_FLOW", "surgical-wards": "PATIENT_FLOW", "isolation-ward": "SAFETY", "maternity-pediatrics": "PATIENT_FLOW",
  "diagnostics-treatment": "CLINICAL", imaging: "CLINICAL", laboratory: "CLINICAL", dialysis: "CLINICAL", outpatient: "EXPERIENCE",
  "clinical-support": "LOGISTICS", pharmacy: "LOGISTICS", "blood-bank": "LOGISTICS", cssd: "LOGISTICS", rehabilitation: "EXPERIENCE",
  "facility-infrastructure": "BMS", "central-utility": "BMS", "oxygen-plant": "CRITICAL_UTILITIES", "electrical-plant": "CRITICAL_UTILITIES", "data-center": "SYSTEMS",
  "public-support": "EXPERIENCE", "main-lobby": "EXPERIENCE", "visitor-parking": "EXPERIENCE", "ambulance-bay": "PATIENT_FLOW", "logistics-dock": "LOGISTICS",
};

const HOTSPOT_ALIASES: Record<string, string> = {
  "acute-care": "emergency", emergency: "emergency", icu: "icu", "operating-theatre": "or", pacu: "or",
  inpatient: "icu", "medical-wards": "icu", "surgical-wards": "or", "isolation-ward": "isolation", "maternity-pediatrics": "icu",
  "diagnostics-treatment": "imaging", imaging: "imaging", laboratory: "laboratory", dialysis: "laboratory", outpatient: "main-lobby",
  "clinical-support": "pharmacy", pharmacy: "pharmacy", "blood-bank": "cssd", cssd: "cssd", rehabilitation: "main-lobby",
  "facility-infrastructure": "utility", "central-utility": "utility", "oxygen-plant": "oxygen", "electrical-plant": "utility", "data-center": "datacenter",
  "public-support": "main-lobby", "main-lobby": "main-lobby", "visitor-parking": "main-lobby", "ambulance-bay": "emergency", "logistics-dock": "cssd",
};

const READINESS_DOMAINS: Array<[string, string, string, AirportStatus]> = [
  ["Patient flow & capacity", "92.8%", "ED surge watch · bed coordination active", "warning"],
  ["Clinical operations", "97.6%", "PACS latency under monitoring", "normal"],
  ["Facility & EBO", "98.4%", "Clinical environments available", "normal"],
  ["Critical utilities", "94.1%", "Oxygen reserve below 48-hour target", "warning"],
  ["Infection, safety & emergency", "96.2%", "One isolation pressure action", "warning"],
  ["Systems, data & cybersecurity", "99.1%", "Three degraded integrations · failover ready", "normal"],
];

const READINESS_CHECKS: Array<[string, string, AirportStatus]> = [
  ["Emergency surge capacity", "8 flex bays available · 2 surge teams ready", "warning"],
  ["ICU and ventilator readiness", "6 beds and 14 ventilators available", "normal"],
  ["Operating theatre readiness", "8/10 rooms active · PACU capacity 73%", "normal"],
  ["Medical gas continuity", "37-hour oxygen reserve · alternate manifold ready", "warning"],
  ["Essential power continuity", "3/3 generators · UPS autonomy 84 min", "normal"],
  ["Isolation and infection control", "16/18 rooms ready · one pressure review", "warning"],
];

const MATURITY_LEVELS: Array<[string, string, string, string]> = [
  ["L1+", "Hospital Spatial Foundation", "Current state: campus, floor, department, room, bed, BIM, asset and document context", "Current"],
  ["L2", "Connected Hospital Operations", "Proposed scope: BMS/EBO, medical gas, power, RTLS, CMMS and aggregated clinical-system feeds", "Proposed"],
  ["L3", "Prediction & Simulation", "Next phase: patient-flow forecasting, critical-utility scenarios, predictive maintenance and infection-readiness modelling", "Next"],
  ["L4", "Human-governed Optimization", "Long-term target: coordinated recommendations, authorized workflows, audit and rollback", "Target"],
];

function stableMetric(id: string, min: number, max: number) {
  const hash = [...id].reduce((sum, char) => ((sum * 31) + char.charCodeAt(0)) >>> 0, 17);
  return min + (hash % Math.max(1, max - min + 1));
}

export function AirportOverview({ viewMode, onViewModeChange, onOpenModule, activeSection, sectionRequest }: {
  viewMode: "2d" | "3d";
  onViewModeChange: (mode: "2d" | "3d") => void;
  onOpenModule: (module: AirportModuleId) => void;
  activeSection: string;
  sectionRequest: number;
}) {
  const { language, tr } = useAirportLanguage();
  const [selected, setSelected] = useState<AirportHotspotDefinition | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [layersOpen, setLayersOpen] = useState(false);
  const [infoMode, setInfoMode] = useState<InfoMode>("none");
  const [infoExpanded, setInfoExpanded] = useState(false);
  const [spatialSelection, setSpatialSelection] = useState<SpatialSelection | null>(null);
  const [activeLayers, setActiveLayers] = useState(() => new Set(["Hospital Campus & Buildings", "Floors & Departments", "Rooms, Beds & Bays", "BIM & Digital Thread", "Patient Flow & Capacity", "Critical Power", "Medical Gases", "HVAC & Clinical Environment", "Infection Control", "Fire & Evacuation", "Security & Access", "Energy & ESG"]));
  const flightTrend = useMemo(() => getParkTrend("24 Hours"), []);
  const headlineKpis = [0, 3, 4, 8, 9].map((index) => AIRPORT_OVERVIEW_KPIS[index]);
  const overlayWidthClass = "w-[clamp(116px,9vw,150px)] max-w-[150px]";
  const overviewActionToolbarClass = viewMode === "3d"
    ? `absolute left-3 top-[246px] z-40 flex ${overlayWidthClass} flex-col gap-2`
    : `absolute left-3 top-[78px] z-40 flex ${overlayWidthClass} flex-col gap-2`;
  const layersPanelClass = viewMode === "3d"
    ? `absolute left-3 top-[402px] z-40 ${overlayWidthClass} rounded-xl border border-white/10 bg-[#06111f]/91 p-3 shadow-2xl backdrop-blur-xl`
    : `absolute left-3 top-[234px] z-40 ${overlayWidthClass} rounded-xl border border-white/10 bg-[#06111f]/91 p-3 shadow-2xl backdrop-blur-xl`;

  useEffect(() => {
    if (sectionRequest <= 0) return;
    const nextMode = SECTION_INFO_MODE[activeSection];
    if (nextMode) {
      setSelected(null);
      setInfoExpanded(false);
      setInfoMode(nextMode);
    }
  }, [activeSection, sectionRequest]);

  const visibleHotspots = useMemo(() => AIRPORT_HOTSPOTS.filter((hotspot) => {
    if (hotspot.module === "SPATIAL") return activeLayers.has("Hospital Campus & Buildings") || activeLayers.has("Floors & Departments") || activeLayers.has("BIM & Digital Thread");
    if (hotspot.module === "PATIENT_FLOW") return activeLayers.has("Patient Flow & Capacity") || activeLayers.has("Rooms, Beds & Bays");
    if (hotspot.module === "CLINICAL") return activeLayers.has("Clinical Systems & Data") || activeLayers.has("Floors & Departments");
    if (hotspot.module === "ASSETS_FM") return activeLayers.has("Medical Equipment & RTLS") || activeLayers.has("BIM & Digital Thread");
    if (hotspot.module === "CRITICAL_UTILITIES") return activeLayers.has("Critical Power") || activeLayers.has("Medical Gases") || activeLayers.has("Water & RO");
    if (hotspot.module === "SAFETY") return activeLayers.has("Infection Control") || activeLayers.has("Fire & Evacuation") || activeLayers.has("Security & Access");
    if (hotspot.module === "ENERGY") return activeLayers.has("Energy & ESG");
    if (hotspot.module === "SYSTEMS") return activeLayers.has("Clinical Systems & Data") || activeLayers.has("Hospital Campus & Buildings");
    if (hotspot.module === "LOGISTICS") return activeLayers.has("Logistics & Support Services") || activeLayers.has("Floors & Departments");
    return activeLayers.has("Hospital Campus & Buildings") || activeLayers.has("HVAC & Clinical Environment");
  }), [activeLayers]);

  const openInfo = (mode: Exclude<InfoMode, "none">) => {
    setSelected(null);
    setInfoMode((current) => current === mode ? "none" : mode);
    setInfoExpanded(false);
  };

  const locateSpatialNode = (selection: SpatialSelection) => {
    const hotspotId = HOTSPOT_ALIASES[selection.node.id] ?? HOTSPOT_ALIASES[selection.parent.id];
    const hotspot = AIRPORT_HOTSPOTS.find((item) => item.id === hotspotId);
    if (hotspot) {
      setSelected(hotspot);
      setInfoMode("none");
      setInfoExpanded(false);
      toast.success(`${tr("Spatial context")}: ${tr(selection.parent.label)} / ${tr(selection.node.label)}`);
    }
  };

  return (
    <div className="relative h-full min-h-0 overflow-hidden bg-[#04111f]">
      {viewMode === "3d" ? (
        <AirportOverview3D onBack2D={() => onViewModeChange("2d")} />
      ) : (
        <>
          <img src={overviewImage} alt="Temporary hospital overview reference image" className="absolute inset-0 h-full w-full select-none object-cover object-center" draggable={false} />
          <div className="pointer-events-none absolute inset-0 bg-[#03101d]/5" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_52%,rgba(1,8,18,.58)_100%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.13]" style={{ backgroundImage: "linear-gradient(rgba(34,211,238,.15) 1px,transparent 1px),linear-gradient(90deg,rgba(34,211,238,.15) 1px,transparent 1px)", backgroundSize: "42px 42px" }} />
        </>
      )}

      <div className={overviewActionToolbarClass}>
        <button onClick={() => setLayersOpen((open) => !open)} className={`airport-button w-full justify-start bg-[#06111f]/84 px-3 text-[10px] backdrop-blur-xl ${layersOpen ? "!border-cyan-400/30 !bg-cyan-400/10 !text-cyan-200" : ""}`}>
          <Layers3 size={14} />{layersOpen ? tr("Hide data layers") : tr("Show data layers")}
        </button>
        <button onClick={() => openInfo("summary")} className={`airport-button w-full justify-start bg-[#06111f]/84 px-3 text-[10px] backdrop-blur-xl ${infoMode === "summary" ? "!border-cyan-400/30 !bg-cyan-400/10 !text-cyan-200" : ""}`}>
          <Gauge size={14} />{tr("Operational overview")}
        </button>
        <button onClick={() => openInfo("insights")} className={`airport-button w-full justify-start bg-[#06111f]/84 px-3 text-[10px] backdrop-blur-xl ${infoMode === "insights" ? "!border-violet-400/30 !bg-violet-400/10 !text-violet-200" : ""}`}>
          <BarChart3 size={14} />{tr("Operational insights")}
        </button>
      </div>

      <div className="pointer-events-none absolute left-1/2 top-3 z-30 hidden -translate-x-1/2 items-stretch gap-1.5 2xl:flex">
        {headlineKpis.map(([label, value, trend], index) => (
          <div key={label} className={`min-w-[142px] rounded-xl border bg-[#06111f]/78 px-3 py-2 shadow-xl backdrop-blur-xl ${index === 3 ? "border-red-400/25" : "border-cyan-400/15"}`}>
            <p className="text-[8px] font-semibold uppercase tracking-[.12em] text-slate-500">{tr(label)}</p>
            <div className="mt-1 flex items-end justify-between gap-2"><strong className="text-base text-white">{value}</strong><span className={`text-[8px] ${index === 3 ? "text-red-300" : "text-cyan-200"}`}>{tr(trend)}</span></div>
          </div>
        ))}
      </div>

      <div className="absolute right-3 top-3 z-35 flex gap-2">
        <span className="rounded-lg border border-white/10 bg-[#06111f]/76 px-3 py-2 text-[9px] text-slate-300 backdrop-blur-lg"><Wind size={13} className="mr-1 inline text-blue-300" />NE 4.6 m/s · {tr("Visibility 10 km")}</span>
        <button onClick={() => toast.success(language === "vi" ? "Đã căn giữa bản đồ bệnh viện" : "Spatial view centered on the hospital campus reference point")} className="airport-button bg-[#06111f]/76"><LocateFixed size={14} />{tr("Recenter")}</button>
      </div>

      <AnimatePresence>
        {layersOpen && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className={layersPanelClass}>
            <div className="mb-2 flex items-center justify-between"><div className="flex items-center gap-2 text-[10px] font-semibold text-white"><Layers3 size={14} className="text-cyan-300" />{tr("Data layers")}</div><span className="text-[9px] text-slate-500">{activeLayers.size} {tr("active")}</span></div>
            <div className="grid grid-cols-2 gap-1">{AIRPORT_LAYERS.map((layer) => <button key={layer} onClick={() => setActiveLayers((current) => { const next = new Set(current); next.has(layer) ? next.delete(layer) : next.add(layer); return next; })} className={`rounded-md border px-2 py-1.5 text-left text-[9px] transition ${activeLayers.has(layer) ? "border-cyan-400/25 bg-cyan-400/10 text-cyan-200" : "border-transparent bg-white/[.025] text-slate-500 hover:text-slate-300"}`}>{tr(layer)}</button>)}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {viewMode === "2d" && visibleHotspots.map((hotspot) => {
        const selectedHotspot = selected?.id === hotspot.id;
        const statusColor = hotspot.status === "critical" ? "#f87171" : hotspot.status === "warning" ? "#fbbf24" : hotspot.status === "optimized" ? "#34d399" : "#67e8f9";
        return (
          <motion.button
            key={hotspot.id}
            onMouseEnter={() => setHovered(hotspot.id)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => { setSelected(hotspot); setInfoMode("none"); setInfoExpanded(false); toast.info(`${tr("Spatial context")}: ${tr(hotspot.label)}`); }}
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
          >
            <span className="absolute inset-[-9px] rounded-full border opacity-50" style={{ borderColor: statusColor, animation: "airport-pulse-ring 2.4s ease-in-out infinite" }} />
            <span className={`relative grid h-8 w-8 place-items-center rounded-full border-2 bg-[#06111f]/88 shadow-[0_0_18px_currentColor] transition-transform ${selectedHotspot ? "scale-125" : "hover:scale-110"}`} style={{ color: statusColor, borderColor: statusColor }}>
              {hotspot.type.includes("Digital Airspace") ? <Plane size={13} /> : hotspot.module === "SAFETY" ? <ShieldAlert size={13} /> : <Box size={13} />}
            </span>
            <AnimatePresence>{hovered === hotspot.id && <motion.span initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="pointer-events-none absolute bottom-11 left-1/2 w-48 -translate-x-1/2 rounded-lg border border-white/10 bg-[#06111f]/94 p-2 text-left shadow-xl backdrop-blur-xl"><span className="block text-[10px] font-semibold text-white">{tr(hotspot.label)}</span><span className="mt-1 flex justify-between text-[9px] text-slate-400"><span>{tr(hotspot.kpis[0].label)}</span><b className="text-cyan-200">{hotspot.kpis[0].value}</b></span></motion.span>}</AnimatePresence>
          </motion.button>
        );
      })}

      <AnimatePresence>
        {selected && (
          <motion.aside initial={{ x: 350, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 350, opacity: 0 }} className="airport-scrollbar absolute bottom-20 right-3 top-14 z-50 w-80 overflow-y-auto rounded-xl border border-white/10 bg-[#06111f]/93 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-start justify-between border-b border-white/[.08] p-4"><div><p className="text-[9px] uppercase tracking-[.16em] text-cyan-300">{tr("Spatial context")} · {tr(selected.type)}</p><h3 className="mt-1 text-sm font-semibold text-white">{tr(selected.label)}</h3></div><button onClick={() => setSelected(null)} className="airport-icon-button !h-7 !w-7"><X size={14} /></button></div>
            <div className="space-y-4 p-4">
              <div className="flex items-center justify-between"><AirportStatusBadge status={selected.status} /><span className="text-[9px] uppercase text-slate-500">{tr("Severity")} {tr(selected.severity)}</span></div>
              <div className="grid grid-cols-2 gap-2">{selected.kpis.map((kpi) => <div key={kpi.label} className="rounded-lg border border-white/[.07] bg-white/[.035] p-3"><p className="text-[9px] text-slate-500">{tr(kpi.label)}</p><p className="mt-1 text-lg font-semibold text-white">{kpi.value}</p></div>)}</div>
              <div className="space-y-2 text-[10px] text-slate-400"><div className="flex justify-between"><span>{tr("Last data update")}</span><b className="text-emerald-300">{tr("6 seconds ago")}</b></div><div className="flex justify-between"><span>{tr("Linked systems")}</span><b className="text-white">7</b></div><div className="flex justify-between"><span>{tr("Mapped assets")}</span><b className="text-white">1,284</b></div><div className="flex justify-between"><span>{tr("Open work orders")}</span><b className="text-amber-300">4</b></div></div>
              <button onClick={() => onOpenModule(selected.module)} className="flex w-full items-center justify-between rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-3 py-2.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-400/15">{tr("Open related module")} <ChevronRight size={14} /></button>
              <button onClick={() => onViewModeChange("3d")} className="airport-button w-full justify-center">{tr("Focus in 3D shell")}</button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {infoMode !== "none" && !infoExpanded && (
          <motion.aside
            initial={{ x: 460, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 460, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 270 }}
            className="airport-scrollbar absolute bottom-20 right-3 top-14 z-[52] w-[420px] overflow-y-auto rounded-2xl border border-white/10 bg-[#06111f]/94 shadow-[-24px_0_80px_rgba(0,0,0,.42)] backdrop-blur-2xl"
          >
            <InfoPanelHeader mode={infoMode} expanded={false} onExpand={() => setInfoExpanded(true)} onClose={() => setInfoMode("none")} />
            <div className="p-4">
              <OverviewInfoContent
                mode={infoMode}
                expanded={false}
                flightTrend={flightTrend}
                spatialSelection={spatialSelection}
                onSpatialSelection={setSpatialSelection}
                onLocateSpatial={locateSpatialNode}
                onOpenModule={onOpenModule}
                onViewModeChange={onViewModeChange}
              />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {infoMode !== "none" && infoExpanded && (
          <>
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setInfoExpanded(false)} className="absolute inset-0 z-[88] bg-black/55 backdrop-blur-sm" aria-label={tr("Close expanded panel")} />
            <motion.section initial={{ opacity: 0, scale: .96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .96, y: 20 }} className="airport-scrollbar absolute inset-x-[6vw] bottom-24 top-12 z-[89] overflow-y-auto rounded-2xl border border-white/10 bg-[#06111f]/98 shadow-2xl backdrop-blur-2xl">
              <InfoPanelHeader mode={infoMode} expanded onExpand={() => setInfoExpanded(false)} onClose={() => { setInfoExpanded(false); setInfoMode("none"); }} />
              <div className="p-5">
                <OverviewInfoContent
                  mode={infoMode}
                  expanded
                  flightTrend={flightTrend}
                  spatialSelection={spatialSelection}
                  onSpatialSelection={setSpatialSelection}
                  onLocateSpatial={locateSpatialNode}
                  onOpenModule={onOpenModule}
                  onViewModeChange={onViewModeChange}
                />
              </div>
            </motion.section>
          </>
        )}
      </AnimatePresence>

      <div className="pointer-events-none absolute bottom-4 left-4 z-20 rounded-lg border border-white/10 bg-[#06111f]/70 px-3 py-2 text-[8px] text-slate-500 backdrop-blur-lg">HOSPITAL DIGITAL TWIN · 2D / 3D HOSPITAL COMMAND VIEW</div>
    </div>
  );
}

function InfoPanelHeader({ mode, expanded, onExpand, onClose }: {
  mode: Exclude<InfoMode, "none">;
  expanded: boolean;
  onExpand: () => void;
  onClose: () => void;
}) {
  const { tr } = useAirportLanguage();
  const title = mode === "summary" ? "Operational overview"
    : mode === "insights" ? "Operational insights"
      : mode === "hierarchy" ? "Hospital spatial hierarchy"
        : mode === "maturity" ? "Digital Twin Maturity"
          : "Operational readiness";
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[.08] bg-[#06111f]/96 px-4 py-3 backdrop-blur-2xl">
      <div><p className="text-[9px] uppercase tracking-[.18em] text-cyan-300">Hospital Digital Twin</p><h2 className="mt-1 text-sm font-semibold text-white">{tr(title)}</h2></div>
      <div className="flex gap-1"><button onClick={onExpand} className="airport-icon-button !h-8 !w-8" title={tr(expanded ? "Restore compact panel" : "Expand panel")}>{expanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}</button><button onClick={onClose} className="airport-icon-button !h-8 !w-8"><X size={15} /></button></div>
    </div>
  );
}

function OverviewInfoContent({ mode, expanded, flightTrend, spatialSelection, onSpatialSelection, onLocateSpatial, onOpenModule, onViewModeChange }: {
  mode: Exclude<InfoMode, "none">;
  expanded: boolean;
  flightTrend: ReturnType<typeof getParkTrend>;
  spatialSelection: SpatialSelection | null;
  onSpatialSelection: (selection: SpatialSelection | null) => void;
  onLocateSpatial: (selection: SpatialSelection) => void;
  onOpenModule: (module: AirportModuleId) => void;
  onViewModeChange: (mode: "2d" | "3d") => void;
}) {
  const { tr } = useAirportLanguage();

  if (mode === "summary") {
    return <div className={`grid gap-2 ${expanded ? "grid-cols-3 xl:grid-cols-5" : "grid-cols-2"}`}>{AIRPORT_OVERVIEW_KPIS.map(([label, value, trend], index) => <div key={label} className={`rounded-xl border bg-gradient-to-br p-3 ${index === 8 ? "border-red-400/25 from-red-400/10" : index > 11 ? "border-blue-400/20 from-blue-400/10" : "border-cyan-400/20 from-cyan-400/10"} to-transparent`}><p className="text-[9px] uppercase tracking-[.12em] text-slate-500">{tr(label)}</p><div className="mt-2 flex items-end justify-between gap-2"><strong className="text-xl text-white">{value}</strong><span className="text-[9px] text-cyan-200">{tr(trend)}</span></div></div>)}</div>;
  }

  if (mode === "insights") {
    return <div className={`grid gap-4 ${expanded ? "xl:grid-cols-[1.25fr_.85fr_.85fr]" : "grid-cols-1"}`}><AirportPanel title="Hospital demand & capacity" subtitle="Actual and forecast clinical and facility demand · 24 hours"><div className="p-3"><AirportTrendChart data={flightTrend} height={expanded ? 300 : 190} color="#38bdf8" /></div></AirportPanel><AirportPanel title="Live operations timeline" subtitle="Cross-domain hospital events"><div className={`${expanded ? "max-h-[340px]" : "max-h-[230px]"} airport-scrollbar overflow-auto p-3`}><AirportTimeline events={OPERATION_EVENTS} /></div></AirportPanel><AirportPanel title="Incident and readiness feed" subtitle="Prioritized response posture"><div className="space-y-2 p-3">{INCIDENTS.slice(0, expanded ? 8 : 4).map((incident, index) => <div key={incident[0]} className="rounded-lg border border-white/[.06] bg-white/[.025] p-2.5"><div className="flex items-center justify-between"><span className="font-mono text-[9px] text-cyan-300">{incident[0]}</span><AirportStatusBadge status={index === 0 ? "critical" : "warning"} label={incident[2]} /></div><p className="mt-1 text-[10px] font-medium text-white">{tr(incident[1])}</p><p className="mt-1 text-[9px] text-slate-500">{tr(incident[3])} · {incident[4]} · {tr(incident[5])}</p></div>)}</div></AirportPanel></div>;
  }

  if (mode === "maturity") {
    return <div className="space-y-4">
      <div className={`grid gap-3 ${expanded ? "xl:grid-cols-3" : "grid-cols-1"}`}>
        {[["CURRENT STATE", "L1+", "Digital Spatial Foundation", "Campus · Buildings · Floors · Rooms · Beds · BIM · CDE"], ["PROPOSED SCOPE", "L2", "Connected Monitoring", "Clinical systems · IoT · EBO · Medical gas · RTLS · CMMS"], ["TARGET EVOLUTION", "L3 → L4", "Simulation to Optimization", "Patient flow · Outage · Infection · Evacuation · Governed recommendations"]].map(([eyebrow, level, title, detail], index) => <div key={eyebrow} className={`rounded-xl border p-4 ${index === 0 ? "border-emerald-400/20 bg-emerald-400/[.05]" : index === 1 ? "border-cyan-400/25 bg-cyan-400/[.07]" : "border-violet-400/20 bg-violet-400/[.05]"}`}><p className="text-[8px] font-bold uppercase tracking-[.16em] text-slate-500">{eyebrow}</p><div className="mt-2 flex items-center justify-between"><b className="text-2xl text-white">{level}</b><AirportStatusBadge status={index === 0 ? "normal" : index === 1 ? "optimized" : "info"} /></div><h3 className="mt-3 text-xs font-semibold text-cyan-200">{title}</h3><p className="mt-2 text-[9px] leading-relaxed text-slate-400">{detail}</p></div>)}
      </div>
      <AirportPanel title="Digital Twin Maturity Level" subtitle="Clear separation between current capability, proposed delivery scope and future target"><div className={`grid gap-3 p-4 ${expanded ? "xl:grid-cols-4" : "grid-cols-1"}`}>{MATURITY_LEVELS.map(([level, name, description, state], index) => <div key={level} className={`rounded-xl border p-4 ${index === 0 ? "border-emerald-400/20 bg-emerald-400/[.05]" : index === 1 ? "border-cyan-400/25 bg-cyan-400/[.07]" : index === 2 ? "border-violet-400/20 bg-violet-400/[.05]" : "border-slate-400/15 bg-white/[.025]"}`}><div className="flex items-center justify-between"><span className="text-lg font-black text-white">{level}</span><AirportStatusBadge status={index === 0 ? "normal" : index === 1 ? "optimized" : index === 2 ? "warning" : "info"} label={state} /></div><h3 className="mt-3 text-xs font-semibold text-cyan-200">{tr(name)}</h3><p className="mt-2 text-[10px] leading-relaxed text-slate-400">{tr(description)}</p></div>)}</div></AirportPanel>
      <div className={`grid gap-4 ${expanded ? "xl:grid-cols-3" : "grid-cols-1"}`}>
        <AirportPanel title="Hospital spatial foundation"><div className="grid gap-2 p-4">{["Campus survey and existing model data", "Buildings, floors, departments and rooms", "Room data sheets and common identifiers", "BIM federation and hospital digital thread"].map((item) => <button key={item} onClick={() => onOpenModule("SPATIAL")} className="rounded-lg border border-white/[.06] bg-white/[.025] p-3 text-left hover:border-cyan-400/20"><p className="text-[10px] font-semibold text-white">{tr(item)}</p></button>)}</div></AirportPanel>
        <AirportPanel title="Priority simulation scenarios"><div className="grid gap-2 p-4">{[["Emergency surge", "Arrivals + triage + bays + staffing + beds"], ["Infectious outbreak", "Isolation + cohorting + protected routes + PPE"], ["Critical utility outage", "Affected departments, rooms, beds and contingency sources"], ["Predictive maintenance", "Medical and facility asset context with remaining useful life"]].map(([name, detail]) => <button key={name} onClick={() => onOpenModule("INTELLIGENCE")} className="rounded-lg border border-white/[.06] bg-white/[.025] p-3 text-left hover:border-violet-400/20"><p className="text-[10px] font-semibold text-white">{tr(name)}</p><p className="mt-1 text-[9px] text-slate-500">{tr(detail)}</p></button>)}</div></AirportPanel>
        <AirportPanel title="Governance guardrails"><div className="space-y-2 p-4 text-[10px] text-slate-400">{["Human approval for high-impact commands", "RBAC, MFA and complete audit trail", "Data quality and model confidence displayed", "Fallback procedures remain available", "Simulation results are decision support, not automatic truth"].map((item) => <div key={item} className="rounded-lg bg-white/[.025] px-3 py-2">✓ {tr(item)}</div>)}</div></AirportPanel>
      </div>
    </div>;
  }

  if (mode === "readiness") {
    return <div className={`grid gap-4 ${expanded ? "xl:grid-cols-[1.2fr_.8fr]" : "grid-cols-1"}`}><AirportPanel title="Hospital-wide readiness by operating domain" subtitle="Live posture, constraints and contingency readiness"><div className="space-y-2 p-3">{READINESS_DOMAINS.map(([domain, score, detail, status]) => <button key={domain} onClick={() => toast.info(`${tr(domain)} · ${score}`)} className="w-full rounded-lg border border-white/[.06] bg-white/[.025] p-3 text-left"><div className="flex items-center justify-between"><div><p className="text-[10px] font-semibold text-white">{tr(domain)}</p><p className="mt-1 text-[9px] text-slate-500">{tr(detail)}</p></div><div className="text-right"><b className="text-sm text-cyan-200">{score}</b><div className="mt-1"><AirportStatusBadge status={status} /></div></div></div></button>)}</div></AirportPanel><div className="space-y-4"><AirportPanel title="Readiness checklist" subtitle="Critical pre-operation checks"><div className="space-y-2 p-3">{READINESS_CHECKS.map(([label, result, status]) => <div key={label} className="flex items-center justify-between gap-3 rounded-lg bg-white/[.025] p-3"><div><p className="text-[10px] text-slate-200">{tr(label)}</p><p className="mt-1 text-[9px] text-slate-500">{tr(result)}</p></div><AirportStatusBadge status={status} /></div>)}</div></AirportPanel><AirportPanel title="Next operational decision"><div className="p-4"><div className="rounded-xl border border-amber-400/20 bg-amber-400/[.06] p-4"><p className="text-[10px] font-semibold text-amber-200">{tr("Emergency surge and oxygen reserve risk forecast")}</p><p className="mt-2 text-[9px] leading-relaxed text-slate-400">{tr("Open flex bays, protect critical-care capacity and keep medical gas response on enhanced monitoring.")}</p><div className="mt-3 flex gap-2"><button onClick={() => toast.success(tr("Readiness action acknowledged"))} className="airport-button !border-emerald-400/20 !bg-emerald-400/10 !text-emerald-200">{tr("Acknowledge")}</button><button onClick={() => onOpenModule("PATIENT_FLOW")} className="airport-button">{tr("Open patient flow")}</button></div></div></div></AirportPanel></div></div>;
  }

  const selectedModule = spatialSelection ? (SPATIAL_MODULE_MAP[spatialSelection.node.id] ?? SPATIAL_MODULE_MAP[spatialSelection.parent.id] ?? "OVERVIEW") : "OVERVIEW";
  const assets = spatialSelection ? stableMetric(spatialSelection.node.id, 180, 2480) : 0;
  const systems = spatialSelection ? stableMetric(`${spatialSelection.node.id}-systems`, 4, 21) : 0;
  const alerts = spatialSelection ? stableMetric(`${spatialSelection.node.id}-alerts`, 0, 8) : 0;
  const readiness = spatialSelection ? stableMetric(`${spatialSelection.node.id}-ready`, 89, 100) : 0;

  return <div className={`grid gap-4 ${expanded ? "xl:grid-cols-[1.2fr_.8fr]" : "grid-cols-1"}`}><div className={`grid gap-3 ${expanded ? "grid-cols-2 xl:grid-cols-3" : "grid-cols-1"}`}>{AIRPORT_SPATIAL_HIERARCHY.map((parent) => <section key={parent.id} className={`rounded-xl border p-3 transition ${spatialSelection?.parent.id === parent.id ? "border-cyan-400/25 bg-cyan-400/[.06]" : "border-white/[.07] bg-white/[.025]"}`}><button onClick={() => onSpatialSelection({ parent, node: parent })} className="flex w-full items-center justify-between text-left"><div><h3 className="text-xs font-semibold text-white">{tr(parent.label)}</h3><p className="mt-0.5 text-[8px] uppercase tracking-wider text-cyan-300">{tr(parent.type)}</p></div><MapPinned size={14} className="text-slate-500" /></button><div className="mt-2 space-y-1">{parent.children?.map((child) => <button key={child.id} onClick={() => onSpatialSelection({ parent, node: child })} className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-[10px] transition ${spatialSelection?.node.id === child.id ? "bg-cyan-400/10 text-cyan-200" : "text-slate-400 hover:bg-cyan-400/[.07] hover:text-cyan-200"}`}><span>{tr(child.label)}</span><ChevronRight size={11} /></button>) ?? <button onClick={() => onSpatialSelection({ parent, node: parent })} className="flex w-full items-center justify-between rounded px-2 py-1.5 text-[10px] text-slate-500 hover:bg-cyan-400/[.07] hover:text-cyan-200"><span>{tr("Open facility context")}</span><ChevronRight size={11} /></button>}</div></section>)}</div><AirportPanel title={spatialSelection ? spatialSelection.node.label : "Spatial context detail"} subtitle={spatialSelection ? `${spatialSelection.parent.label} · ${spatialSelection.node.type}` : "Select any hospital domain, department, room, bed, facility or system to open its operational context"}><div className="p-4">{spatialSelection ? <div className="space-y-4"><div className="flex items-center justify-between"><AirportStatusBadge status={alerts > 5 ? "warning" : "normal"} /><span className="text-[9px] text-slate-500">{tr("Data refreshed 6 seconds ago")}</span></div><div className="grid grid-cols-2 gap-2">{[["Mapped assets", assets.toLocaleString()], ["Linked systems", systems], ["Open alerts", alerts], ["Operational readiness", `${readiness}%`]].map(([label, value]) => <div key={String(label)} className="rounded-lg border border-white/[.06] bg-white/[.025] p-3"><p className="text-[9px] text-slate-500">{tr(String(label))}</p><p className="mt-1 text-lg font-semibold text-white">{value}</p></div>)}</div><div className="space-y-2 rounded-xl border border-white/[.06] bg-white/[.02] p-3 text-[10px]"><div className="flex justify-between"><span className="text-slate-500">{tr("Spatial path")}</span><b className="text-right text-cyan-200">{tr(spatialSelection.parent.label)} / {tr(spatialSelection.node.label)}</b></div><div className="flex justify-between"><span className="text-slate-500">{tr("Primary module")}</span><b className="text-white">{tr(selectedModule)}</b></div><div className="flex justify-between"><span className="text-slate-500">{tr("Data quality")}</span><b className="text-emerald-300">98.4%</b></div></div><div className="grid gap-2"><button onClick={() => onLocateSpatial(spatialSelection)} className="airport-button w-full justify-center"><LocateFixed size={14} />{tr("Locate on hospital overview")}</button>{selectedModule !== "OVERVIEW" && <button onClick={() => onOpenModule(selectedModule)} className="airport-button w-full justify-center"><Route size={14} />{tr("Open related module")}</button>}<button onClick={() => onViewModeChange("3d")} className="airport-button w-full justify-center"><Box size={14} />{tr("Open in 3D")}</button></div></div> : <div className="grid min-h-64 place-items-center text-center"><div><MapPinned className="mx-auto text-cyan-300" /><p className="mt-3 text-xs font-semibold text-white">{tr("Select a hospital area")}</p><p className="mt-1 text-[10px] leading-relaxed text-slate-500">{tr("The selected area reveals rooms, beds, equipment, systems, alerts, readiness and linked operational modules.")}</p></div></div>}</div></AirportPanel></div>;
}
