import React, { useMemo, useState } from "react";
import {
  Activity, AirVent, AlertTriangle, Box, Building2, CheckCircle2, CircleGauge,
  Cog, Fan, Gauge, Info, Layers3, MapPin, MonitorCog, Network, Power, RefreshCcw,
  Settings2, Snowflake, Thermometer, Waves, X, Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  AirportMetricCard, AirportPanel, AirportStatusBadge, AirportTimeline, AirportTrendChart,
} from "../shared/AirportUI";
import { useAirportLanguage } from "../i18n/AirportLanguage";
import { BMS3DModelViewer } from "./bms/BMS3DModelViewer";
import { BMSModelViewer } from "./bms/BMSModelViewer";
import { BMSAssetLocationModal } from "./bms/BMSAssetLocationModal";
import {
  BMS_EQUIPMENT_LIST, type BMSEquipment, type EquipmentParameter,
} from "./bms/bmsEquipmentConfig";
import {
  ASSET_LOCATION_INFO, ASSET_LOCATION_MODEL_URL, FLOORPLAN_3D_MODEL_URL,
  getAssetLocationInfo, getAvailableFloors,
} from "./bms/bmsAssetLocationConfig";

type EquipmentView = "monitor" | "2d" | "3d" | "schematic" | "control";

const SECTION_DEFAULT_EQUIPMENT: Record<string, string> = {
  "chiller-plant": "chiller",
  "air-handling": "ahu",
  "terminal-zones": "fcu",
  "asset-location": "ahu",
};

const BMS_ALARMS = [
  { id: "BMS-ALM-2407", time: "10:42:18", priority: "High", asset: "DHTP-AHU-RD-L2-01", message: "CO₂ above comfort threshold", state: "Acknowledged", owner: "R&D Facility Management" },
  { id: "BMS-ALM-2406", time: "10:36:04", priority: "Medium", asset: "DHTP-VAV-RD-L3-05", message: "Airflow deviation > 12%", state: "Open", owner: "HVAC Ops" },
  { id: "BMS-ALM-2405", time: "10:28:31", priority: "Medium", asset: "DHTP-CH-CUP-01", message: "Condenser approach temperature rising", state: "Investigating", owner: "Utility Plant" },
  { id: "BMS-ALM-2404", time: "10:15:12", priority: "Low", asset: "DHTP-FCU-RD-L2-18", message: "Filter runtime reaches 86%", state: "Planned", owner: "R&D Facility Management" },
  { id: "BMS-ALM-2403", time: "09:58:40", priority: "Info", asset: "HSP-CRAH-DC-03", message: "Redundancy test completed", state: "Closed", owner: "Data Center" },
];

function makeTrend(seed = 0, base = 60, amplitude = 10) {
  return Array.from({ length: 24 }, (_, index) => ({
    time: `${String(index).padStart(2, "0")}:00`,
    value: Number((base + Math.sin((index + seed) / 3) * amplitude + ((index * 7 + seed * 11) % 6)).toFixed(1)),
    forecast: index > 17 ? Number((base + Math.sin((index + seed + 1) / 3) * amplitude * 0.8 + 2).toFixed(1)) : undefined,
  }));
}

function statusFromParameter(parameter: EquipmentParameter) {
  if (parameter.status === "fault") return "critical" as const;
  if (parameter.status === "warning") return "warning" as const;
  if (parameter.status === "offline") return "offline" as const;
  return "normal" as const;
}

export function BmsOperationsModule({ sectionId }: { sectionId: string }) {
  const defaultId = SECTION_DEFAULT_EQUIPMENT[sectionId] ?? "ahu";
  const [selectedId, setSelectedId] = useState(defaultId);
  const selected = BMS_EQUIPMENT_LIST.find((item) => item.id === selectedId) ?? BMS_EQUIPMENT_LIST[0];

  if (sectionId === "bms-overview") return <BmsOverview onOpenEquipment={setSelectedId} selected={selected} />;
  if (sectionId === "ebo-command") return <EboCommandCenter selected={selected} onSelect={setSelectedId} />;
  if (sectionId === "hvac-equipment") return <EquipmentLibrary selected={selected} onSelect={setSelectedId} />;
  if (sectionId === "chiller-plant") return <EquipmentWorkspace equipment={BMS_EQUIPMENT_LIST.find((e) => e.id === "chiller")!} initialView="schematic" />;
  if (sectionId === "air-handling") return <EquipmentWorkspace equipment={BMS_EQUIPMENT_LIST.find((e) => e.id === "ahu")!} initialView="monitor" />;
  if (sectionId === "terminal-zones") return <TerminalZoneOperations selected={selected.id === "fcu" || selected.id === "vav" ? selected : BMS_EQUIPMENT_LIST.find((e) => e.id === "fcu")!} onSelect={setSelectedId} />;
  if (sectionId === "floor-plan") return <BmsFloorPlan />;
  if (sectionId === "schematics") return <SchematicCenter selected={selected} onSelect={setSelectedId} />;
  if (sectionId === "asset-location") return <AssetLocationCenter selected={selected} onSelect={setSelectedId} />;
  if (sectionId === "alarms-events") return <BmsAlarmCenter />;
  if (sectionId === "trends-analytics") return <BmsTrends />;
  return <BmsOverview onOpenEquipment={setSelectedId} selected={selected} />;
}

