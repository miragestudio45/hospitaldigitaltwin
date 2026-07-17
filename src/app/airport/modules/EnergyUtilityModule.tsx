import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity, AlertTriangle, BarChart3, BellRing, BrainCircuit, Building2, Cable,
  CheckCircle2, CircleDollarSign, Cloud, Cpu, Database, Download, Droplets,
  Factory, FileBarChart, Flame, Gauge, GitBranch, Landmark, Mail, MessageCircle,
  Network, PlugZap, Radio, ReceiptText, RefreshCw, Search, Server, Settings2,
  ShieldCheck, SlidersHorizontal, Smartphone, Snowflake, Thermometer, TrendingDown,
  TrendingUp, Users, WalletCards, Waves, Webhook, Zap,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { toast } from "sonner";
import {
  AirportDetailDrawer, AirportMetricCard, AirportPanel, AirportStatusBadge,
  AirportTimeline,
} from "../shared/AirportUI";
import { useAirportLanguage } from "../i18n/AirportLanguage";
import { downloadTabularFile, type ExportFileFormat, type ExportRow } from "../../energy/exportUtils";

type Tone = "cyan" | "blue" | "emerald" | "amber" | "red" | "violet";
type Metric = [string, string, string, Tone];
type UtilityKind = "electricity" | "cold-water" | "hot-water" | "thermal" | "gas";

type Meter = {
  id: string;
  name: string;
  utility: UtilityKind;
  site: string;
  costCenter: string;
  protocol: string;
  gateway: string;
  value: string;
  quality: number;
  status: "normal" | "warning" | "offline";
  lastSeen: string;
};

type BudgetRule = {
  id: string;
  scope: string;
  metric: string;
  threshold: number;
  budget: string;
  channels: string[];
  escalation: string;
  enabled: boolean;
};

const DEFAULT_BUDGET_RULES: BudgetRule[] = [
  { id: "RULE-184", scope: "Acute Care Tower", metric: "Electricity consumption", threshold: 90, budget: "4,500,000,000", channels: ["App", "Email", "Zalo OA"], escalation: "Level 2 · Facility team · 15 min", enabled: true },
  { id: "RULE-183", scope: "Central Utility Plant", metric: "Thermal / BTU consumption", threshold: 85, budget: "2,800,000,000", channels: ["App", "Webhook"], escalation: "Level 3 · Energy manager · 30 min", enabled: true },
];

function loadBudgetRules() {
  if (typeof window === "undefined") return DEFAULT_BUDGET_RULES;
  try {
    const stored = window.localStorage.getItem("yooenergy-demo-budget-rules-v1");
    return stored ? JSON.parse(stored) as BudgetRule[] : DEFAULT_BUDGET_RULES;
  } catch {
    return DEFAULT_BUDGET_RULES;
  }
}

function loadAlertSetupCompleted() {
  if (typeof window === "undefined") return false;
  if (window.localStorage.getItem("yooenergy-demo-alert-setup-completed-v1") === "true") return true;
  try {
    const stored = window.localStorage.getItem("yooenergy-demo-budget-rules-v1");
    if (!stored) return false;
    const rules = JSON.parse(stored) as BudgetRule[];
    const defaultIds = new Set(DEFAULT_BUDGET_RULES.map((rule) => rule.id));
    return rules.some((rule) => !defaultIds.has(rule.id));
  } catch {
    return false;
  }
}

const TIME_SLOTS = Array.from({ length: 48 }, (_, index) => {
  const hour = Math.floor(index / 2);
  const minute = index % 2 === 0 ? "00" : "30";
  return `${String(hour).padStart(2, "0")}:${minute}`;
});

const UTILITY_META: Record<UtilityKind, { label: string; unit: string; icon: React.ElementType; color: string }> = {
  electricity: { label: "Electricity", unit: "kWh", icon: Zap, color: "#22d3ee" },
  "cold-water": { label: "Cold Water", unit: "m³", icon: Droplets, color: "#38bdf8" },
  "hot-water": { label: "Hot Water", unit: "m³", icon: Thermometer, color: "#fb923c" },
  thermal: { label: "Thermal & BTU", unit: "kWhₜₕ", icon: Snowflake, color: "#a78bfa" },
  gas: { label: "Gas", unit: "Nm³", icon: Flame, color: "#f59e0b" },
};

const METERS: Meter[] = [
  { id: "EM-ESS-EF03", name: "Essential Feeder EF-03", utility: "electricity", site: "Main Electrical Substation", costCenter: "Acute Care Tower", protocol: "Modbus TCP", gateway: "GW-PQ-01", value: "12.84 MW", quality: 99.8, status: "warning", lastSeen: "4 sec" },
  { id: "EM-CLN-008", name: "Clinical Services Main Meter", utility: "electricity", site: "Clinical Services Building", costCenter: "Clinical Laboratory", protocol: "BACnet/IP", gateway: "GW-CLN-02", value: "4.28 MW", quality: 99.7, status: "normal", lastSeen: "6 sec" },
  { id: "WM-DMA04", name: "DMA-04 Distribution Meter", utility: "cold-water", site: "Central Water Plant", costCenter: "Common Utility", protocol: "Modbus RTU", gateway: "GW-WTR-04", value: "418 m³/h", quality: 98.4, status: "warning", lastSeen: "11 sec" },
  { id: "HWM-HTP02", name: "Hot Water Loop HTP-02", utility: "hot-water", site: "Service Campus", costCenter: "Campus Services", protocol: "M-Bus", gateway: "GW-MBUS-02", value: "62 m³/h", quality: 99.3, status: "normal", lastSeen: "8 sec" },
  { id: "BTU-PLT01", name: "Central Cooling BTU Main", utility: "thermal", site: "Central Utility Plant", costCenter: "District Cooling", protocol: "BACnet/IP", gateway: "GW-EBO-01", value: "21.6 MWₜₕ", quality: 99.9, status: "normal", lastSeen: "3 sec" },
  { id: "BTU-WARD6B", name: "Ward 6B BTU Meter", utility: "thermal", site: "Inpatient Tower", costCenter: "Ward 6B", protocol: "M-Bus", gateway: "GW-MBUS-08", value: "648 kWₜₕ", quality: 97.8, status: "warning", lastSeen: "28 sec" },
  { id: "GAS-LAB03", name: "Laboratory Gas Main", utility: "gas", site: "Laboratory Zone", costCenter: "Dialysis Unit", protocol: "Modbus TCP", gateway: "GW-GAS-03", value: "182 Nm³/h", quality: 99.1, status: "normal", lastSeen: "9 sec" },
  { id: "EM-SOLAR-A", name: "Solar Cluster A Export", utility: "electricity", site: "Solar Cluster A", costCenter: "Hospital Utility", protocol: "MQTT", gateway: "GW-SOLAR-A", value: "6.82 MW", quality: 99.6, status: "normal", lastSeen: "5 sec" },
  { id: "EM-DIAG-01", name: "Diagnostics Main Meter", utility: "electricity", site: "Diagnostics & Treatment", costCenter: "Diagnostics Center", protocol: "Modbus TCP", gateway: "GW-Diagnostics Center", value: "2.14 MW", quality: 0, status: "offline", lastSeen: "14 min" },
];

const GATEWAYS = [
  ["GW-PQ-01", "Power Quality", "MQTT + Modbus TCP", "24", "99.99%", "4 sec", "normal"],
  ["GW-EBO-01", "EBO / BACnet", "BACnet/IP + REST", "1,842", "99.98%", "3 sec", "normal"],
  ["GW-WTR-04", "Water Network", "Modbus RTU/TCP", "186", "99.72%", "11 sec", "warning"],
  ["GW-MBUS-08", "Department Metering", "M-Bus + MQTT", "128", "98.84%", "28 sec", "warning"],
  ["GW-Diagnostics Center", "Clinical Edge", "Modbus TCP", "18", "93.2%", "14 min", "offline"],
  ["GW-SOLAR-A", "Renewables", "MQTT / Sunspec", "84", "99.96%", "5 sec", "normal"],
] as const;

const INVOICES = [
  ["INV-2026-07128", "Acute Care Tower", "Electricity + BTU", "₫4.286B", "2026-07-31", "Approved"],
  ["INV-2026-07118", "Diagnostics & Treatment", "Electricity + Water", "₫1.842B", "2026-07-31", "Review"],
  ["INV-2026-07042", "Ward 6B", "Electricity + BTU + Gas", "₫684.2M", "2026-07-31", "Draft"],
  ["INV-2026-07008", "Clinical Laboratory", "Electricity + Water", "₫428.6M", "2026-07-31", "Approved"],
  ["INV-2026-07031", "Dialysis Unit", "Electricity + Gas", "₫318.4M", "2026-07-31", "Sent"],
] as const;

const ALERT_EVENTS = [
  ["10:42", "Budget", "Acute Care Tower reached 90% monthly electricity budget", "Email + Zalo OA", "Warning"],
  ["10:36", "Water", "DMA-04 abnormal night-flow pattern detected", "App + Work order", "Warning"],
  ["10:28", "Gateway", "GW-Diagnostics Center communication timeout", "Escalated to OT", "Critical"],
  ["10:12", "Demand", "Predicted 14:00 peak above contracted demand", "Load shift recommended", "Info"],
  ["09:58", "Billing", "July billing validation completed for 18/20 departments", "Finance review", "Normal"],
] as const;

function series(seed = 1, base = 70, variance = 18, count = 48) {
  return Array.from({ length: count }, (_, index) => {
    const wave = Math.sin((index + seed) / 5) * variance;
    const peak = index > 24 && index < 38 ? variance * 0.9 : 0;
    return {
      time: TIME_SLOTS[index],
      value: Math.round((base + wave + peak + ((index * seed) % 7)) * 10) / 10,
      forecast: index > 35 ? Math.round((base + wave + peak + 5) * 10) / 10 : undefined,
    };
  });
}

export function EnergyUtilityModule({ sectionId, onNavigateSection }: { sectionId: string; onNavigateSection?: (sectionId: string) => void }) {
  const [alertEditorRequest, setAlertEditorRequest] = useState(0);
  const [alertSetupCompleted, setAlertSetupCompleted] = useState(loadAlertSetupCompleted);
  const openAlertSetup = () => {
    setAlertSetupCompleted(false);
    setAlertEditorRequest((current) => current + 1);
    if (sectionId !== "budgets-alerts") onNavigateSection?.("budgets-alerts");
  };
  const completeAlertSetup = () => {
    setAlertSetupCompleted(true);
    window.localStorage.setItem("yooenergy-demo-alert-setup-completed-v1", "true");
  };
  const content = (() => {
    switch (sectionId) {
      case "energy-command": return <EnergyCommandCenter onNavigateSection={onNavigateSection} />;
      case "electricity": return <UtilityDetail utility="electricity" />;
      case "water-utilities": return <WaterUtility />;
      case "thermal-btu": return <ThermalUtility />;
      case "gas": return <UtilityDetail utility="gas" />;
      case "meter-management": return <MeterManagement />;
      case "tenant-billing": return <CostCenterBilling />;
      case "budgets-alerts": return <BudgetAlerts openRequest={alertEditorRequest} onRuleSaved={completeAlertSetup} />;
      case "ai-analytics": return <AIAnalytics />;
      case "reports": return <ReportsCenter />;
      case "gateway-management": return <GatewayManagement />;
      case "ebo-digital-twin-integration": return <IntegrationCenter />;
      default: return <EnergyCommandCenter />;
    }
  })();
  return <div className="space-y-3">{!alertSetupCompleted && <DemoDataNotice currentSectionId={sectionId} onOpenAlertSetup={onNavigateSection ? openAlertSetup : undefined} />}{content}</div>;
}

function DemoDataNotice({ currentSectionId, onOpenAlertSetup }: { currentSectionId: string; onOpenAlertSetup?: () => void }) {
  const { language } = useAirportLanguage();
  return <div data-yooenergy-demo-notice className="flex flex-wrap items-start gap-2 rounded-lg border border-amber-300/15 bg-amber-300/[.045] px-3 py-2 text-[9px] leading-relaxed text-amber-100/75"><AlertTriangle size={13} className="mt-0.5 flex-none text-amber-300"/><span className="min-w-0 flex-1">{language === "vi" ? "Dữ liệu trình diễn: các kênh MQTT, HTTP, Modbus, BACnet, Email và Zalo OA chưa kết nối tới thiết bị hoặc dịch vụ thực tế." : "Presentation data: MQTT, HTTP, Modbus, BACnet, Email and Zalo OA channels are not connected to live field devices or services."}</span>{onOpenAlertSetup && <button type="button" onClick={onOpenAlertSetup} className="rounded-md border border-amber-200/20 bg-amber-200/[.08] px-2 py-1 font-semibold text-amber-50 transition hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-cyan-100">{currentSectionId === "budgets-alerts" ? (language === "vi" ? "Tạo rule cảnh báo" : "Create alert rule") : (language === "vi" ? "Thiết lập cảnh báo" : "Set up alert")}</button>}</div>;
}

const EXPORT_FORMAT_DETAILS: Record<ExportFileFormat, { label: string; vi: string; en: string }> = {
  xlsx: { label: "XLSX", vi: "Khuyến nghị · Phân tích và gửi nghiệp vụ", en: "Recommended · Analysis and business sharing" },
  csv: { label: "CSV", vi: "Dữ liệu bảng nhẹ · BI và data tools", en: "Lightweight table · BI and data tools" },
  json: { label: "JSON", vi: "Tích hợp API · Giữ cấu trúc dữ liệu", en: "API integration · Preserves data structure" },
  txt: { label: "TXT", vi: "Log và dữ liệu đọc nhanh", en: "Logs and quick-readable data" },
  pdf: { label: "PDF", vi: "Báo cáo trình bày và phê duyệt", en: "Presentation and approval report" },
};

function ExportFormatPicker({ value, onChange, formats }: { value: ExportFileFormat; onChange: (format: ExportFileFormat) => void; formats: ExportFileFormat[] }) {
  const { language } = useAirportLanguage();
  return <div className="grid gap-2 sm:grid-cols-2">{formats.map((format) => { const detail = EXPORT_FORMAT_DETAILS[format]; const active = value === format; return <button type="button" key={format} onClick={() => onChange(format)} className={`relative rounded-xl border p-3 text-left transition ${active ? "border-cyan-300/35 bg-cyan-300/10 shadow-[0_0_20px_rgba(34,211,238,.12)]" : "border-white/[.07] bg-white/[.025] hover:border-cyan-300/20 hover:bg-cyan-300/[.04]"}`}><div className="flex items-center justify-between gap-3"><span className={`text-[11px] font-bold ${active ? "text-cyan-100" : "text-slate-300"}`}>{detail.label}</span>{format === "xlsx" && <span className="rounded-full bg-emerald-300/10 px-2 py-0.5 text-[8px] font-semibold text-emerald-300">{language === "vi" ? "Khuyên dùng" : "Recommended"}</span>}</div><p className="mt-1 text-[9px] leading-relaxed text-slate-500">{language === "vi" ? detail.vi : detail.en}</p></button>})}</div>;
}