function BmsOverview({ onOpenEquipment, selected }: { onOpenEquipment: (id: string) => void; selected: BMSEquipment }) {
  const { language } = useAirportLanguage();
  const vi = language === "vi";
  return <>
    <div className="grid grid-cols-3 gap-2 xl:grid-cols-6">
      {[
        [vi ? "Thiết bị kết nối" : "Connected equipment", "4,286", "99.2%"],
        [vi ? "Điểm dữ liệu EBO" : "EBO data points", "68,420", "Live"],
        [vi ? "Cảnh báo đang mở" : "Open alarms", "18", "3 high"],
        [vi ? "Sức khỏe HVAC" : "HVAC health", "96.8%", "+0.6 pt"],
        [vi ? "Nhu cầu làm lạnh" : "Cooling demand", "8.4 MW", "-3.1%"],
        [vi ? "Tiết kiệm hôm nay" : "Savings today", "₫42.8M", "AI + schedule"],
      ].map(([a, b, c], index) => <AirportMetricCard key={a} label={a} value={b} trend={c} compact tone={index === 2 ? "amber" : index === 5 ? "emerald" : "cyan"} />)}
    </div>

    <div className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
      <AirportPanel title={vi ? "Kiến trúc vận hành EBO / BMS" : "EBO / BMS operational architecture"} subtitle={vi ? "Từ thiết bị hiện trường đến giám sát, điều khiển và Digital Twin" : "From field devices to monitoring, control and Digital Twin"}>
        <div className="grid grid-cols-5 gap-2 p-4">
          {[
            ["01", vi ? "Thiết bị hiện trường" : "Field devices", "Chiller · AHU · FCU · VAV · CRAH"],
            ["02", vi ? "Bộ điều khiển" : "Controllers", "BACnet/IP · Modbus · OPC-UA"],
            ["03", "EBO", vi ? "Máy chủ, lịch vận hành, cảnh báo" : "Servers, schedules and alarms"],
            ["04", vi ? "Bản sao số" : "Digital Twin", vi ? "2D · 3D · Schematic · Vị trí" : "2D · 3D · Schematic · Location"],
            ["05", vi ? "Vận hành" : "Operations", vi ? "Giám sát · điều khiển · phân tích" : "Monitor · control · analytics"],
          ].map(([step, title, copy], index) => <div key={step} className="relative rounded-xl border border-cyan-400/15 bg-cyan-400/[.045] p-4">
            <p className="text-[9px] font-semibold tracking-[.15em] text-cyan-300">{step}</p>
            <p className="mt-2 text-[11px] font-semibold text-white">{title}</p>
            <p className="mt-1 text-[9px] leading-relaxed text-slate-500">{copy}</p>
            {index < 4 && <span className="absolute -right-2 top-1/2 z-10 text-cyan-300/50">→</span>}
          </div>)}
        </div>
      </AirportPanel>
      <AirportPanel title={vi ? "Trạng thái hệ thống" : "System status"}>
        <div className="space-y-2 p-3">
          {[
            ["EBO Enterprise Server", "99.99%", "normal"],
            ["Automation Servers", "24 / 24", "normal"],
            ["BACnet networks", "18 / 18", "normal"],
            ["Modbus gateways", "12 / 12", "normal"],
            ["Alarm routing", "3 pending", "warning"],
            ["Historian", "6 sec freshness", "normal"],
          ].map(([name, value, status]) => <div key={name} className="flex items-center justify-between rounded-lg border border-white/[.06] bg-white/[.025] p-3">
            <span className="text-[10px] text-slate-300">{name}</span><div className="flex items-center gap-2"><b className="text-[10px] text-white">{value}</b><AirportStatusBadge status={status as "normal" | "warning"} /></div>
          </div>)}
        </div>
      </AirportPanel>
    </div>

    <AirportPanel title={vi ? "Thiết bị HVAC trọng yếu" : "Critical HVAC equipment"} subtitle={vi ? "Mở nhanh giám sát, mô hình 3D, schematic và điều khiển" : "Open monitoring, 3D, schematic and control"}>
      <div className="grid grid-cols-2 gap-3 p-4 xl:grid-cols-3">
        {BMS_EQUIPMENT_LIST.map((equipment, index) => <button key={equipment.id} onClick={() => onOpenEquipment(equipment.id)} className={`rounded-xl border p-4 text-left transition ${selected.id === equipment.id ? "border-cyan-400/30 bg-cyan-400/[.08]" : "border-white/[.07] bg-white/[.025] hover:border-cyan-400/20 hover:bg-cyan-400/[.04]"}`}>
          <div className="flex items-start justify-between gap-3">
            <EquipmentIcon equipment={equipment} />
            <AirportStatusBadge status={index === 3 ? "warning" : "normal"} label={index === 3 ? (vi ? "Theo dõi" : "Monitor") : (vi ? "Đang chạy" : "Running")} />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-white">{equipment.name}</h3>
          <p className="mt-0.5 text-[10px] text-slate-500">{vi ? equipment.nameVi : equipment.category}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[9px]">
            <span className="rounded bg-white/[.04] px-2 py-1.5 text-slate-400">{equipment.parameters[0]?.label}: <b className="text-white">{String(equipment.parameters[0]?.value)}</b></span>
            <span className="rounded bg-white/[.04] px-2 py-1.5 text-slate-400">{equipment.parameters[3]?.label}: <b className="text-white">{String(equipment.parameters[3]?.value)} {equipment.parameters[3]?.unit}</b></span>
          </div>
        </button>)}
      </div>
    </AirportPanel>

    <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
      <AirportPanel title={vi ? "Hiệu suất HVAC 24 giờ" : "HVAC performance · 24 hours"}><div className="p-3"><AirportTrendChart data={makeTrend(2, 68, 13)} height={250} color="#22d3ee" unit="%" /></div></AirportPanel>
      <AirportPanel title={vi ? "Sự kiện vận hành trực tiếp" : "Live operational events"}><div className="p-3"><AirportTimeline events={[["10:42","AHU","CO₂ threshold exceeded","R&D-L2","Warning"],["10:36","VAV","Airflow deviation detected","R&D-L3","Warning"],["10:28","Chiller","Efficiency recalculated","Plant","Normal"],["10:15","FCU","Maintenance runtime updated","Lab Support","Info"]]} /></div></AirportPanel>
    </div>
  </>;
}