function EnergyCommandCenter({ onNavigateSection }: { onNavigateSection?: (sectionId: string) => void }) {
  const { language } = useAirportLanguage();
  const [selectedUtility, setSelectedUtility] = useState<UtilityKind>("electricity");
  const [range, setRange] = useState("Today");
  const meta = UTILITY_META[selectedUtility];
  const data = useMemo(() => series(selectedUtility.length, selectedUtility === "electricity" ? 62 : 38, 12), [selectedUtility]);
  const portfolio = [
    { name: "Electricity", value: 52, amount: "42.8 MW", color: "#22d3ee" },
    { name: "Thermal", value: 24, amount: "21.6 MWₜₕ", color: "#a78bfa" },
    { name: "Water", value: 14, amount: "18,420 m³/d", color: "#38bdf8" },
    { name: "Gas", value: 10, amount: "4,860 Nm³/d", color: "#f59e0b" },
  ];
  return <div className="space-y-4">
    <MetricGrid metrics={[
      ["Portfolio cost MTD", "₫18.42B", "+4.8% vs budget", "amber"],
      ["Electricity demand", "42.8 MW", "Peak 48.2 MW", "blue"],
      ["Thermal demand", "21.6 MWₜₕ", "COP 5.82", "violet"],
      ["Water consumption", "18,420 m³/d", "NRW 6.8%", "cyan"],
      ["Carbon emissions", "4,286 tCO₂e", "-6.2% YoY", "emerald"],
      ["Meters online", "2,486 / 2,504", "99.28%", "cyan"],
    ]} />

    <div className="grid gap-4 2xl:grid-cols-[1.4fr_.6fr]">
      <AirportPanel title={language === "vi" ? "Trung tâm chỉ huy năng lượng & tiện ích" : "Energy & utility command center"} subtitle={language === "vi" ? "Theo dõi trực tiếp, dự báo, ngân sách và mức phát thải toàn khu" : "Live monitoring, forecast, budget and emissions across the hospital campus"} action={<select className="airport-select" value={range} onChange={(event) => setRange(event.target.value)}>{["Live", "Today", "7 Days", "30 Days", "1 Year"].map((item) => <option key={item}>{item}</option>)}</select>}>
        <div className="p-4">
          <div className="mb-4 flex flex-wrap gap-2">
            {(Object.keys(UTILITY_META) as UtilityKind[]).map((key) => {
              const item = UTILITY_META[key]; const Icon = item.icon; const active = key === selectedUtility;
              return <button key={key} onClick={() => setSelectedUtility(key)} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[10px] font-semibold transition ${active ? "border-cyan-300/30 bg-cyan-300/12 text-cyan-100" : "border-white/[.07] bg-white/[.025] text-slate-500 hover:text-white"}`}><Icon size={14} />{item.label}</button>;
            })}
          </div>
          <div className="h-[310px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data}><defs><linearGradient id="energy-main" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={meta.color} stopOpacity={.38}/><stop offset="100%" stopColor={meta.color} stopOpacity={.02}/></linearGradient></defs><CartesianGrid stroke="rgba(148,163,184,.08)" vertical={false}/><XAxis dataKey="time" tick={{ fill: "#64748b", fontSize: 9 }} minTickGap={25} axisLine={false}/><YAxis tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false}/><Tooltip contentStyle={{ background: "#071426", border: "1px solid rgba(103,232,249,.22)", borderRadius: 10, fontSize: 11 }} itemStyle={{ color: "#67e8f9" }} labelStyle={{ color: "#f8fafc" }}/><Area dataKey="value" type="monotone" stroke={meta.color} strokeWidth={2} fill="url(#energy-main)"/><Area dataKey="forecast" type="monotone" stroke="#a78bfa" strokeDasharray="4 4" fill="transparent"/></AreaChart></ResponsiveContainer></div>
          <div className="mt-3 flex items-center justify-between rounded-lg border border-white/[.06] bg-white/[.025] px-3 py-2 text-[9px] text-slate-500"><span>{meta.label} · {range}</span><span className="text-cyan-300">Forecast confidence 93.8%</span><span>{meta.unit}</span></div>
        </div>
      </AirportPanel>

      <AirportPanel title={language === "vi" ? "Cơ cấu chi phí tiện ích" : "Utility cost allocation"}>
        <div className="p-4">
          <div className="h-[210px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={portfolio} dataKey="value" nameKey="name" innerRadius={58} outerRadius={86} paddingAngle={3}>{portfolio.map((item) => <Cell key={item.name} fill={item.color}/>)}</Pie><Tooltip contentStyle={{ background: "#071426", border: "1px solid rgba(103,232,249,.22)", borderRadius: 10 }} itemStyle={{ color: "#67e8f9", fontWeight: 600 }} labelStyle={{ color: "#f8fafc" }}/></PieChart></ResponsiveContainer></div>
          <div className="space-y-2">{portfolio.map((item) => <div key={item.name} className="flex items-center justify-between rounded-lg border border-white/[.06] bg-white/[.02] px-3 py-2"><span className="flex items-center gap-2 text-[10px] text-slate-300"><span className="h-2 w-2 rounded-full" style={{ background: item.color }}/>{item.name}</span><span className="text-[10px] font-semibold text-white">{item.amount}</span></div>)}</div>
        </div>
      </AirportPanel>
    </div>

    <div className="grid gap-4 xl:grid-cols-3">
      <AirportPanel title={language === "vi" ? "Sức khỏe vận hành" : "Operational health"}><div className="grid grid-cols-2 gap-2 p-3">{[
        ["Gateways", "284 / 286", "normal"], ["Data freshness", "6 sec", "normal"], ["Meters offline", "18", "warning"], ["Validation issues", "42", "warning"], ["Billing ready", "184 / 186", "normal"], ["Open anomalies", "12", "warning"],
      ].map(([label, value, status]) => <div key={label} className="rounded-lg border border-white/[.06] bg-white/[.025] p-3"><p className="text-[9px] text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold text-white">{value}</p><div className="mt-2"><AirportStatusBadge status={status as "normal" | "warning"}/></div></div>)}</div></AirportPanel>
      <AirportPanel title={language === "vi" ? "Khuyến nghị ưu tiên" : "Priority recommendations"}><div className="space-y-2 p-3">{[
        ["Shift 2.4 MW non-critical load before 14:00 peak", "₫128M/month", "emerald"],
        ["Inspect DMA-04 for probable night-flow leakage", "420 m³/day", "amber"],
        ["Correct BTU low ΔT at Ward 6B", "+7.8% efficiency", "cyan"],
        ["Recover GW-Diagnostics Center communication", "18 meters affected", "red"],
      ].map(([title, impact, tone]) => <button key={title} onClick={() => toast.info(title)} className="w-full rounded-lg border border-white/[.06] bg-white/[.025] p-3 text-left hover:border-cyan-300/20"><div className="flex items-start justify-between gap-3"><p className="text-[10px] text-slate-300">{title}</p><BrainCircuit size={14} className="text-violet-300"/></div><p className={`mt-2 text-[9px] ${tone === "red" ? "text-red-300" : tone === "amber" ? "text-amber-300" : tone === "emerald" ? "text-emerald-300" : "text-cyan-300"}`}>{impact}</p></button>)}</div></AirportPanel>
      <AirportPanel title={language === "vi" ? "Sự kiện trực tiếp" : "Live event stream"}><div className="p-3"><AirportTimeline events={ALERT_EVENTS}/>{onNavigateSection && <button type="button" onClick={() => onNavigateSection("budgets-alerts")} className="airport-button mt-3 w-full justify-center"><BellRing size={14}/>{language === "vi" ? "Quản lý cảnh báo & ngân sách" : "Manage alerts & budgets"}</button>}</div></AirportPanel>
    </div>
  </div>;
}

function UtilityDetail({ utility }: { utility: UtilityKind }) {
  const { language } = useAirportLanguage();
  const meta = UTILITY_META[utility];
  const Icon = meta.icon;
  const [range, setRange] = useState("24 Hours");
  const data = useMemo(() => series(utility.length + range.length, utility === "electricity" ? 68 : 34, utility === "gas" ? 8 : 14), [utility, range]);
  const utilityMeters = METERS.filter((meter) => meter.utility === utility);
  const metrics: Metric[] = utility === "electricity" ? [
    ["Active power", "42.8 MW", "+2.4 MW", "blue"], ["Energy today", "684.2 MWh", "+4.2%", "cyan"], ["Peak demand", "48.2 MW", "14:00 forecast", "amber"], ["Power factor", "0.97", "Optimized", "emerald"], ["THD average", "3.1%", "Target <5%", "emerald"], ["Carbon intensity", "0.618 kg/kWh", "-5.4%", "cyan"],
  ] : utility === "gas" ? [
    ["Flow rate", "182 Nm³/h", "+2.8%", "amber"], ["Consumption today", "4,860 Nm³", "On budget", "cyan"], ["Line pressure", "3.8 bar", "Stable", "emerald"], ["Estimated cost", "₫86.4M", "+1.4%", "amber"], ["Leak alarms", "0", "Normal", "emerald"], ["Meters online", "84 / 84", "100%", "cyan"],
  ] : [
    ["Current flow", "418 m³/h", "+3.4%", "cyan"], ["Consumption today", "18,420 m³", "+2.1%", "blue"], ["Network pressure", "4.2 bar", "Stable", "emerald"], ["Non-revenue water", "6.8%", "-0.4 pt", "emerald"], ["Cost MTD", "₫2.14B", "+1.8%", "amber"], ["Leak anomalies", "4", "Investigate", "amber"],
  ];
  return <div className="space-y-4">
    <MetricGrid metrics={metrics}/>
    <div className="grid gap-4 2xl:grid-cols-[1.4fr_.6fr]">
      <AirportPanel title={`${meta.label} live profile`} subtitle={language === "vi" ? "Giá trị thời gian thực, xu hướng và dự báo tải" : "Real-time values, trend and load forecast"} action={<select className="airport-select" value={range} onChange={(event) => setRange(event.target.value)}>{["Live", "24 Hours", "7 Days", "30 Days", "1 Year"].map((item) => <option key={item}>{item}</option>)}</select>}>
        <div className="p-4"><div className="mb-4 flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300"><Icon size={22}/></span><div><p className="text-sm font-semibold text-white">Park-wide {meta.label}</p><p className="text-[9px] text-slate-500">Actual + forecast · {meta.unit}</p></div></div><div className="h-[320px]"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={data}><CartesianGrid stroke="rgba(148,163,184,.08)" vertical={false}/><XAxis dataKey="time" tick={{ fill: "#64748b", fontSize: 9 }} minTickGap={26}/><YAxis tick={{ fill: "#64748b", fontSize: 9 }}/><Tooltip contentStyle={{ background: "#071426", border: "1px solid rgba(103,232,249,.22)", borderRadius: 10 }} itemStyle={{ color: "#67e8f9" }} labelStyle={{ color: "#f8fafc" }}/><Bar dataKey="value" fill={meta.color} opacity={.22} radius={[3,3,0,0]}/><Line dataKey="value" type="monotone" stroke={meta.color} strokeWidth={2} dot={false}/><Line dataKey="forecast" type="monotone" stroke="#a78bfa" strokeDasharray="4 4" dot={false}/></ComposedChart></ResponsiveContainer></div></div>
      </AirportPanel>
      <AirportPanel title={language === "vi" ? "Điểm đo ưu tiên" : "Priority metering points"}><div className="space-y-2 p-3">{(utilityMeters.length ? utilityMeters : METERS.slice(0, 5)).map((meter) => <button key={meter.id} onClick={() => toast.info(`${meter.id} detail opened`)} className="w-full rounded-lg border border-white/[.06] bg-white/[.025] p-3 text-left"><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-semibold text-cyan-200">{meter.id}</span><AirportStatusBadge status={meter.status}/></div><p className="mt-2 text-[10px] text-white">{meter.name}</p><div className="mt-2 flex items-center justify-between text-[9px] text-slate-500"><span>{meter.site}</span><b className="text-slate-300">{meter.value}</b></div></button>)}</div></AirportPanel>
    </div>
    <AirportPanel title={language === "vi" ? "Phân tích hiệu suất và chi phí" : "Performance and cost analysis"}><div className="grid grid-cols-2 gap-3 p-4 xl:grid-cols-4">{[
      ["Baseline", utility === "electricity" ? "38.6 MW" : "92%", "Previous 30-day model"], ["Actual", utility === "electricity" ? "42.8 MW" : "101%", "Current operation"], ["Avoidable waste", utility === "electricity" ? "2.4 MW" : "3.8%", "AI opportunity"], ["Estimated saving", utility === "electricity" ? "₫128M/mo" : "₫42M/mo", "Recommended actions"],
    ].map(([label, value, detail]) => <div key={label} className="rounded-xl border border-cyan-400/12 bg-cyan-400/[.035] p-4"><p className="text-[9px] uppercase tracking-[.14em] text-slate-500">{label}</p><p className="mt-2 text-xl font-semibold text-white">{value}</p><p className="mt-2 text-[9px] text-slate-600">{detail}</p></div>)}</div></AirportPanel>
  </div>;
}

function WaterUtility() {
  const [mode, setMode] = useState<"cold-water" | "hot-water">("cold-water");
  return <div className="space-y-4"><div className="flex gap-2"><button onClick={() => setMode("cold-water")} className={`airport-button ${mode === "cold-water" ? "!border-cyan-300/30 !bg-cyan-300/10 !text-cyan-100" : ""}`}><Droplets size={14}/>Cold Water</button><button onClick={() => setMode("hot-water")} className={`airport-button ${mode === "hot-water" ? "!border-orange-300/30 !bg-orange-300/10 !text-orange-100" : ""}`}><Thermometer size={14}/>Hot Water</button></div><UtilityDetail utility={mode}/></div>;
}

function ThermalUtility() {
  const [selectedPlant, setSelectedPlant] = useState("Central Utility Plant");
  const data = series(7, 58, 10);
  return <div className="space-y-4">
    <MetricGrid metrics={[["Cooling demand","21.6 MWₜₕ","+4.2%","violet"],["Plant COP","5.82","Target >5.5","emerald"],["Chilled-water ΔT","5.8°C","Target 6.0","amber"],["Supply / Return","6.8 / 12.6°C","Stable","cyan"],["BTU meters online","486 / 492","98.8%","cyan"],["Low-ΔT cost centers","8","Review","amber"]]}/>
    <div className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
      <AirportPanel title="District cooling and BTU performance" action={<select className="airport-select" value={selectedPlant} onChange={(event) => setSelectedPlant(event.target.value)}>{["Central Utility Plant","Plant North","Plant South"].map((item) => <option key={item}>{item}</option>)}</select>}><div className="p-4"><div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={data}><CartesianGrid stroke="rgba(148,163,184,.08)" vertical={false}/><XAxis dataKey="time" tick={{fill:"#64748b",fontSize:9}} minTickGap={24}/><YAxis tick={{fill:"#64748b",fontSize:9}}/><Tooltip contentStyle={{background:"#071426",border:"1px solid rgba(103,232,249,.22)",borderRadius:10}} itemStyle={{color:"#67e8f9"}} labelStyle={{color:"#f8fafc"}}/><Bar dataKey="value" fill="#a78bfa" opacity={.24}/><Line dataKey="value" stroke="#c4b5fd" strokeWidth={2} dot={false}/></ComposedChart></ResponsiveContainer></div></div></AirportPanel>
      <AirportPanel title="BTU balance and low-ΔT diagnostics"><div className="space-y-2 p-3">{[
        ["Ward 6B", "ΔT 3.8°C", "648 kWₜₕ", "warning"], ["Diagnostics Center", "ΔT 4.2°C", "1.28 MWₜₕ", "warning"], ["Acute Care Tower", "ΔT 6.4°C", "8.42 MWₜₕ", "normal"], ["Clinical Services", "ΔT 5.9°C", "2.86 MWₜₕ", "normal"], ["Common Areas", "ΔT 5.2°C", "1.04 MWₜₕ", "normal"],
      ].map(([costCenter, dt, load, status]) => <div key={costCenter} className="rounded-lg border border-white/[.06] bg-white/[.025] p-3"><div className="flex justify-between"><span className="text-[10px] font-semibold text-white">{costCenter}</span><AirportStatusBadge status={status as "normal"|"warning"}/></div><div className="mt-2 flex justify-between text-[9px] text-slate-500"><span>{dt}</span><span>{load}</span></div></div>)}</div></AirportPanel>
    </div>
    <AirportPanel title="BTU calculation chain"><div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-3 xl:grid-cols-5">{[
      ["Flow", "m³/h", Waves], ["Supply temperature", "°C", Thermometer], ["Return temperature", "°C", Thermometer], ["Thermal power", "kWₜₕ", Activity], ["Accumulated energy", "kWhₜₕ", Database],
    ].map(([label, unit, Icon], index) => <div key={String(label)} className="relative rounded-xl border border-violet-400/14 bg-violet-400/[.04] p-4"><Icon size={18} className="text-violet-300"/><p className="mt-3 text-[10px] font-semibold text-white">{String(label)}</p><p className="mt-1 text-[9px] text-slate-500">{String(unit)}</p>{index < 4 && <GitBranch size={16} className="absolute -right-4 top-1/2 text-violet-300/50"/>}</div>)}</div></AirportPanel>
  </div>;
}

function MeterManagement() {
  const { language } = useAirportLanguage();
  const [search, setSearch] = useState("");
  const [utility, setUtility] = useState<"all" | UtilityKind>("all");
  const [selected, setSelected] = useState<Meter | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFileFormat>("xlsx");
  const rows = METERS.filter((meter) => (utility === "all" || meter.utility === utility) && `${meter.id} ${meter.name} ${meter.costCenter}`.toLowerCase().includes(search.toLowerCase()));
  const exportRows: ExportRow[] = rows.map((meter) => ({
    "Meter ID": meter.id,
    Name: meter.name,
    Utility: UTILITY_META[meter.utility].label,
    Site: meter.site,
    "Cost center": meter.costCenter,
    Protocol: meter.protocol,
    Gateway: meter.gateway,
    "Current value": meter.value,
    "Data quality (%)": meter.quality,
    "Last seen": meter.lastSeen,
    Status: meter.status,
  }));
  const exportMeters = () => {
    try {
      const fileName = downloadTabularFile({ baseName: `yooenergy-meter-registry-${new Date().toISOString().slice(0, 10)}`, sheetName: "Meter Registry", rows: exportRows, format: exportFormat });
      setExportOpen(false);
      toast.success(`${language === "vi" ? "Đã tải xuống" : "Downloaded"} ${fileName}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    }
  };
  return <div className="space-y-4">
    <MetricGrid metrics={[["Metering points","2,504","5 utility types","cyan"],["Online","2,486","99.28%","emerald"],["Data validated","97.8%","42 flags","blue"],["Virtual meters","184","Calculated","violet"],["Calibration due","28","30 days","amber"],["Unmapped cost centers","6","Action required","red"]]}/>
    <AirportPanel title={language === "vi" ? "Danh mục đồng hồ & điểm đo" : "Meter and measurement-point registry"} action={<button className="airport-button" onClick={() => toast.success("New meter onboarding workflow opened")}><Settings2 size={14}/>Onboard meter</button>}>
      <div className="border-b border-white/[.06] p-3"><div className="flex flex-wrap gap-2"><label className="flex min-w-64 flex-1 items-center gap-2 rounded-lg border border-white/[.08] bg-white/[.03] px-3 py-2"><Search size={14} className="text-slate-500"/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search meter, cost center or site…" className="w-full bg-transparent text-xs text-white outline-none"/></label><select className="airport-select" value={utility} onChange={(event) => setUtility(event.target.value as "all"|UtilityKind)}><option value="all">All utilities</option>{(Object.keys(UTILITY_META) as UtilityKind[]).map((key) => <option key={key} value={key}>{UTILITY_META[key].label}</option>)}</select><button data-open-meter-export type="button" onClick={() => setExportOpen(true)} className="airport-button !border-cyan-300/25 !bg-cyan-300/[.08] !font-semibold !text-cyan-100"><Download size={14} className="text-cyan-300"/>{language === "vi" ? "Xuất dữ liệu" : "Export"}</button></div></div>
      <div className="airport-scrollbar overflow-x-auto"><table className="w-full min-w-[1180px] text-left"><thead className="sticky top-0 bg-[#08172a]"><tr>{["Meter ID","Name","Utility","Site / Cost center","Protocol","Gateway","Live value","Quality","Last seen","Status"].map((header) => <th key={header} className="px-3 py-3 text-[8px] uppercase tracking-[.1em] text-slate-500">{header}</th>)}</tr></thead><tbody>{rows.map((meter) => <tr key={meter.id} onClick={() => setSelected(meter)} className="cursor-pointer border-t border-white/[.05] hover:bg-cyan-400/[.035]"><td className="px-3 py-3 text-[10px] font-semibold text-cyan-300">{meter.id}</td><td className="px-3 py-3 text-[10px] text-white">{meter.name}</td><td className="px-3 py-3 text-[10px] text-slate-400">{UTILITY_META[meter.utility].label}</td><td className="px-3 py-3"><p className="text-[10px] text-slate-300">{meter.site}</p><p className="text-[9px] text-slate-600">{meter.costCenter}</p></td><td className="px-3 py-3 text-[10px] text-slate-400">{meter.protocol}</td><td className="px-3 py-3 text-[10px] text-slate-400">{meter.gateway}</td><td className="px-3 py-3 text-[10px] font-semibold text-white">{meter.value}</td><td className="px-3 py-3 text-[10px] text-slate-300">{meter.quality}%</td><td className="px-3 py-3 text-[10px] text-slate-500">{meter.lastSeen}</td><td className="px-3 py-3"><AirportStatusBadge status={meter.status}/></td></tr>)}</tbody></table></div>
    </AirportPanel>
    <AirportDetailDrawer open={exportOpen} title={language === "vi" ? "Xuất danh mục đồng hồ" : "Export meter registry"} subtitle={`${rows.length} ${language === "vi" ? "bản ghi theo bộ lọc hiện tại" : "records from the current filter"}`} onClose={() => setExportOpen(false)}><div className="space-y-4"><div className="rounded-xl border border-cyan-300/14 bg-cyan-300/[.045] p-4"><p className="text-[10px] font-semibold text-white">{language === "vi" ? "Chọn định dạng file" : "Choose a file format"}</p><p className="mt-1 text-[9px] leading-relaxed text-slate-500">{language === "vi" ? "XLSX phù hợp nhất cho nghiệp vụ. CSV dùng cho BI, JSON cho tích hợp và TXT cho log." : "XLSX is best for business use. Choose CSV for BI, JSON for integrations or TXT for logs."}</p></div><ExportFormatPicker value={exportFormat} onChange={setExportFormat} formats={["xlsx","csv","json","txt"]}/><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setExportOpen(false)} className="airport-button w-full justify-center">{language === "vi" ? "Hủy" : "Cancel"}</button><button data-confirm-meter-export type="button" onClick={exportMeters} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-100/30 bg-gradient-to-r from-cyan-300 to-sky-400 px-3 py-2.5 text-[10px] font-bold text-slate-950 shadow-[0_0_22px_rgba(34,211,238,.24)] transition hover:brightness-110"><Download size={14}/>{language === "vi" ? `Tải ${exportFormat.toUpperCase()}` : `Download ${exportFormat.toUpperCase()}`}</button></div></div></AirportDetailDrawer>
    <AirportDetailDrawer open={Boolean(selected)} title={selected?.name ?? "Meter detail"} subtitle={selected?.id} onClose={() => setSelected(null)}>{selected && <div className="space-y-4"><div className="grid grid-cols-2 gap-2">{[["Utility",UTILITY_META[selected.utility].label],["Current value",selected.value],["Protocol",selected.protocol],["Gateway",selected.gateway],["Cost center",selected.costCenter],["Data quality",`${selected.quality}%`]].map(([label,value]) => <div key={label} className="rounded-lg border border-white/[.06] bg-white/[.025] p-3"><p className="text-[9px] text-slate-500">{label}</p><p className="mt-1 text-[11px] font-semibold text-white">{value}</p></div>)}</div><AirportPanel title="Meter data chain"><div className="space-y-2 p-3">{["Physical meter / analyzer","Edge gateway and buffering","Protocol normalization","Time-series validation","Tariff and billing engine","Digital Twin / EBO / cost center portal"].map((item,index) => <div key={item} className="flex items-center gap-3 rounded-lg border border-cyan-400/10 bg-cyan-400/[.035] p-3"><span className="grid h-7 w-7 place-items-center rounded-full bg-cyan-400/10 text-[10px] font-bold text-cyan-300">{index+1}</span><span className="text-[10px] text-slate-300">{item}</span></div>)}</div></AirportPanel><button onClick={() => toast.success("Diagnostic command queued with audit trail")} className="airport-button w-full justify-center"><RefreshCw size={14}/>Run diagnostics</button></div>}</AirportDetailDrawer>
  </div>;
}