function EboCommandCenter({ selected, onSelect }: { selected: BMSEquipment; onSelect: (id: string) => void }) {
  const { language } = useAirportLanguage();
  const vi = language === "vi";
  return <>
    <div className="grid grid-cols-3 gap-2 xl:grid-cols-6">
      {[[vi ? "Máy chủ EBO" : "EBO servers", "3 / 3", "Online"],[vi ? "Automation Server" : "Automation servers", "24 / 24", "Healthy"],[vi ? "Điểm đang quét" : "Scanning points", "68,420", "6 sec"],[vi ? "Lịch đang chạy" : "Active schedules", "184", "Hospital-wide"],[vi ? "Ghi đè điều khiển" : "Control overrides", "7", "Authorized"],[vi ? "Cảnh báo ưu tiên" : "Priority alarms", "3", "Action"]].map(([a,b,c],i)=><AirportMetricCard key={a} label={a} value={b} trend={c} compact tone={i===5?"amber":"cyan"}/>)}</div>
    <div className="grid gap-4 xl:grid-cols-[260px_1fr]">
      <AirportPanel title={vi ? "Cây hệ thống EBO" : "EBO system tree"}>
        <div className="space-y-1 p-3">
          {[{group:vi?"Khối điều trị cấp tính":"Acute Care Tower", ids:["ahu","fcu","vav"]},{group:vi?"Nhà máy tiện ích trung tâm":"Central Utility Plant",ids:["chiller","plate-heat-exchanger"]},{group:vi?"Trung tâm dữ liệu":"Hospital Data Center",ids:["crah-unit"]}].map(group=><div key={group.group} className="rounded-lg border border-white/[.055] bg-white/[.02] p-2"><p className="mb-1 px-2 py-1 text-[9px] font-semibold uppercase tracking-[.12em] text-slate-500">{group.group}</p>{group.ids.map(id=>{const eq=BMS_EQUIPMENT_LIST.find(e=>e.id===id)!; return <button key={id} onClick={()=>onSelect(id)} className={`flex w-full items-center gap-2 rounded px-2 py-2 text-left text-[10px] ${selected.id===id?"bg-cyan-400/10 text-cyan-200":"text-slate-400 hover:bg-white/[.04] hover:text-white"}`}><span className="h-1.5 w-1.5 rounded-full bg-emerald-300"/>{eq.name}<span className="ml-auto font-mono text-[8px] text-slate-600">{getAssetLocationInfo(id)?.code}</span></button>})}</div>)}
        </div>
      </AirportPanel>
      <EquipmentWorkspace equipment={selected} initialView="monitor" compact />
    </div>
  </>;
}

function EquipmentLibrary({ selected, onSelect }: { selected: BMSEquipment; onSelect: (id: string) => void }) {
  const { language } = useAirportLanguage();
  const vi = language === "vi";
  const [locationEquipment, setLocationEquipment] = useState<BMSEquipment | null>(null);
  return <div className="flex h-full min-h-0 flex-col gap-3">
    <div className="grid flex-none grid-cols-3 gap-2 xl:grid-cols-6">{BMS_EQUIPMENT_LIST.map((equipment, index) => <AirportMetricCard key={equipment.id} label={equipment.name} value={index === 3 ? "18 / 20" : `${24 + index * 18}`} trend={index === 3 ? (vi ? "2 cảnh báo" : "2 alarms") : (vi ? "Đang chạy" : "Running")} compact tone={index === 3 ? "amber" : "emerald"} />)}</div>
    <div className="grid min-h-0 flex-1 items-stretch gap-3 xl:grid-cols-[300px_minmax(0,1fr)] 2xl:grid-cols-[330px_minmax(0,1fr)]">
      <AirportPanel title={vi ? "Thư viện thiết bị BMS" : "BMS equipment library"} subtitle={vi ? "Các model hiện tại được giữ tạm để thay bằng asset bệnh viện" : "Current models are retained temporarily for replacement with hospital assets"} className="h-full">
        <div className="airport-scrollbar grid h-full grid-cols-2 content-start gap-2 overflow-y-auto p-3">
          {BMS_EQUIPMENT_LIST.map((equipment) => <div key={equipment.id} className={`overflow-hidden rounded-xl border transition ${selected.id === equipment.id ? "border-cyan-400/30 bg-cyan-400/[.09]" : "border-white/[.06] bg-white/[.025] hover:bg-white/[.045]"}`}>
            <button onClick={() => onSelect(equipment.id)} className="w-full p-3 text-left">
              <EquipmentIcon equipment={equipment} /><p className="mt-3 text-[11px] font-semibold text-white">{equipment.name}</p><p className="mt-1 text-[9px] text-slate-500">{vi ? equipment.nameVi : equipment.category}</p>
            </button>
            <div className="border-t border-white/[.06] p-2">
              <button onClick={() => { onSelect(equipment.id); setLocationEquipment(equipment); }} className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-cyan-400/15 bg-cyan-400/[.055] px-2 py-2 text-[9px] font-semibold text-cyan-200 transition hover:bg-cyan-400/[.1]"><MapPin size={11}/>{vi ? "Vị trí thiết bị" : "Asset location"}</button>
            </div>
          </div>)}
        </div>
      </AirportPanel>
      <EquipmentWorkspace equipment={selected} initialView="3d" compact />
    </div>
    {locationEquipment && <BMSAssetLocationModal open={Boolean(locationEquipment)} onClose={() => setLocationEquipment(null)} equipment={locationEquipment} info={getAssetLocationInfo(locationEquipment.id)} />}
  </div>;
}

function TerminalZoneOperations({ selected, onSelect }: { selected: BMSEquipment; onSelect: (id: string) => void }) {
  const { language } = useAirportLanguage(); const vi = language === "vi";
  return <>
    <div className="grid grid-cols-3 gap-2 xl:grid-cols-6">{[[vi?"Nhiệt độ trung bình":"Average temperature","23.4°C","Comfort"],[vi?"Độ ẩm":"Humidity","54%","Healthy"],["CO₂","612 ppm","Good"],[vi?"Zone đang phục vụ":"Served zones","148","R&D"],[vi?"Thiết bị hoạt động":"Active equipment","382","98.4%"],[vi?"Zone cảnh báo":"Zones in warning","4","Review"]].map(([a,b,c],i)=><AirportMetricCard key={a} label={a} value={b} trend={c} compact tone={i===5?"amber":"cyan"}/>)}</div>
    <div className="grid gap-4 xl:grid-cols-[.75fr_1.25fr]">
      <AirportPanel title={vi?"Bản đồ zone tiện nghi công trình":"Facility comfort zones"}>
        <div className="grid grid-cols-4 gap-2 p-4">{Array.from({length:24},(_,i)=>{const warn=[6,11,18,21].includes(i); return <button key={i} onClick={()=>toast.info(`T1 Zone ${String.fromCharCode(65+(i%6))}-${Math.floor(i/6)+1}`)} className={`aspect-square rounded-lg border p-2 text-left ${warn?"border-amber-400/25 bg-amber-400/[.08]":"border-cyan-400/15 bg-cyan-400/[.045]"}`}><span className="text-[8px] text-slate-500">ZONE</span><b className="block text-[10px] text-white">{String.fromCharCode(65+(i%6))}-{Math.floor(i/6)+1}</b><span className={`mt-2 block text-[9px] ${warn?"text-amber-200":"text-emerald-300"}`}>{warn?"25.8°C":"23.2°C"}</span></button>})}</div>
      </AirportPanel>
      <div className="space-y-4">
        <div className="flex gap-2">{["fcu","vav"].map(id=>{const eq=BMS_EQUIPMENT_LIST.find(e=>e.id===id)!;return <button key={id} onClick={()=>onSelect(id)} className={`airport-button ${selected.id===id?"!border-cyan-400/30 !bg-cyan-400/10 !text-cyan-200":""}`}>{eq.name}</button>})}</div>
        <EquipmentWorkspace equipment={selected} initialView="control" compact />
      </div>
    </div>
  </>;
}