function CostCenterBilling() {
  const { language } = useAirportLanguage();
  const [costCenter, setCostCenter] = useState("Acute Care Tower");
  const [period, setPeriod] = useState("July 2026");
  const [previewOpen, setPreviewOpen] = useState(false);
  const chargeItems = [
    ["Electricity energy charge", "684,220 kWh", "₫1,842/kWh", "₫1.260B"],
    ["Peak demand charge", "12.84 MW", "₫128M/MW", "₫1.644B"],
    ["Thermal / BTU charge", "286,420 kWhₜₕ", "₫2,840/kWhₜₕ", "₫813.4M"],
    ["Water charge", "18,420 m³", "₫18,200/m³", "₫335.2M"],
    ["Common utility allocation", "8.4% share", "Portfolio pool", "₫126.8M"],
    ["Tax and adjustments", "VAT + reconciliation", "Approved", "₫106.6M"],
  ];
  const downloadStatement = () => {
    const statementRows: ExportRow[] = chargeItems.map(([item, quantity, tariff, amount]) => ({ Item: item, Quantity: quantity, "Tariff / Rule": tariff, Amount: amount }));
    const fileName = downloadTabularFile({ baseName: `utility-statement-${costCenter}-${period}`, sheetName: `${costCenter} ${period}`, rows: statementRows, format: "pdf" });
    toast.success(`${language === "vi" ? "Đã tải xuống" : "Downloaded"} ${fileName}`);
  };
  return <div className="space-y-4">
    <MetricGrid metrics={[["Billing cost centers","186","184 validated","cyan"],["Statements MTD","184","98.9%","emerald"],["Gross utility charge","₫42.86B","July 2026","blue"],["Pending review","2","Diagnostics Center / Ward 6B","amber"],["Collection rate","97.4%","+0.8 pt","emerald"],["Adjustments","₫284M","0.66%","cyan"]]}/>
    <div className="grid gap-4 2xl:grid-cols-[1.25fr_.75fr]">
      <AirportPanel title={language === "vi" ? "Bảng phân bổ chi phí tiện ích" : "Hospital utility allocation statement"} action={<div className="flex gap-2"><select className="airport-select" value={costCenter} onChange={(event) => setCostCenter(event.target.value)}>{["Acute Care Tower","Diagnostics & Treatment","Ward 6B","Clinical Laboratory","Dialysis Unit"].map((item) => <option key={item}>{item}</option>)}</select><select className="airport-select" value={period} onChange={(event) => setPeriod(event.target.value)}>{["July 2026","June 2026","May 2026"].map((item) => <option key={item}>{item}</option>)}</select></div>}>
        <div className="p-4"><div className="mb-4 flex items-start justify-between rounded-xl border border-cyan-400/14 bg-gradient-to-r from-cyan-400/[.07] to-transparent p-4"><div><p className="text-[9px] uppercase tracking-[.16em] text-cyan-300">{costCenter} · {period}</p><h3 className="mt-2 text-lg font-semibold text-white">Total payable · ₫4.286B</h3><p className="mt-1 text-[10px] text-slate-500">Due 31 July 2026 · Statement INV-2026-07128</p></div><ReceiptText size={28} className="text-cyan-300"/></div><div className="overflow-hidden rounded-xl border border-white/[.07]"><table className="w-full"><thead className="bg-white/[.035]"><tr>{["Charge item","Quantity","Tariff / Rule","Amount"].map((header) => <th key={header} className="px-3 py-3 text-left text-[8px] uppercase tracking-[.1em] text-slate-500">{header}</th>)}</tr></thead><tbody>{chargeItems.map((row) => <tr key={row[0]} className="border-t border-white/[.05]"><td className="px-3 py-3 text-[10px] text-white">{row[0]}</td><td className="px-3 py-3 text-[10px] text-slate-400">{row[1]}</td><td className="px-3 py-3 text-[10px] text-slate-400">{row[2]}</td><td className="px-3 py-3 text-[10px] font-semibold text-cyan-200">{row[3]}</td></tr>)}</tbody></table></div><div className="mt-4 flex justify-end gap-2"><button onClick={() => toast.info("Billing validation report opened")} className="airport-button"><ShieldCheck size={14}/>Validate</button><button onClick={() => setPreviewOpen(true)} className="airport-button"><FileBarChart size={14}/>Preview statement</button><button onClick={() => toast.success("Statement approved and queued for notification")} className="airport-button !border-emerald-400/25 !bg-emerald-400/10 !text-emerald-200"><CheckCircle2 size={14}/>Approve</button></div></div>
      </AirportPanel>
      <AirportPanel title={language === "vi" ? "Biểu giá và quy tắc phân bổ" : "Tariff and allocation rules"}><div className="space-y-3 p-4">{[
        ["Peak electricity", "09:30–11:30 · 17:00–20:00", "₫3,452/kWh"], ["Normal electricity", "04:00–09:30 · 11:30–17:00", "₫1,842/kWh"], ["Off-peak electricity", "22:00–04:00", "₫1,126/kWh"], ["BTU district cooling", "Energy + demand component", "₫2,840/kWhₜₕ"], ["Common-area allocation", "Area + occupancy weighted", "8.4% share"],
      ].map(([name,rule,value]) => <div key={name} className="rounded-lg border border-white/[.06] bg-white/[.025] p-3"><div className="flex justify-between gap-2"><span className="text-[10px] font-semibold text-white">{name}</span><span className="text-[10px] text-cyan-300">{value}</span></div><p className="mt-1 text-[9px] text-slate-500">{rule}</p></div>)}<button onClick={() => toast.info("Tariff version editor opened")} className="airport-button w-full justify-center"><Settings2 size={14}/>Manage tariff versions</button></div></AirportPanel>
    </div>
    <AirportPanel title="Billing workflow and statement status"><div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-3 xl:grid-cols-5">{[
      ["Meter readings","2,486 validated",Database],["Consumption calculation","18 cost centers",Activity],["Tariff engine","12 active versions",CircleDollarSign],["Approval","2 pending",ShieldCheck],["Notification","App · Email · Zalo",BellRing],
    ].map(([label,detail,Icon],index) => <div key={String(label)} className="relative rounded-xl border border-cyan-400/12 bg-cyan-400/[.035] p-4"><Icon size={18} className="text-cyan-300"/><p className="mt-3 text-[10px] font-semibold text-white">{String(label)}</p><p className="mt-1 text-[9px] text-slate-500">{String(detail)}</p>{index<4&&<GitBranch size={16} className="absolute -right-4 top-1/2 text-cyan-300/45"/>}</div>)}</div></AirportPanel>
    <AirportDetailDrawer open={previewOpen} title="Utility statement preview" subtitle={`${costCenter} · ${period}`} onClose={() => setPreviewOpen(false)}><div className="space-y-4"><div className="rounded-xl border border-cyan-400/15 bg-gradient-to-br from-cyan-400/[.08] to-transparent p-5"><p className="text-[9px] uppercase tracking-[.16em] text-cyan-300">Amount due</p><p className="mt-2 text-3xl font-semibold text-white">₫4.286B</p><p className="mt-2 text-[10px] text-slate-500">Due 31 July 2026</p></div>{chargeItems.map((row) => <div key={row[0]} className="flex justify-between border-b border-white/[.06] py-2 text-[10px]"><span className="text-slate-400">{row[0]}</span><span className="font-semibold text-white">{row[3]}</span></div>)}<button data-download-statement-pdf type="button" onClick={downloadStatement} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-100/30 bg-gradient-to-r from-cyan-300 to-sky-400 px-3 py-2.5 text-[10px] font-bold text-slate-950 shadow-[0_0_22px_rgba(34,211,238,.24)] transition hover:brightness-110"><Download size={14}/>{language === "vi" ? "Tải PDF" : "Download PDF"}</button></div></AirportDetailDrawer>
  </div>;
}