function EquipmentWorkspace({ equipment, initialView = "monitor", compact = false }: { equipment: BMSEquipment; initialView?: EquipmentView; compact?: boolean }) {
  const { language } = useAirportLanguage();
  const vi = language === "vi";
  const [view, setView] = useState<EquipmentView>(initialView);
  const [enabled, setEnabled] = useState(true);
  const [setpoint, setSetpoint] = useState(equipment.id === "chiller" ? 6 : equipment.id === "crah-unit" ? 18 : 23);
  const [speed, setSpeed] = useState(72);
  const [locationOpen, setLocationOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const info = getAssetLocationInfo(equipment.id);
  const trend = useMemo(() => makeTrend(equipment.id.length, equipment.id === "chiller" ? 58 : 68, equipment.id === "chiller" ? 12 : 8), [equipment.id]);
  const views: Array<[EquipmentView, string]> = [["monitor",vi?"Giám sát":"Monitor"],["2d","2D"],["3d","3D"],["schematic",vi?"Sơ đồ":"Schematic"],["control",vi?"Điều khiển":"Control"]];

  return <>
    <AirportPanel className={`relative flex h-full min-h-0 flex-col overflow-hidden ${compact ? "" : "min-h-[680px]"}`} title={`${equipment.name} · ${vi ? equipment.nameVi : equipment.category}`} subtitle={info ? `${info.code} · ${info.building} · ${info.area}` : equipment.category} action={<AirportStatusBadge status={enabled ? "normal" : "offline"} label={enabled ? (vi?"Đang chạy":"Running") : (vi?"Đã dừng":"Stopped")} />}>
      <div className="flex flex-wrap items-center gap-1 border-b border-white/[.07] px-3 py-2">
        {views.map(([id,label])=><button key={id} onClick={()=>setView(id)} className={`rounded-lg px-3 py-2 text-[10px] font-semibold transition ${view===id?"bg-cyan-400/15 text-cyan-200":"text-slate-500 hover:bg-white/[.04] hover:text-white"}`}>{label}</button>)}
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <button onClick={()=>setLocationOpen(true)} className="airport-button !border-cyan-400/18 !bg-cyan-400/[.055] !text-cyan-200"><MapPin size={12}/>{vi?"Vị trí thiết bị":"Asset location"}</button>
          <button onClick={()=>setInfoOpen(current=>!current)} className={`airport-button ${infoOpen?"!border-cyan-400/28 !bg-cyan-400/[.12] !text-cyan-100":""}`}><Info size={12}/>{vi?"Thông tin asset":"Asset info"}</button>
          <button onClick={()=>toast.success(vi?"Đã đồng bộ dữ liệu EBO mới nhất":"Latest EBO values synchronized")} className="airport-button"><RefreshCcw size={12}/>{vi?"Đồng bộ":"Sync"}</button>
        </div>
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1">
          {view === "monitor" && <MonitorView equipment={equipment} trend={trend} />}
          {view === "2d" && <Equipment2D equipment={equipment} />}
          {view === "3d" && <div className={`${compact ? "h-full min-h-[420px]" : "h-[590px]"} p-3`}><BMS3DModelViewer modelUrl={equipment.modelUrl} equipmentId={equipment.id} equipmentName={equipment.name} accentColor={equipment.accentColor} defaultAnimation={equipment.defaultAnimation} onMeshClick={(mesh)=>toast.info(`${equipment.name} · ${mesh}`)} /></div>}
          {view === "schematic" && <EquipmentSchematic equipment={equipment} />}
          {view === "control" && <ControlView equipment={equipment} enabled={enabled} setEnabled={setEnabled} setpoint={setpoint} setSetpoint={setSetpoint} speed={speed} setSpeed={setSpeed} />}
        </div>
        {infoOpen && <AssetInfoPanel equipment={equipment} info={info} onClose={()=>setInfoOpen(false)} onLocate={()=>setLocationOpen(true)} />}
      </div>
    </AirportPanel>
    <BMSAssetLocationModal open={locationOpen} onClose={()=>setLocationOpen(false)} equipment={equipment} info={info}/>
  </>;
}

function AssetInfoPanel({ equipment, info, onClose, onLocate }: { equipment: BMSEquipment; info?: ReturnType<typeof getAssetLocationInfo>; onClose: () => void; onLocate: () => void }) {
  const { language } = useAirportLanguage(); const vi = language === "vi";
  return <aside className="airport-scrollbar w-[300px] flex-none overflow-y-auto border-l border-white/[.08] bg-[#08172a]/88">
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[.08] bg-[#08172a]/96 px-4 py-3"><div><p className="text-[9px] font-semibold uppercase tracking-[.16em] text-cyan-300">{vi?"Thông tin asset":"Asset information"}</p><p className="mt-0.5 text-[10px] text-slate-500">{info?.code ?? equipment.name}</p></div><button onClick={onClose} className="airport-icon-button !h-8 !w-8"><X size={14}/></button></div>
    <div className="space-y-2 p-3">{[
      [vi?"Mã thiết bị":"Asset ID",info?.code ?? "—"],[vi?"Vị trí":"Location",`${info?.building ?? "—"}, ${info?.floor ?? "—"}`],[vi?"Khu vực":"Area",info?.area ?? "—"],[vi?"Hệ":"System",equipment.category]
    ].map(([label,value])=><div key={label} className="rounded-lg border border-white/[.07] bg-white/[.03] p-3"><p className="text-[9px] text-slate-500">{label}</p><p className="mt-1 text-[10px] font-semibold text-cyan-200">{value}</p></div>)}
    <button onClick={onLocate} className="airport-button mt-1 w-full justify-center !border-cyan-400/22 !bg-cyan-400/[.07] !text-cyan-200"><MapPin size={13}/>{vi?"Vị trí thiết bị":"Asset location"}</button>
    <p className="pt-3 text-[9px] font-semibold uppercase tracking-[.14em] text-slate-600">{vi?"Thông số vận hành":"Operating values"}</p>
    {equipment.parameters.map(parameter=><div key={parameter.key} className="flex items-center justify-between gap-2 rounded-lg border border-white/[.06] bg-white/[.025] px-3 py-2.5"><div className="flex items-center gap-2"><span className={`h-1.5 w-1.5 rounded-full ${parameter.status==="warning"?"bg-amber-300":"bg-emerald-300"}`}/><span className="text-[9px] text-slate-400">{parameter.label}</span></div><b className={`text-[10px] ${parameter.status==="warning"?"text-amber-200":"text-emerald-300"}`}>{String(parameter.value)} <span className="text-[8px] font-normal text-slate-600">{parameter.unit}</span></b></div>)}
    </div>
  </aside>;
}

function MonitorView({ equipment, trend }: { equipment: BMSEquipment; trend: ReturnType<typeof makeTrend> }) {
  const { language } = useAirportLanguage(); const vi=language==="vi";
  return <div className="grid gap-4 p-4 xl:grid-cols-[.9fr_1.1fr]">
    <div className="grid grid-cols-2 gap-2 self-start">{equipment.parameters.map(parameter=><div key={parameter.key} className="rounded-xl border border-white/[.07] bg-white/[.03] p-3"><div className="flex items-start justify-between gap-2"><p className="text-[9px] uppercase tracking-[.1em] text-slate-500">{parameter.label}</p><AirportStatusBadge status={statusFromParameter(parameter)} /></div><p className="mt-3 text-lg font-semibold text-white">{String(parameter.value)} <span className="text-[10px] font-normal text-slate-500">{parameter.unit}</span></p></div>)}</div>
    <div className="space-y-4"><AirportPanel title={vi?"Xu hướng vận hành 24 giờ":"24-hour operational trend"}><div className="p-3"><AirportTrendChart data={trend} height={260} color={equipment.accentColor}/></div></AirportPanel><div className="grid grid-cols-3 gap-2">{[[vi?"Runtime":"Runtime","4,286 h"],[vi?"Cảnh báo":"Alarms","1 active"],[vi?"Lệnh gần nhất":"Last command","10:38:12"]].map(([a,b],i)=><div key={a} className="rounded-lg border border-white/[.06] bg-white/[.025] p-3"><p className="text-[9px] text-slate-500">{a}</p><p className={`mt-1 text-[11px] font-semibold ${i===1?"text-amber-200":"text-white"}`}>{b}</p></div>)}</div></div>
  </div>;
}

function Equipment2D({ equipment }: { equipment: BMSEquipment }) {
  const info = getAssetLocationInfo(equipment.id);
  const nodes = equipment.schematicType === "chiller" ? ["Cooling Tower","Condenser Pump","Chiller","CHW Pump","Terminal Load"] : equipment.schematicType === "phx" ? ["Primary Loop","Plate HEX","Secondary Loop","Terminal Load"] : ["Outdoor Air","Filter","Coil","Fan",equipment.name,"Terminal Zone"];
  return <div className="p-4"><div className="relative min-h-[470px] overflow-hidden rounded-xl border border-cyan-400/15 bg-[#04111f] p-6" style={{backgroundImage:"linear-gradient(rgba(34,211,238,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(34,211,238,.06) 1px,transparent 1px)",backgroundSize:"28px 28px"}}><div className="flex h-full min-h-[390px] items-center justify-center"><div className="flex min-w-[900px] items-center justify-center gap-2">{nodes.map((node,index)=><React.Fragment key={node}><div className={`min-w-[130px] rounded-xl border p-4 text-center ${node===equipment.name?"border-cyan-300/45 bg-cyan-400/[.12]":"border-white/[.09] bg-[#091a2d]"}`}><div className="mx-auto grid h-9 w-9 place-items-center rounded-lg bg-cyan-400/10 text-cyan-300">{index%2?<Gauge size={18}/>:<Fan size={18}/>}</div><p className="mt-3 text-[10px] font-semibold text-white">{node}</p><p className="mt-1 text-[9px] text-emerald-300">{index===0?"Input":"Live"}</p></div>{index<nodes.length-1&&<div className="relative h-[2px] w-14 bg-cyan-400/35"><span className="absolute right-0 top-1/2 -translate-y-1/2 text-cyan-300">▶</span></div>}</React.Fragment>)}</div></div><div className="absolute bottom-4 left-4 rounded-lg border border-white/[.08] bg-[#071426]/90 px-3 py-2 text-[9px] text-slate-400">{info?.code} · {info?.building} · {info?.floor}</div></div></div>;
}

function EquipmentSchematic({ equipment }: { equipment: BMSEquipment }) {
  const vi = useAirportLanguage().language === "vi";
  const rows = equipment.schematicType === "chiller" ? [["CHWS","6.0°C","128 m³/h"],["CHWR","17.5°C","128 m³/h"],["Condenser supply","29.4°C","142 m³/h"],["Condenser return","34.8°C","142 m³/h"]] : equipment.schematicType === "phx" ? [["Primary inlet","45.0°C","82 m³/h"],["Primary outlet","36.5°C","82 m³/h"],["Secondary inlet","28.0°C","76 m³/h"],["Secondary outlet","34.8°C","76 m³/h"]] : [["Outside air","31.2°C","18%"],["Return air","24.2°C","82%"],["Supply air","16.5°C","12,840 m³/h"],["Zone air","23.4°C","Comfort"]];
  return <div className="grid gap-4 p-4 xl:grid-cols-[1.25fr_.75fr]"><div className="relative min-h-[470px] overflow-hidden rounded-xl border border-cyan-400/15 bg-[#04111f] p-5"><div className="absolute inset-0 opacity-40" style={{backgroundImage:"radial-gradient(circle at 1px 1px,rgba(34,211,238,.18) 1px,transparent 0)",backgroundSize:"22px 22px"}}/><div className="relative flex h-full min-h-[420px] flex-col justify-between"><div className="flex items-center justify-between"><SchematicNode label={equipment.name} value="RUN" primary/><SchematicLine/><SchematicNode label={vi?"Bộ điều khiển EBO":"EBO controller"} value="AUTO"/><SchematicLine/><SchematicNode label={vi?"Zone / phụ tải":"Zone / load"} value="ACTIVE"/></div><div className="mx-auto grid w-[72%] grid-cols-2 gap-4">{rows.map(([name,value,flow],index)=><div key={name} className="rounded-xl border border-white/[.08] bg-[#091a2d]/90 p-4"><div className="flex items-center justify-between"><span className="text-[10px] font-semibold text-white">{name}</span><span className={`h-2 w-2 rounded-full ${index===1?"bg-amber-300":"bg-emerald-300"}`}/></div><div className="mt-3 flex justify-between text-[10px]"><span className="text-cyan-200">{value}</span><span className="text-slate-500">{flow}</span></div></div>)}</div><div className="flex items-center justify-between"><SchematicNode label={vi?"Lịch vận hành":"Schedule"} value="OCCUPIED"/><SchematicLine/><SchematicNode label={vi?"Cảnh báo":"Alarm"} value="1 ACTIVE" warning/><SchematicLine/><SchematicNode label={vi?"Historian":"Historian"} value="6 SEC"/></div></div></div><AirportPanel title={vi?"Điểm dữ liệu schematic":"Schematic data points"}><div className="space-y-2 p-3">{equipment.parameters.map(parameter=><div key={parameter.key} className="flex items-center justify-between rounded-lg bg-white/[.03] px-3 py-2.5"><span className="text-[10px] text-slate-400">{parameter.label}</span><div className="flex items-center gap-2"><b className="text-[10px] text-white">{String(parameter.value)} {parameter.unit}</b><AirportStatusBadge status={statusFromParameter(parameter)}/></div></div>)}</div></AirportPanel></div>;
}

function SchematicNode({label,value,primary=false,warning=false}:{label:string;value:string;primary?:boolean;warning?:boolean}){return <div className={`min-w-[160px] rounded-xl border p-4 text-center ${warning?"border-amber-400/25 bg-amber-400/[.08]":primary?"border-cyan-300/35 bg-cyan-400/[.1]":"border-white/[.08] bg-[#091a2d]"}`}><p className="text-[10px] font-semibold text-white">{label}</p><p className={`mt-2 text-[9px] ${warning?"text-amber-200":"text-emerald-300"}`}>{value}</p></div>}
function SchematicLine(){return <div className="relative mx-2 h-[2px] flex-1 bg-cyan-400/25"><span className="absolute right-0 top-1/2 -translate-y-1/2 text-[9px] text-cyan-300">▶</span></div>}

function ControlView({ equipment, enabled, setEnabled, setpoint, setSetpoint, speed, setSpeed }: { equipment: BMSEquipment; enabled: boolean; setEnabled: (v:boolean)=>void; setpoint:number; setSetpoint:(v:number)=>void; speed:number; setSpeed:(v:number)=>void }) {
  const { language }=useAirportLanguage(); const vi=language==="vi";
  const apply=()=>toast.success(vi?`Đã gửi lệnh mô phỏng tới ${equipment.name}`:`Simulated command sent to ${equipment.name}`);
  return <div className="grid gap-4 p-4 xl:grid-cols-[.9fr_1.1fr]"><AirportPanel title={vi?"Điều khiển EBO":"EBO control"} subtitle={vi?"Mọi thao tác trong bản demo đều có phê duyệt và nhật ký":"All demo commands are approval-controlled and audited"}><div className="space-y-4 p-4"><div className="flex items-center justify-between rounded-xl border border-white/[.08] bg-white/[.03] p-4"><div><p className="text-[10px] text-slate-500">{vi?"Trạng thái thiết bị":"Equipment state"}</p><p className="mt-1 text-sm font-semibold text-white">{enabled?(vi?"Đang chạy":"Running"):(vi?"Đã dừng":"Stopped")}</p></div><button onClick={()=>setEnabled(!enabled)} className={`relative h-7 w-14 rounded-full transition ${enabled?"bg-cyan-300":"bg-slate-700"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${enabled?"left-8":"left-1"}`}/></button></div><ControlSlider label={equipment.id==="chiller"?(vi?"Nhiệt độ nước cấp":"Supply water setpoint"):(vi?"Nhiệt độ đặt":"Temperature setpoint")} value={setpoint} min={equipment.id==="chiller"?4:16} max={equipment.id==="chiller"?12:28} unit="°C" onChange={setSetpoint}/><ControlSlider label={vi?"Tốc độ / công suất":"Speed / capacity"} value={speed} min={20} max={100} unit="%" onChange={setSpeed}/><label className="block"><span className="text-[10px] text-slate-500">{vi?"Chế độ vận hành":"Operating mode"}</span><select className="airport-select mt-2 w-full"><option>Auto / EBO Schedule</option><option>Manual Override</option><option>Energy Optimization</option><option>Maintenance</option></select></label><button onClick={apply} className="airport-button w-full justify-center !border-cyan-400/30 !bg-cyan-400/10 !text-cyan-200"><Power size={14}/>{vi?"Áp dụng lệnh mô phỏng":"Apply simulated command"}</button></div></AirportPanel><AirportPanel title={vi?"Liên động và bảo vệ":"Interlocks and protection"}><div className="space-y-2 p-3">{[[vi?"Cho phép từ lịch EBO":"EBO schedule enable","normal"],[vi?"Liên động bơm / quạt":"Pump / fan interlock","normal"],[vi?"Bảo vệ nhiệt độ":"Temperature protection","normal"],[vi?"Mất lưu lượng":"Loss of flow","normal"],[vi?"Ghi đè đang hoạt động":"Active override","warning"],[vi?"Quyền điều khiển":"Control permission","normal"]].map(([label,status],index)=><div key={label} className="flex items-center justify-between rounded-lg border border-white/[.06] bg-white/[.025] p-3"><span className="text-[10px] text-slate-300">{label}</span><AirportStatusBadge status={status as "normal"|"warning"} label={index===4?(vi?"7 phút còn lại":"7 min left"):(vi?"Sẵn sàng":"Ready")}/></div>)}</div><div className="border-t border-white/[.07] p-4"><p className="text-[9px] uppercase tracking-[.12em] text-slate-600">{vi?"Nhật ký lệnh gần nhất":"Recent command audit"}</p><div className="mt-3 space-y-2 text-[10px] text-slate-400"><p>10:38:12 · Setpoint {setpoint}°C · Demo operator</p><p>10:21:04 · Mode AUTO · EBO Schedule</p><p>09:58:42 · Alarm acknowledged · HVAC Ops</p></div></div></AirportPanel></div>;
}
function ControlSlider({label,value,min,max,unit,onChange}:{label:string;value:number;min:number;max:number;unit:string;onChange:(v:number)=>void}){return <label className="block rounded-xl border border-white/[.07] bg-white/[.025] p-4"><span className="flex justify-between text-[10px] text-slate-500"><span>{label}</span><b className="text-white">{value}{unit}</b></span><input type="range" min={min} max={max} value={value} onChange={e=>onChange(Number(e.target.value))} className="mt-4 w-full accent-cyan-300"/></label>}

function BmsFloorPlan(){const {language}=useAirportLanguage();const vi=language==="vi";const[mode,setMode]=useState<"2d"|"3d">("2d");return <AirportPanel title={vi?"Mặt bằng HVAC Trung tâm R&D":"R&D Center HVAC floor plan"} subtitle={vi?"Chuyển đổi giữa mặt bằng 2D và model 3D được kế thừa từ hệ BMS trước":"Switch between the 2D plan and inherited BMS 3D floor model"} action={<div className="flex rounded-lg border border-white/[.08] bg-white/[.03] p-1">{(["2d","3d"] as const).map(item=><button key={item} onClick={()=>setMode(item)} className={`rounded px-3 py-1.5 text-[9px] font-bold uppercase ${mode===item?"bg-cyan-300 text-slate-950":"text-slate-500"}`}>{item}</button>)}</div>}><div className="h-[650px] p-3">{mode==="3d"?<BMSModelViewer modelUrl={FLOORPLAN_3D_MODEL_URL} accentColor="#22d3ee"/>:<TerminalFloorPlan2D/>}</div></AirportPanel>}
function TerminalFloorPlan2D(){return <div className="relative h-full overflow-hidden rounded-xl border border-cyan-400/15 bg-[#04111f]" style={{backgroundImage:"linear-gradient(rgba(34,211,238,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(34,211,238,.06) 1px,transparent 1px)",backgroundSize:"26px 26px"}}><div className="absolute inset-[8%] rounded-[42px] border-2 border-cyan-400/25 bg-cyan-400/[.025]"><div className="absolute left-[8%] right-[8%] top-[18%] h-[18%] rounded-2xl border border-white/[.08] bg-[#091a2d]"><span className="absolute left-4 top-3 text-[10px] font-semibold text-white">R&D LABS · CLEANROOM SUPPORT</span></div><div className="absolute bottom-[14%] left-[8%] top-[42%] w-[25%] rounded-2xl border border-white/[.08] bg-[#091a2d]"><span className="absolute left-4 top-3 text-[10px] font-semibold text-white">LAB SUPPORT · ZONE B</span></div><div className="absolute bottom-[14%] left-[37%] right-[8%] top-[42%] rounded-2xl border border-white/[.08] bg-[#091a2d]"><span className="absolute left-4 top-3 text-[10px] font-semibold text-white">INNOVATION WORKSPACE</span></div>{[[20,26,"AHU-01"],[27,63,"FCU-18"],[51,58,"VAV-05"],[72,58,"VAV-12"],[82,28,"AHU-04"]].map(([x,y,name])=><button key={String(name)} onClick={()=>toast.info(String(name))} className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/40 bg-cyan-300/15 p-2 text-[8px] font-semibold text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,.25)]" style={{left:`${x}%`,top:`${y}%`}}>{name}</button>)}</div><div className="absolute bottom-4 left-4 rounded-lg border border-white/[.08] bg-[#071426]/90 px-3 py-2 text-[9px] text-slate-400">R&D Center · Level 2 · HVAC points live</div></div>}

function SchematicCenter({selected,onSelect}:{selected:BMSEquipment;onSelect:(id:string)=>void}){return <><div className="flex flex-wrap gap-2">{BMS_EQUIPMENT_LIST.map(eq=><button key={eq.id} onClick={()=>onSelect(eq.id)} className={`airport-button ${selected.id===eq.id?"!border-cyan-400/30 !bg-cyan-400/10 !text-cyan-200":""}`}>{eq.name}</button>)}</div><AirportPanel title={`${selected.name} · System schematic`}><EquipmentSchematic equipment={selected}/></AirportPanel></>}

function AssetLocationCenter({selected,onSelect}:{selected:BMSEquipment;onSelect:(id:string)=>void}){const {language}=useAirportLanguage();const vi=language==="vi";const info=ASSET_LOCATION_INFO[selected.id];return <div className="grid gap-4 xl:grid-cols-[260px_1fr_300px]"><AirportPanel title={vi?"Tài sản":"Assets"}><div className="space-y-1 p-3">{BMS_EQUIPMENT_LIST.map(eq=><button key={eq.id} onClick={()=>onSelect(eq.id)} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[10px] ${selected.id===eq.id?"bg-cyan-400/10 text-cyan-200":"text-slate-400 hover:bg-white/[.04]"}`}><MapPin size={13}/>{eq.name}</button>)}</div></AirportPanel><AirportPanel title={vi?"Model vị trí tài sản":"Asset location model"}><div className="h-[620px] p-3"><BMSModelViewer modelUrl={ASSET_LOCATION_MODEL_URL} accentColor={selected.accentColor}/></div></AirportPanel><AirportPanel title={vi?"Thông tin vị trí":"Location details"}><div className="space-y-2 p-3">{info&&Object.entries(info).filter(([key])=>key!=="locationObjectName").map(([key,value])=><div key={key} className="rounded-lg border border-white/[.06] bg-white/[.025] p-3"><p className="text-[9px] uppercase tracking-[.1em] text-slate-600">{key}</p><p className="mt-1 text-[10px] font-semibold text-white">{value}</p></div>)}<div className="mt-4"><p className="text-[9px] uppercase tracking-[.1em] text-slate-600">{vi?"Các tầng / khu vực có thiết bị":"Available locations"}</p><div className="mt-2 space-y-1">{getAvailableFloors(selected.id).map(floor=><div key={floor.id} className="rounded bg-white/[.03] px-3 py-2 text-[10px] text-slate-300">{floor.name}</div>)}</div></div></div></AirportPanel></div>}

function BmsAlarmCenter(){const {language}=useAirportLanguage();const vi=language==="vi";const[selected,setSelected]=useState(BMS_ALARMS[0]);return <><div className="grid grid-cols-3 gap-2 xl:grid-cols-6">{[[vi?"Cảnh báo mở":"Open alarms","18","3 high"],[vi?"Chưa xác nhận":"Unacknowledged","4","Action"],[vi?"Trong SLA":"Within SLA","94.8%","Healthy"],[vi?"Thời gian xác nhận":"Acknowledge time","42 sec","Median"],[vi?"Cảnh báo hôm nay":"Alarms today","286","-8%"],[vi?"Đã đóng":"Closed","268","93.7%"]].map(([a,b,c],i)=><AirportMetricCard key={a} label={a} value={b} trend={c} compact tone={i<2?"amber":"cyan"}/>)}</div><div className="grid gap-4 xl:grid-cols-[1.3fr_.7fr]"><AirportPanel title={vi?"Hàng đợi cảnh báo EBO":"EBO alarm queue"}><div className="overflow-auto"><table className="w-full min-w-[900px] text-left text-[10px]"><thead className="bg-[#0a192c] text-[8px] uppercase tracking-[.11em] text-slate-500"><tr>{["ID","Time","Priority","Asset","Message","State","Owner"].map(h=><th key={h} className="px-3 py-2">{h}</th>)}</tr></thead><tbody>{BMS_ALARMS.map(alarm=><tr key={alarm.id} onClick={()=>setSelected(alarm)} className={`cursor-pointer border-t border-white/[.05] text-slate-300 hover:bg-cyan-400/[.04] ${selected.id===alarm.id?"bg-cyan-400/[.07]":""}`}><td className="px-3 py-3 font-mono text-cyan-300">{alarm.id}</td><td>{alarm.time}</td><td><AirportStatusBadge status={alarm.priority==="High"?"critical":alarm.priority==="Medium"?"warning":"info"} label={alarm.priority}/></td><td>{alarm.asset}</td><td>{alarm.message}</td><td>{alarm.state}</td><td>{alarm.owner}</td></tr>)}</tbody></table></div></AirportPanel><AirportPanel title={selected.id}><div className="space-y-3 p-4"><AirportStatusBadge status={selected.priority==="High"?"critical":selected.priority==="Medium"?"warning":"info"} label={selected.priority}/><h3 className="text-sm font-semibold text-white">{selected.message}</h3>{[[vi?"Tài sản":"Asset",selected.asset],[vi?"Trạng thái":"State",selected.state],[vi?"Chủ trì":"Owner",selected.owner],[vi?"Thời gian":"Time",selected.time]].map(([a,b])=><div key={a} className="flex justify-between border-b border-white/[.06] pb-2 text-[10px]"><span className="text-slate-500">{a}</span><b className="text-white">{b}</b></div>)}<button onClick={()=>toast.success(vi?"Đã xác nhận cảnh báo trong bản demo":"Alarm acknowledged in demo")} className="airport-button w-full justify-center"><CheckCircle2 size={13}/>{vi?"Xác nhận cảnh báo":"Acknowledge alarm"}</button></div></AirportPanel></div></>}

function BmsTrends(){const {language}=useAirportLanguage();const vi=language==="vi";const[metric,setMetric]=useState("temperature");const trend=metric==="power"?makeTrend(4,62,18):metric==="flow"?makeTrend(8,76,12):makeTrend(2,23,2.4);return <><div className="grid grid-cols-3 gap-2 xl:grid-cols-6">{[[vi?"Điểm lưu trữ":"Historian points","68,420","6 sec"],[vi?"Lưu trữ":"Retention","5 years","Online"],[vi?"Mẫu hôm nay":"Samples today","148M","Live"],[vi?"Dữ liệu tốt":"Data quality","98.1%","Healthy"],[vi?"Mô hình năng lượng":"Energy models","12","Active"],[vi?"Báo cáo tự động":"Auto reports","28","Scheduled"]].map(([a,b,c],i)=><AirportMetricCard key={a} label={a} value={b} trend={c} compact tone={i===3?"emerald":"cyan"}/>)}</div><AirportPanel title={vi?"Xu hướng BMS & phân tích":"BMS trends and analytics"} action={<select value={metric} onChange={e=>setMetric(e.target.value)} className="airport-select"><option value="temperature">Temperature</option><option value="power">Power</option><option value="flow">Flow</option></select>}><div className="p-4"><AirportTrendChart data={trend} height={330} color={metric==="power"?"#fbbf24":metric==="flow"?"#22d3ee":"#a78bfa"} unit={metric==="temperature"?"°C":metric==="power"?"%":"%"}/></div></AirportPanel><div className="grid gap-4 xl:grid-cols-3">{[[vi?"Hiệu suất chiller":"Chiller efficiency","0.62 kW/RT","-4.8%"],[vi?"Chênh áp AHU":"AHU pressure drop","184 Pa","Stable"],[vi?"Tiện nghi zone":"Zone comfort","94.2%","+1.2 pt"]].map(([a,b,c],i)=><AirportPanel key={a} title={a}><div className="p-4"><p className="text-2xl font-semibold text-white">{b}</p><p className={`mt-2 text-[10px] ${i===0?"text-emerald-300":"text-cyan-300"}`}>{c}</p></div></AirportPanel>)}</div></>}

function EquipmentIcon({ equipment }: { equipment: BMSEquipment }) {
  const cls="h-9 w-9";
  if(equipment.id==="chiller")return <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300"><Snowflake className={cls}/></span>;
  if(equipment.id==="ahu"||equipment.id==="fcu"||equipment.id==="crah-unit")return <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300"><Fan className={cls}/></span>;
  if(equipment.id==="vav")return <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-400/10 text-blue-300"><AirVent className={cls}/></span>;
  return <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-400/10 text-violet-300"><Waves className={cls}/></span>;
}