function BudgetAlerts({ openRequest, onRuleSaved }: { openRequest: number; onRuleSaved: () => void }) {
  const { language } = useAirportLanguage();
  const [scope, setScope] = useState("Acute Care Tower");
  const [metric, setMetric] = useState("Electricity consumption");
  const [threshold, setThreshold] = useState(90);
  const [budget, setBudget] = useState("4,500,000,000");
  const [channels, setChannels] = useState(["App", "Email", "Zalo OA"]);
  const [escalation, setEscalation] = useState("Level 2 · Facility team · 15 min");
  const [savedRules, setSavedRules] = useState<BudgetRule[]>(loadBudgetRules);
  const [editorOpen, setEditorOpen] = useState(false);
  const [lastSavedRule, setLastSavedRule] = useState<string | null>(null);
  const toggle = (channel: string) => setChannels((current) => current.includes(channel) ? current.filter((item) => item !== channel) : [...current, channel]);
  useEffect(() => { window.localStorage.setItem("yooenergy-demo-budget-rules-v1", JSON.stringify(savedRules)); }, [savedRules]);
  const openEditor = () => {
    setLastSavedRule(null);
    setEditorOpen(true);
    window.setTimeout(() => {
      const editor = document.querySelector<HTMLElement>("[data-budget-rule-editor]");
      editor?.scrollIntoView({ behavior: "smooth", block: "start" });
      editor?.querySelector<HTMLElement>("[data-budget-scope]")?.focus();
    }, 80);
  };
  useEffect(() => {
    if (openRequest > 0) openEditor();
  }, [openRequest]);
  const saveRule = () => {
    if (!budget.trim() || channels.length === 0) {
      toast.error(language === "vi" ? "Hãy nhập ngân sách và chọn ít nhất một kênh thông báo" : "Enter a budget and select at least one notification channel");
      return;
    }
    const rule: BudgetRule = { id: `RULE-${String(Date.now()).slice(-6)}`, scope, metric, threshold, budget, channels, escalation, enabled: true };
    setSavedRules((current) => [rule, ...current]);
    setLastSavedRule(rule.id);
    setEditorOpen(false);
    onRuleSaved();
    toast.success(language === "vi" ? "Đã lưu và kích hoạt rule trong phiên trình diễn" : "Rule saved and enabled for this presentation session");
    window.setTimeout(() => document.querySelector<HTMLElement>("[data-saved-alert-rules]")?.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
  };
  return <div className="space-y-4">
    <MetricGrid metrics={[["Active alert rules","184","12 portfolios","cyan"],["Triggered today","28","4 critical","amber"],["Acknowledged","92.8%","Median 38 sec","emerald"],["Budget utilization","84.6%","Day 22 / 31","amber"],["Notification delivery","99.2%","4 channels","emerald"],["Escalations","6","2 overdue","red"]]}/>
    {lastSavedRule && !editorOpen && <div data-alert-rule-saved className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-300/20 bg-emerald-300/[.07] px-4 py-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-300/12 text-emerald-300"><CheckCircle2 size={17}/></span><div className="min-w-0 flex-1"><p className="text-[11px] font-semibold text-emerald-100">{language === "vi" ? "Đã tạo và kích hoạt rule cảnh báo" : "Alert rule created and enabled"}</p><p className="mt-0.5 text-[9px] text-emerald-100/60">{lastSavedRule} · {scope} · {metric} · {threshold}%</p></div><button type="button" onClick={openEditor} className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-100/30 bg-emerald-300 px-3.5 py-2 text-[10px] font-bold text-emerald-950 shadow-[0_0_20px_rgba(110,231,183,.22)] transition hover:-translate-y-0.5 hover:bg-emerald-200 hover:shadow-[0_0_26px_rgba(110,231,183,.34)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/70"><BellRing size={14}/>{language === "vi" ? "Tạo rule khác" : "Create another rule"}</button></div>}
    <div className={`grid gap-4 ${editorOpen ? "xl:grid-cols-[.85fr_1.15fr]" : ""}`}>
      {editorOpen && <AirportPanel title={language === "vi" ? "Thiết lập ngân sách & cảnh báo" : "Budget and alert rule setup"}><div data-budget-rule-editor className="scroll-mt-24 space-y-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label><span className="mb-1 block text-[9px] text-slate-500">{language === "vi" ? "Đối tượng áp dụng" : "Applicable object"}</span><select data-budget-scope className="airport-select w-full" value={scope} onChange={(event) => setScope(event.target.value)}>{["Hospital-wide portfolio","Acute Care Tower","Diagnostics & Treatment","Ward 6B","Clinical Laboratory","Central Utility Plant"].map((item)=><option key={item}>{item}</option>)}</select></label>
          <label><span className="mb-1 block text-[9px] text-slate-500">{language === "vi" ? "Chỉ số" : "Metric"}</span><select data-budget-metric className="airport-select w-full" value={metric} onChange={(event) => setMetric(event.target.value)}>{["Electricity consumption","Peak demand","Forecast utility cost","Water consumption","Thermal / BTU consumption","Gas consumption","Power factor","Chilled-water ΔT"].map((item)=><option key={item}>{item}</option>)}</select></label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label><span className="mb-1 block text-[9px] text-slate-500">{language === "vi" ? "Ngưỡng cảnh báo (%)" : "Alert threshold (%)"}</span><input data-budget-threshold type="number" min="1" max="150" value={threshold} onChange={(event)=>setThreshold(Number(event.target.value))} className="w-full rounded-lg border border-white/[.08] bg-white/[.035] px-3 py-2 text-[10px] text-white outline-none focus:border-cyan-300/30"/></label>
          <label><span className="mb-1 block text-[9px] text-slate-500">{language === "vi" ? "Ngân sách (VND/tháng)" : "Budget (VND/month)"}</span><input data-budget-amount inputMode="numeric" value={budget} onChange={(event)=>setBudget(event.target.value)} className="w-full rounded-lg border border-white/[.08] bg-white/[.035] px-3 py-2 text-[10px] text-white outline-none focus:border-cyan-300/30"/></label>
        </div>
        <div><div className="mb-2 flex justify-between text-[10px]"><span className="text-slate-300">{language === "vi" ? "Mức kích hoạt" : "Trigger level"}</span><b className="text-cyan-200">{threshold}%</b></div><input type="range" min="1" max="150" step="1" value={threshold} onChange={(event)=>setThreshold(Number(event.target.value))} className="w-full accent-cyan-300"/><p className="mt-1 text-[9px] text-slate-600">{scope} · {metric} · {language === "vi" ? "ngân sách" : "budget"} ₫{budget}</p></div>
        <div><p className="mb-2 text-[10px] text-slate-300">{language === "vi" ? "Kênh thông báo" : "Notification channels"}</p><div className="grid grid-cols-2 gap-2">{[["App",Smartphone],["Email",Mail],["Zalo OA",MessageCircle],["Webhook",Webhook]].map(([channel,Icon]) => <button type="button" key={String(channel)} onClick={() => toggle(String(channel))} className={`flex items-center gap-2 rounded-lg border p-3 text-[10px] ${channels.includes(String(channel)) ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-100" : "border-white/[.07] bg-white/[.025] text-slate-500"}`}><Icon size={14}/>{String(channel)}</button>)}</div></div>
        <label><span className="mb-1 block text-[9px] text-slate-500">Escalation</span><select data-budget-escalation className="airport-select w-full" value={escalation} onChange={(event)=>setEscalation(event.target.value)}>{["No escalation","Level 1 · Department user · Immediate","Level 2 · Facility team · 15 min","Level 3 · Energy manager · 30 min","Level 4 · IOC / Management · 60 min"].map((item)=><option key={item}>{item}</option>)}</select></label>
        <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setEditorOpen(false)} className="airport-button w-full justify-center">{language === "vi" ? "Hủy" : "Cancel"}</button><button data-save-budget-rule onClick={saveRule} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-100/30 bg-gradient-to-r from-emerald-300 to-teal-300 px-3 py-2 text-[10px] font-bold text-emerald-950 shadow-[0_0_22px_rgba(52,211,153,.22)] transition hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_0_28px_rgba(52,211,153,.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/70"><CheckCircle2 size={14}/>{language === "vi" ? "Lưu rule" : "Save rule"}</button></div>
      </div></AirportPanel>}
      <AirportPanel title={language === "vi" ? "Cảnh báo và quy trình leo thang" : "Alerts and escalation workflow"}><div className="p-3"><AirportTimeline events={ALERT_EVENTS}/></div><div className="grid grid-cols-2 gap-2 border-t border-white/[.06] p-3 xl:grid-cols-4">{[["Level 1","Department user","Immediate"],["Level 2","Facility team","15 min"],["Level 3","Energy manager","30 min"],["Level 4","IOC / Management","60 min"]].map(([level,owner,time]) => <div key={level} className="rounded-lg border border-white/[.06] bg-white/[.025] p-3"><p className="text-[9px] text-cyan-300">{level}</p><p className="mt-1 text-[10px] font-semibold text-white">{owner}</p><p className="mt-1 text-[9px] text-slate-600">{time}</p></div>)}</div></AirportPanel>
    </div>
    <AirportPanel title={language === "vi" ? "Rule cảnh báo đã lưu" : "Saved alert rules"} subtitle={language === "vi" ? "Được lưu cục bộ trong trình duyệt cho phiên trình bày" : "Stored locally in this browser for the presentation session"} action={<button data-new-alert-rule type="button" onClick={openEditor} className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-100/35 bg-gradient-to-r from-cyan-300 to-sky-400 px-3.5 py-2 text-[10px] font-bold text-slate-950 shadow-[0_0_22px_rgba(34,211,238,.28)] transition hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_0_30px_rgba(34,211,238,.42)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/70"><BellRing size={14}/>{language === "vi" ? "Tạo rule mới" : "New rule"}</button>}><div data-saved-alert-rules className="scroll-mt-24 grid gap-3 p-4 xl:grid-cols-2">{savedRules.map((rule)=><div key={rule.id} className={`rounded-xl border p-4 ${rule.enabled ? "border-cyan-400/14 bg-cyan-400/[.035]" : "border-white/[.06] bg-white/[.02] opacity-60"}`}><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[9px] font-semibold text-cyan-300">{rule.id} · {rule.scope}</p><p className="mt-1 text-[11px] font-semibold text-white">{rule.metric}</p></div><AirportStatusBadge status={rule.enabled ? "normal" : "offline"} label={rule.enabled ? (language === "vi" ? "Đang bật" : "Enabled") : (language === "vi" ? "Đã tắt" : "Disabled")}/></div><div className="mt-3 grid grid-cols-2 gap-2 text-[9px] sm:grid-cols-4"><div className="rounded-lg bg-white/[.035] p-2"><p className="text-slate-600">Threshold</p><p className="mt-1 text-amber-300">{rule.threshold}%</p></div><div className="rounded-lg bg-white/[.035] p-2"><p className="text-slate-600">Budget</p><p className="mt-1 text-cyan-200">₫{rule.budget}</p></div><div className="rounded-lg bg-white/[.035] p-2"><p className="text-slate-600">Channels</p><p className="mt-1 text-slate-300">{rule.channels.join(" · ")}</p></div><div className="rounded-lg bg-white/[.035] p-2"><p className="text-slate-600">Escalation</p><p className="mt-1 text-slate-300">{rule.escalation.split(" · ")[0]}</p></div></div><div className="mt-3 flex gap-2"><button type="button" onClick={()=>setSavedRules((current)=>current.map((item)=>item.id===rule.id?{...item,enabled:!item.enabled}:item))} className="airport-button">{rule.enabled ? (language === "vi" ? "Tắt rule" : "Disable") : (language === "vi" ? "Bật rule" : "Enable")}</button><button type="button" onClick={()=>{setSavedRules((current)=>current.filter((item)=>item.id!==rule.id));toast.info(language === "vi" ? "Đã xóa rule" : "Rule removed")}} className="airport-button !text-red-300">{language === "vi" ? "Xóa" : "Delete"}</button></div></div>)}</div></AirportPanel>
    <AirportPanel title="Budget posture by cost center"><div className="grid grid-cols-2 gap-3 p-4 xl:grid-cols-5">{[
      ["Acute Care Tower",96,"₫4.28B","critical"],["Diagnostics Center",91,"₫1.84B","warning"],["Ward 6B",84,"₫684M","warning"],["Clinical Laboratory",72,"₫428M","normal"],["Dialysis Unit",68,"₫318M","normal"],
    ].map(([name,value,cost,status]) => <div key={String(name)} className="rounded-xl border border-white/[.07] bg-white/[.025] p-4"><div className="flex justify-between"><span className="text-[10px] font-semibold text-white">{name}</span><AirportStatusBadge status={status as "normal"|"warning"|"critical"}/></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[.06]"><motion.div initial={{width:0}} animate={{width:`${value}%`}} className={`h-full rounded-full ${Number(value)>95?"bg-red-400":Number(value)>80?"bg-amber-400":"bg-cyan-400"}`}/></div><div className="mt-2 flex justify-between text-[9px] text-slate-500"><span>{value}%</span><span>{cost}</span></div></div>)}</div></AirportPanel>
  </div>;
}

function AIAnalytics() {
  const { language } = useAirportLanguage();
  const [approved, setApproved] = useState<string[]>([]);
  const [analysisScope, setAnalysisScope] = useState("Electricity portfolio");
  const [analysisHorizon, setAnalysisHorizon] = useState("Next 24 hours");
  const [analysisPrompt, setAnalysisPrompt] = useState("Phân tích nguy cơ vượt đỉnh tải và đề xuất phương án tiết kiệm phù hợp.");
  const [analysisRunning, setAnalysisRunning] = useState(false);
  const [analysisReady, setAnalysisReady] = useState(false);
  const [workspaceApproved, setWorkspaceApproved] = useState(false);
  const recommendations = [
    { id:"AI-284", title:"Shift non-critical load before 14:00 tariff peak", saving:"₫128M/month", confidence:94, action:"Schedule 2.4 MW load shift", risk:"Low" },
    { id:"AI-281", title:"Probable leakage in DMA-04 during 01:00–04:00", saving:"420 m³/day", confidence:91, action:"Create inspection work order", risk:"Medium" },
    { id:"AI-278", title:"Low chilled-water ΔT at Ward 6B", saving:"₫42M/month", confidence:89, action:"Tune control valve and coil", risk:"Medium" },
    { id:"AI-271", title:"Transformer TR-03 thermal degradation trend", saving:"Avoid ₫2.8B risk", confidence:87, action:"Inspect within 12 days", risk:"High" },
  ];
  const forecastData = series(11, 76, 14);
  const analysisResult = analysisScope.startsWith("Water")
    ? { finding: "DMA-04 có lưu lượng nền bất thường 01:00–04:00", impact: "420 m³/ngày · khoảng ₫230M/tháng", action: "Tạo work order kiểm tra van và tuyến ống DMA-04", confidence: "91%" }
    : analysisScope.startsWith("Thermal")
      ? { finding: "Ward 6B vận hành ΔT thấp 3.8°C", impact: "+7.8% hiệu suất · khoảng ₫42M/tháng", action: "Kiểm tra van điều khiển, coil và cân bằng lưu lượng", confidence: "89%" }
      : { finding: "Đỉnh tải dự báo 48.2 MW lúc 14:00", impact: "Vượt 2.4 MW · khoảng ₫128M/tháng", action: "Dịch chuyển tải không thiết yếu 13:30–15:00", confidence: "94%" };
  const runAnalysis = () => {
    if (!analysisPrompt.trim()) { toast.error(language === "vi" ? "Hãy nhập yêu cầu phân tích" : "Enter an analysis request"); return; }
    setAnalysisRunning(true);
    setAnalysisReady(false);
    setWorkspaceApproved(false);
    window.setTimeout(() => { setAnalysisRunning(false); setAnalysisReady(true); }, 650);
  };
  return <div className="space-y-4">
    <MetricGrid metrics={[["AI models","18","12 production","violet"],["Forecast accuracy","93.8%","30-day MAPE","emerald"],["Anomalies today","12","4 actionable","amber"],["Projected savings","₫28.4B/y","Energy + water","emerald"],["Peak avoided","2.4 MW","Recommended","cyan"],["Explainability","100%","Evidence linked","blue"]]}/>
    <AirportPanel title={language === "vi" ? "Không gian phân tích YooAI" : "YooAI analysis workspace"} subtitle={language === "vi" ? "Nhập bài toán, chạy phân tích, xem bằng chứng và phê duyệt hành động" : "Define a question, run analysis, review evidence and approve an action"}>
      <div className="grid gap-4 p-4 xl:grid-cols-[.72fr_1.28fr]">
        <div className="space-y-3">
          <label><span className="mb-1 block text-[9px] text-slate-500">{language === "vi" ? "Phạm vi phân tích" : "Analysis scope"}</span><select data-ai-analysis-scope className="airport-select w-full" value={analysisScope} onChange={(event)=>{setAnalysisScope(event.target.value);setAnalysisReady(false)}}>{["Electricity portfolio","Water network · DMA-04","Thermal / BTU · Ward 6B"].map((item)=><option key={item}>{item}</option>)}</select></label>
          <label><span className="mb-1 block text-[9px] text-slate-500">{language === "vi" ? "Khoảng dự báo" : "Forecast horizon"}</span><select className="airport-select w-full" value={analysisHorizon} onChange={(event)=>setAnalysisHorizon(event.target.value)}>{["Next 4 hours","Next 24 hours","Next 7 days","Month end"].map((item)=><option key={item}>{item}</option>)}</select></label>
          <label><span className="mb-1 block text-[9px] text-slate-500">{language === "vi" ? "Yêu cầu cho AI" : "AI request"}</span><textarea data-ai-analysis-prompt rows={4} value={analysisPrompt} onChange={(event)=>setAnalysisPrompt(event.target.value)} className="w-full resize-none rounded-lg border border-white/[.08] bg-white/[.035] px-3 py-2 text-[10px] leading-relaxed text-white outline-none focus:border-violet-300/30"/></label>
          <button data-run-ai-analysis type="button" disabled={analysisRunning} onClick={runAnalysis} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-violet-200/30 bg-gradient-to-r from-violet-500 to-indigo-500 px-3 py-2.5 text-[10px] font-bold text-white shadow-[0_0_24px_rgba(139,92,246,.24)] transition hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_0_30px_rgba(139,92,246,.36)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200/70 disabled:cursor-wait disabled:opacity-70">{analysisRunning ? <RefreshCw size={14} className="animate-spin"/> : <BrainCircuit size={14}/>} {analysisRunning ? (language === "vi" ? "Đang phân tích…" : "Analyzing…") : (language === "vi" ? "Chạy phân tích" : "Run analysis")}</button>
        </div>
        <div data-ai-analysis-result className="min-h-[220px] rounded-xl border border-violet-400/14 bg-gradient-to-br from-violet-400/[.065] to-cyan-400/[.025] p-4">
          {!analysisReady && !analysisRunning && <div className="grid h-full min-h-[190px] place-items-center text-center"><div><BrainCircuit size={30} className="mx-auto text-violet-300/70"/><p className="mt-3 text-[11px] font-semibold text-white">{language === "vi" ? "Sẵn sàng phân tích" : "Ready to analyze"}</p><p className="mt-1 text-[9px] text-slate-500">{analysisScope} · {analysisHorizon}</p></div></div>}
          {analysisRunning && <div className="grid h-full min-h-[190px] place-items-center text-center"><div><RefreshCw size={28} className="mx-auto animate-spin text-violet-300"/><p className="mt-3 text-[10px] text-slate-400">{language === "vi" ? "Đang đối chiếu baseline, dự báo và vận hành…" : "Comparing baseline, forecast and operations…"}</p></div></div>}
          {analysisReady && <div><div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-semibold uppercase tracking-[.14em] text-violet-300">YooAI · {analysisResult.confidence} confidence</p><h3 className="mt-2 text-sm font-semibold text-white">{analysisResult.finding}</h3></div><AirportStatusBadge status="warning" label={language === "vi" ? "Cần hành động" : "Actionable"}/></div><div className="mt-4 grid gap-2 sm:grid-cols-3"><div className="rounded-lg bg-white/[.035] p-3"><p className="text-[9px] text-slate-600">Impact</p><p className="mt-1 text-[10px] text-amber-200">{analysisResult.impact}</p></div><div className="rounded-lg bg-white/[.035] p-3 sm:col-span-2"><p className="text-[9px] text-slate-600">Recommended action</p><p className="mt-1 text-[10px] text-cyan-200">{analysisResult.action}</p></div></div><p className="mt-3 text-[9px] leading-relaxed text-slate-500">Evidence: 30-day baseline, half-hour profile, tariff window, meter quality and linked operating context. Human approval is required before execution.</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={workspaceApproved} onClick={()=>{setWorkspaceApproved(true);toast.success(language === "vi" ? "Đã phê duyệt hành động và ghi audit trail" : "Action approved and audit trail recorded")}} className="airport-button"><CheckCircle2 size={14}/>{workspaceApproved ? (language === "vi" ? "Đã phê duyệt" : "Approved") : (language === "vi" ? "Phê duyệt" : "Approve")}</button><button type="button" onClick={()=>toast.info(language === "vi" ? "Đã mở gói bằng chứng" : "Evidence pack opened")} className="airport-button"><Database size={14}/>{language === "vi" ? "Xem bằng chứng" : "View evidence"}</button></div></div>}
        </div>
      </div>
    </AirportPanel>
    <div className="grid gap-4 2xl:grid-cols-[1.15fr_.85fr]">
      <AirportPanel title={language === "vi" ? "Dự báo tiêu thụ và hóa đơn cuối tháng" : "Consumption and month-end bill forecast"}><div className="p-4"><div className="h-[320px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={forecastData}><defs><linearGradient id="ai-energy" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a78bfa" stopOpacity={.35}/><stop offset="100%" stopColor="#a78bfa" stopOpacity={.02}/></linearGradient></defs><CartesianGrid stroke="rgba(148,163,184,.08)" vertical={false}/><XAxis dataKey="time" tick={{fill:"#64748b",fontSize:9}} minTickGap={25}/><YAxis tick={{fill:"#64748b",fontSize:9}}/><Tooltip contentStyle={{background:"#071426",border:"1px solid rgba(103,232,249,.22)",borderRadius:10}} itemStyle={{color:"#67e8f9"}} labelStyle={{color:"#f8fafc"}}/><Area dataKey="value" stroke="#22d3ee" fill="transparent"/><Area dataKey="forecast" stroke="#a78bfa" strokeDasharray="5 4" fill="url(#ai-energy)"/></AreaChart></ResponsiveContainer></div><div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">{[["Forecast bill","₫19.42B","+5.4%"],["Budget","₫18.80B","Approved"],["Potential saving","₫684M","4 actions"]].map(([a,b,c]) => <div key={a} className="rounded-lg border border-white/[.06] bg-white/[.025] p-3"><p className="text-[9px] text-slate-500">{a}</p><p className="mt-1 text-sm font-semibold text-white">{b}</p><p className="mt-1 text-[9px] text-cyan-300">{c}</p></div>)}</div></div></AirportPanel>
      <AirportPanel title={language === "vi" ? "Sức khỏe mô hình AI" : "AI model governance"}><div className="space-y-2 p-3">{[
        ["Load forecast","94.2%","Production","normal"],["Bill forecast","93.8%","Production","normal"],["Water leak detection","91.4%","Production","normal"],["BTU low-ΔT detector","89.2%","Pilot","warning"],["Asset failure model","87.6%","Production","normal"],["Carbon optimizer","84.8%","Validation","warning"],
      ].map(([name,score,stage,status]) => <div key={name} className="rounded-lg border border-white/[.06] bg-white/[.025] p-3"><div className="flex justify-between"><span className="text-[10px] text-slate-300">{name}</span><AirportStatusBadge status={status as "normal"|"warning"}/></div><div className="mt-2 flex justify-between text-[9px] text-slate-500"><span>{stage}</span><b className="text-violet-300">{score}</b></div></div>)}</div></AirportPanel>
    </div>
    <AirportPanel title={language === "vi" ? "Khuyến nghị có giải thích và phê duyệt" : "Explainable recommendations with human approval"}><div className="grid gap-3 p-4 xl:grid-cols-2">{recommendations.map((item) => { const done = approved.includes(item.id); return <div key={item.id} className={`rounded-xl border p-4 ${done?"border-emerald-400/20 bg-emerald-400/[.045]":"border-violet-400/14 bg-violet-400/[.035]"}`}><div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-semibold text-violet-300">{item.id} · Confidence {item.confidence}%</p><h3 className="mt-2 text-[11px] font-semibold text-white">{item.title}</h3></div><BrainCircuit size={20} className="text-violet-300"/></div><div className="mt-3 grid grid-cols-3 gap-2 text-[9px]"><div className="rounded-lg bg-white/[.035] p-2"><p className="text-slate-600">Value</p><p className="mt-1 text-emerald-300">{item.saving}</p></div><div className="rounded-lg bg-white/[.035] p-2"><p className="text-slate-600">Risk</p><p className="mt-1 text-amber-300">{item.risk}</p></div><div className="rounded-lg bg-white/[.035] p-2"><p className="text-slate-600">Action</p><p className="mt-1 text-cyan-300">Human approval</p></div></div><p className="mt-3 text-[9px] text-slate-500">Recommended: {item.action}. Evidence includes trend, baseline, operating schedule and linked asset context.</p><div className="mt-3 flex gap-2"><button disabled={done} onClick={() => {setApproved((current)=>[...current,item.id]);toast.success(`${item.id} approved with audit trail`)}} className="airport-button"><CheckCircle2 size={14}/>{done?"Approved":"Approve"}</button><button onClick={() => toast.info(`${item.id} evidence pack opened`)} className="airport-button"><Database size={14}/>Evidence</button></div></div>})}</div></AirportPanel>
  </div>;
}

function ReportsCenter() {
  const { language } = useAirportLanguage();
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("23:30");
  const [format, setFormat] = useState<ExportFileFormat>("xlsx");
  const [template, setTemplate] = useState("Energy & Utility Portfolio");
  const reports = [
    ["Monthly Energy & Utility Portfolio", "Portfolio", "Monthly", "PDF + XLSX", "Ready"],
    ["Hospital Cost Allocation Pack", "Cost center", "Monthly", "PDF", "Ready"],
    ["Power Quality Event Report", "Electrical", "Daily", "PDF + COMTRADE", "Ready"],
    ["Water Balance & Leakage", "Water", "Weekly", "PDF + XLSX", "Scheduled"],
    ["BTU Low-ΔT Performance", "Thermal", "Weekly", "PDF", "Scheduled"],
    ["Carbon & ESG Utility Report", "ESG", "Monthly", "PDF + API", "Draft"],
  ];
  const generateReport = () => {
    const startIndex = TIME_SLOTS.indexOf(startTime);
    const endIndex = TIME_SLOTS.indexOf(endTime);
    if (startIndex < 0 || endIndex < startIndex) {
      toast.error(language === "vi" ? "Giờ kết thúc phải sau giờ bắt đầu" : "End time must be after start time");
      return;
    }
    const reportRows: ExportRow[] = series(11, 72, 16).slice(startIndex, endIndex + 1).map((point) => ({
      Report: template,
      Time: point.time,
      "Actual value": point.value,
      "Forecast value": point.forecast ?? "",
      Unit: "kWh",
      "Data quality": "Validated",
    }));
    const fileName = downloadTabularFile({ baseName: `yooenergy-${template}-${startTime}-${endTime}`, sheetName: "Energy Report", rows: reportRows, format });
    toast.success(`${language === "vi" ? "Đã tải xuống" : "Downloaded"} ${fileName}`);
  };
  return <div className="space-y-4">
    <MetricGrid metrics={[["Report templates","42","12 domains","cyan"],["Scheduled reports","84","Next 18:00","blue"],["Generated MTD","1,284","99.8% success","emerald"],["Subscribers","386","App + Email","cyan"],["Exports today","128","PDF / XLSX / API","violet"],["Failed jobs","2","Retry queued","amber"]]}/>
    <div className="grid gap-4 xl:grid-cols-[.8fr_1.2fr]">
      <AirportPanel title={language === "vi" ? "Tạo báo cáo theo thời gian" : "Create time-bounded report"}><div className="space-y-4 p-4"><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><label><span className="mb-1 block text-[9px] text-slate-500">{language === "vi" ? "Giờ bắt đầu" : "Start time"}</span><select data-report-start-time className="airport-select w-full" value={startTime} onChange={(event) => setStartTime(event.target.value)}>{TIME_SLOTS.map((slot)=><option key={slot}>{slot}</option>)}</select></label><label><span className="mb-1 block text-[9px] text-slate-500">{language === "vi" ? "Giờ kết thúc" : "End time"}</span><select data-report-end-time className="airport-select w-full" value={endTime} onChange={(event) => setEndTime(event.target.value)}>{TIME_SLOTS.map((slot)=><option key={slot}>{slot}</option>)}</select></label></div><label><span className="mb-1 block text-[9px] text-slate-500">Report template</span><select className="airport-select w-full" value={template} onChange={(event) => setTemplate(event.target.value)}>{["Energy & Utility Portfolio","Cost Allocation Statement","Power Quality Events","Water Balance","BTU Performance"].map((item)=><option key={item}>{item}</option>)}</select></label><div><p className="mb-2 text-[9px] text-slate-500">{language === "vi" ? "Định dạng xuất file" : "Export file format"}</p><ExportFormatPicker value={format} onChange={setFormat} formats={["xlsx","pdf","csv","json","txt"]}/></div><div className="rounded-lg border border-cyan-400/12 bg-cyan-400/[.035] p-3 text-[9px] text-slate-400">Selected window: <b className="text-cyan-200">{startTime} → {endTime}</b>. Time options are available every 30 minutes from 00:00 to 23:30.</div><button data-download-report type="button" onClick={generateReport} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-100/30 bg-gradient-to-r from-cyan-300 to-sky-400 px-3 py-2.5 text-[10px] font-bold text-slate-950 shadow-[0_0_22px_rgba(34,211,238,.24)] transition hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_0_30px_rgba(34,211,238,.36)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/70"><Download size={14}/>{language === "vi" ? `Tải ${format.toUpperCase()}` : `Download ${format.toUpperCase()}`}</button></div></AirportPanel>
      <AirportPanel title={language === "vi" ? "Thư viện báo cáo và lịch gửi" : "Report library and delivery schedules"}><div className="overflow-x-auto"><table className="w-full"><thead className="bg-white/[.03]"><tr>{["Report","Domain","Frequency","Output","Status"].map((header)=><th key={header} className="px-3 py-3 text-left text-[8px] uppercase tracking-[.1em] text-slate-500">{header}</th>)}</tr></thead><tbody>{reports.map((row)=><tr key={row[0]} className="border-t border-white/[.05]"><td className="px-3 py-3 text-[10px] font-semibold text-white">{row[0]}</td><td className="px-3 py-3 text-[10px] text-slate-400">{row[1]}</td><td className="px-3 py-3 text-[10px] text-slate-400">{row[2]}</td><td className="px-3 py-3 text-[10px] text-cyan-300">{row[3]}</td><td className="px-3 py-3"><AirportStatusBadge status={row[4]==="Ready"?"normal":row[4]==="Draft"?"warning":"info"} label={row[4]}/></td></tr>)}</tbody></table></div></AirportPanel>
    </div>
    <AirportPanel title="Delivery subscriptions"><div className="grid grid-cols-2 gap-3 p-4 xl:grid-cols-4">{[["Mobile app","428 subscribers",Smartphone],["Email","386 recipients",Mail],["Zalo OA","186 recipients",MessageCircle],["API / Webhook","42 integrations",Webhook]].map(([name,detail,Icon])=><div key={String(name)} className="rounded-xl border border-white/[.07] bg-white/[.025] p-4"><Icon size={18} className="text-cyan-300"/><p className="mt-3 text-[10px] font-semibold text-white">{String(name)}</p><p className="mt-1 text-[9px] text-slate-500">{String(detail)}</p></div>)}</div></AirportPanel>
  </div>;
}

function GatewayManagement() {
  const { language } = useAirportLanguage();
  const [selected, setSelected] = useState<(typeof GATEWAYS)[number] | null>(null);
  return <div className="space-y-4">
    <MetricGrid metrics={[["Gateways","284 / 286","99.3% online","cyan"],["Edge devices","2,504","5 utilities","blue"],["Messages / sec","18,420","Peak 28k","cyan"],["Store & forward","100%","72 h buffer","emerald"],["Median latency","42 ms","Target <100","emerald"],["Security posture","98.6%","4 actions","amber"]]}/>
    <div className="grid gap-4 2xl:grid-cols-[1.25fr_.75fr]">
      <AirportPanel title={language === "vi" ? "Gateway, giao thức và sức khỏe kết nối" : "Gateway, protocol and connectivity health"}><div className="overflow-x-auto"><table className="w-full"><thead className="bg-white/[.03]"><tr>{["Gateway","Domain","Protocols","Points","Availability","Last message","Status"].map((header)=><th key={header} className="px-3 py-3 text-left text-[8px] uppercase tracking-[.1em] text-slate-500">{header}</th>)}</tr></thead><tbody>{GATEWAYS.map((row)=><tr key={row[0]} onClick={()=>setSelected(row)} className="cursor-pointer border-t border-white/[.05] hover:bg-cyan-400/[.035]"><td className="px-3 py-3 text-[10px] font-semibold text-cyan-300">{row[0]}</td><td className="px-3 py-3 text-[10px] text-white">{row[1]}</td><td className="px-3 py-3 text-[10px] text-slate-400">{row[2]}</td><td className="px-3 py-3 text-[10px] text-slate-400">{row[3]}</td><td className="px-3 py-3 text-[10px] text-slate-300">{row[4]}</td><td className="px-3 py-3 text-[10px] text-slate-500">{row[5]}</td><td className="px-3 py-3"><AirportStatusBadge status={row[6]}/></td></tr>)}</tbody></table></div></AirportPanel>
      <AirportPanel title={language === "vi" ? "Kiến trúc Edge" : "Edge architecture"}><div className="space-y-3 p-4">{[
        ["Field layer","Meters · sensors · analyzers · PLC/DDC",PlugZap],["Protocol layer","Modbus · BACnet/IP · M-Bus · OPC UA",Cable],["Gateway layer","Buffering · normalization · rules · heartbeat",Cpu],["Platform layer","MQTT · HTTP · time-series · billing",Cloud],["Application layer","Web · App · Zalo · EBO · Digital Twin",Network],
      ].map(([name,detail,Icon],index)=><div key={String(name)} className="relative rounded-lg border border-cyan-400/12 bg-cyan-400/[.035] p-3"><div className="flex gap-3"><Icon size={16} className="text-cyan-300"/><div><p className="text-[10px] font-semibold text-white">{String(name)}</p><p className="mt-1 text-[9px] text-slate-500">{String(detail)}</p></div></div>{index<4&&<GitBranch size={14} className="absolute -bottom-3 left-5 rotate-90 text-cyan-300/40"/>}</div>)}</div></AirportPanel>
    </div>
    <AirportPanel title="Gateway security and governance"><div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-3 xl:grid-cols-5">{[["Device identity","mTLS / certificate","normal"],["Network zones","OT VLAN segmentation","normal"],["Encryption","TLS 1.3 in transit","normal"],["Firmware","96.8% compliant","warning"],["Audit trail","100% commands","normal"]].map(([a,b,status])=><div key={a} className="rounded-xl border border-white/[.07] bg-white/[.025] p-4"><ShieldCheck size={17} className="text-emerald-300"/><p className="mt-3 text-[10px] font-semibold text-white">{a}</p><p className="mt-1 text-[9px] text-slate-500">{b}</p><div className="mt-2"><AirportStatusBadge status={status as "normal"|"warning"}/></div></div>)}</div></AirportPanel>
    <AirportDetailDrawer open={Boolean(selected)} title={selected?.[0] ?? "Gateway detail"} subtitle={selected?.[1]} onClose={()=>setSelected(null)}>{selected&&<div className="space-y-3">{[["Protocols",selected[2]],["Connected points",selected[3]],["Availability",selected[4]],["Last message",selected[5]],["Store & forward","Enabled · 72 h"],["Certificate","Valid to 2027-07-01"]].map(([a,b])=><div key={a} className="flex justify-between rounded-lg border border-white/[.06] bg-white/[.025] p-3 text-[10px]"><span className="text-slate-500">{a}</span><span className="font-semibold text-white">{b}</span></div>)}<button onClick={()=>toast.success("Gateway diagnostic completed")} className="airport-button w-full justify-center"><RefreshCw size={14}/>Run gateway diagnostics</button></div>}</AirportDetailDrawer>
  </div>;
}

function IntegrationCenter() {
  const { language } = useAirportLanguage();
  const systems = [
    ["Schneider EcoStruxure Building Operation", "BACnet/IP · REST/Web Services", "1,842 points", "99.98%", "normal"],
    ["Digital Twin Platform", "REST API · WebSocket · Deep link", "184 assets", "99.97%", "normal"],
    ["Power SCADA", "OPC UA · IEC 61850 gateway", "12,486 tags", "99.99%", "normal"],
    ["Hospital Portal / Mobile App", "REST API · OAuth2", "20 cost centers", "99.94%", "normal"],
    ["Zalo OA & Email Service", "Webhook · SMTP", "386 recipients", "99.2%", "warning"],
    ["ERP / Finance", "API · SFTP statement export", "184 invoices", "99.8%", "normal"],
  ] as const;
  return <div className="space-y-4">
    <MetricGrid metrics={[["Connected platforms","18 / 19","94.7%","cyan"],["EBO points","1,842","Live + trends","blue"],["Digital Twin assets","184","Deep linked","cyan"],["API availability","99.97%","Healthy","emerald"],["Commands today","284","100% audited","violet"],["Integration errors","6","1 priority","amber"]]}/>
    <AirportPanel title={language === "vi" ? "Kiến trúc tích hợp hai chiều" : "Bidirectional integration architecture"}><div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-5">{[
      ["EBO / SCADA","Live values · trend · alarm · runtime",Server],["Energy Platform","Normalize · tariff · billing · AI",Database],["API & Event Bus","REST · MQTT · WebSocket · webhook",GitBranch],["Digital Twin","Asset · location · context · work order",Building2],["Hospital Channels","Web · App · Email · Zalo OA",Smartphone],
    ].map(([name,detail,Icon],index)=><div key={String(name)} className="relative rounded-2xl border border-cyan-400/14 bg-gradient-to-br from-cyan-400/[.065] to-transparent p-4"><Icon size={20} className="text-cyan-300"/><p className="mt-4 text-[11px] font-semibold text-white">{String(name)}</p><p className="mt-2 text-[9px] leading-relaxed text-slate-500">{String(detail)}</p>{index<4&&<GitBranch size={18} className="absolute -right-4 top-1/2 text-cyan-300/50"/>}</div>)}</div></AirportPanel>
    <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
      <AirportPanel title={language === "vi" ? "Tình trạng kết nối hệ thống" : "System integration status"}><div className="space-y-2 p-3">{systems.map((row)=><button key={row[0]} onClick={()=>toast.info(`${row[0]} integration detail opened`)} className="grid w-full grid-cols-[1.4fr_1.3fr_.7fr_.55fr_auto] items-center gap-3 rounded-lg border border-white/[.06] bg-white/[.025] p-3 text-left"><span className="text-[10px] font-semibold text-white">{row[0]}</span><span className="text-[9px] text-slate-500">{row[1]}</span><span className="text-[9px] text-cyan-300">{row[2]}</span><span className="text-[9px] text-slate-400">{row[3]}</span><AirportStatusBadge status={row[4]}/></button>)}</div></AirportPanel>
      <AirportPanel title={language === "vi" ? "Luồng Digital Twin theo ngữ cảnh" : "Contextual Digital Twin workflow"}><div className="space-y-2 p-3">{[
        ["1", "Select building, department, room or asset in 2D/3D"], ["2", "Resolve linked meters, sub-meters and cost centers"], ["3", "Open live value, trend, cost and forecast"], ["4", "Correlate EBO alarm and operating status"], ["5", "Create approved action or work order"], ["6", "Capture result in audit and cost-allocation evidence"],
      ].map(([index,text])=><div key={index} className="flex gap-3 rounded-lg border border-white/[.06] bg-white/[.025] p-3"><span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-cyan-400/10 text-[10px] font-bold text-cyan-300">{index}</span><p className="text-[10px] text-slate-300">{text}</p></div>)}<button onClick={()=>toast.success("Digital Twin linked asset opened") } className="airport-button w-full justify-center"><Building2 size={14}/>Open linked asset</button></div></AirportPanel>
    </div>
    <AirportPanel title="Integration principles"><div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">{[["Independent operation","Platform continues without EBO","normal"],["No browser-to-field control","All commands pass backend and gateway","normal"],["Human approval","AI does not directly control equipment","normal"],["Version-aware adapters","EBO/API capability verified per site","warning"]].map(([a,b,status])=><div key={a} className="rounded-xl border border-white/[.07] bg-white/[.025] p-4"><p className="text-[10px] font-semibold text-white">{a}</p><p className="mt-2 text-[9px] text-slate-500">{b}</p><div className="mt-3"><AirportStatusBadge status={status as "normal"|"warning"}/></div></div>)}</div></AirportPanel>
  </div>;
}

function MetricGrid({ metrics }: { metrics: Metric[] }) {
  return <div className="grid grid-cols-2 gap-2 md:grid-cols-3 2xl:grid-cols-6">{metrics.map(([label,value,trend,tone])=><AirportMetricCard key={label} label={label} value={value} trend={trend} tone={tone} compact/>)}</div>;
}

export default EnergyUtilityModule;
