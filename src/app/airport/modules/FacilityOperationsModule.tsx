import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity, AlertTriangle, BatteryCharging, Building2, Camera, Car, CheckCircle2,
  CircleGauge, DoorOpen, Droplets, ArrowUpDown, Fan, Flame, Gauge, Lightbulb,
  LockKeyhole, MonitorCog, Network, ParkingCircle, Server, ShieldCheck,
  Siren, Sparkles, TrendingUp, Video, Waves, Zap, Play, Pause, RotateCcw,
  SlidersHorizontal, Radio, History, ClipboardCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  AirportMetricCard, AirportPanel, AirportStatusBadge, AirportTimeline, AirportTrendChart,
} from "../shared/AirportUI";
import { useAirportLanguage } from "../i18n/AirportLanguage";
import { BmsOperationsModule } from "./BmsOperationsModule";
import { EboOperationalModal, type EboDetailField } from "./ebo/EboOperationalModal";

const makeTrend = (seed = 0, base = 60, amplitude = 10) => Array.from({ length: 24 }, (_, index) => ({
  time: `${String(index).padStart(2, "0")}:00`,
  value: Number((base + Math.sin((index + seed) / 3) * amplitude + ((index * 11 + seed * 7) % 5)).toFixed(1)),
  forecast: index > 17 ? Number((base + Math.sin((index + seed + 1) / 3) * amplitude * 0.82 + 2).toFixed(1)) : undefined,
}));

const SYSTEM_HEALTH = [
  ["BMS / HVAC", "2,486 devices", "99.4%", "9 alarms"],
  ["Power / EMS", "1,842 meters", "99.9%", "4 alarms"],
  ["CCTV / VMS", "684 cameras", "99.4%", "4 degraded"],
  ["Access Control", "428 doors", "99.6%", "2 offline"],
  ["Smart Parking", "860 spaces", "99.1%", "8 sensors"],
  ["Fire & Life Safety", "4,824 devices", "99.97%", "2 supervisory"],
  ["Water & Utilities", "980 points", "99.8%", "3 warnings"],
  ["Lighting", "3,860 circuits", "99.7%", "12 lamps"],
  ["Vertical Transport", "36 units", "99.1%", "2 service"],
] as const;

export function FacilityOperationsModule({ sectionId }: { sectionId: string }) {
  let content: React.ReactNode;
  if (sectionId === "facility-ops-overview") content = <FacilityOpsOverview />;
  else if (sectionId === "ebo-command") content = <IntegratedEboCommand />;
  else if (sectionId === "bms-hvac") content = <BmsOperationsModule sectionId="hvac-equipment" />;
  else if (sectionId === "bms-chiller-plant") content = <BmsOperationsModule sectionId="chiller-plant" />;
  else if (sectionId === "bms-floor-plan") content = <BmsOperationsModule sectionId="floor-plan" />;
  else if (sectionId === "energy-power") content = <EnergyPowerOperations />;
  else if (sectionId === "clinical-environment") content = <ClinicalEnvironmentOperations />;
  else if (sectionId === "cctv-vms-ebo") content = <CctvVmsOperations />;
  else if (sectionId === "access-control-ebo") content = <AccessControlOperations />;
  else if (sectionId === "smart-parking-ebo") content = <SmartParkingOperations />;
  else if (sectionId === "fire-life-safety-ebo") content = <FireLifeSafetyOperations />;
  else if (sectionId === "water-utilities-ebo") content = <WaterUtilitiesOperations />;
  else if (sectionId === "lighting-ebo") content = <LightingOperations />;
  else if (sectionId === "vertical-transport-ebo") content = <VerticalTransportOperations />;
  else if (sectionId === "ebo-alarms-events") content = <CrossDomainAlarmCenter />;
  else if (sectionId === "ebo-trends-reports") content = <FacilityTrendsReports />;
  else content = <FacilityOpsOverview />;

  const fullHeight = sectionId === "bms-hvac";
  return (
    <div className={fullHeight
      ? "h-full min-h-0"
      : "airport-scrollbar h-full min-h-0 space-y-4 overflow-y-auto pb-5 pr-1"
    }>
      {content}
    </div>
  );
}

function FacilityOpsOverview() {
  const { language } = useAirportLanguage();
  const vi = language === "vi";
  return <>
    <div className="grid grid-cols-3 gap-2 xl:grid-cols-6">
      {[
        [vi ? "Hệ thống tích hợp" : "Integrated systems", "9", "EBO facility domains"],
        [vi ? "Điểm dữ liệu trực tiếp" : "Live data points", "68,420", "6 sec freshness"],
        [vi ? "Thiết bị đang vận hành" : "Operating devices", "18,642", "99.1% online"],
        [vi ? "Cảnh báo đang mở" : "Open alarms", "48", "4 high priority"],
        [vi ? "Lệnh điều khiển hôm nay" : "Commands today", "1,286", "100% audited"],
        [vi ? "SLA vận hành" : "Operational SLA", "97.8%", "+1.2 pt"],
      ].map(([a,b,c], index) => <AirportMetricCard key={a} label={a} value={b} trend={c} compact tone={index === 3 ? "amber" : index === 5 ? "emerald" : "cyan"} />)}
    </div>

    <div className="grid gap-4 xl:grid-cols-[1.28fr_.72fr]">
      <AirportPanel title={vi ? "Bức tranh vận hành cơ sở vật chất bệnh viện" : "Hospital facility operations picture"} subtitle={vi ? "EBO hợp nhất BMS, EMS, CCTV, ACS, Parking, môi trường lâm sàng và các hệ kỹ thuật" : "EBO unifies BMS, EMS, CCTV, ACS, parking, clinical environments and technical systems"}>
        <div className="grid grid-cols-3 gap-3 p-4">
          {SYSTEM_HEALTH.map(([name, scope, availability, alarms], index) => <button key={name} onClick={() => toast.info(`${name} · ${scope}`)} className="rounded-xl border border-white/[.07] bg-white/[.025] p-4 text-left transition hover:border-cyan-400/20 hover:bg-cyan-400/[.045]">
            <div className="flex items-start justify-between gap-3"><FacilityIcon index={index}/><AirportStatusBadge status={index === 2 || index === 4 ? "warning" : "normal"} /></div>
            <p className="mt-3 text-[11px] font-semibold text-white">{name}</p>
            <p className="mt-1 text-[9px] text-slate-500">{scope}</p>
            <div className="mt-3 flex items-center justify-between text-[9px]"><span className="text-emerald-300">{availability}</span><span className="text-slate-500">{alarms}</span></div>
          </button>)}
        </div>
      </AirportPanel>
      <AirportPanel title={vi ? "Tình trạng nền tảng EBO" : "EBO platform posture"}>
        <div className="space-y-2 p-3">
          {[
            ["Enterprise Server", "3 / 3", "normal"], ["Automation Servers", "24 / 24", "normal"],
            ["BACnet/IP networks", "18 / 18", "normal"], ["Modbus gateways", "12 / 12", "normal"],
            ["WorkStation / WebStation", "126 sessions", "normal"], ["Video / security integrations", "1,284 streams", "warning"],
            ["Alarm routing", "7 pending", "warning"], ["Schedules & trend logs", "124,860 points", "normal"],
            ["Role-based control audit", "100% captured", "normal"],
          ].map(([name, value, status]) => <div key={name} className="flex items-center justify-between rounded-lg border border-white/[.06] bg-white/[.025] p-3"><span className="text-[10px] text-slate-300">{name}</span><div className="flex items-center gap-2"><b className="text-[10px] text-white">{value}</b><AirportStatusBadge status={status as "normal" | "warning"}/></div></div>)}
        </div>
      </AirportPanel>
    </div>

    <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
      <AirportPanel title={vi ? "Hiệu suất facility 24 giờ" : "Facility performance · 24 hours"}><div className="p-3"><AirportTrendChart data={makeTrend(4, 78, 8)} height={255} color="#22d3ee" unit="%" /></div></AirportPanel>
      <AirportPanel title={vi ? "Sự kiện liên hệ thống" : "Cross-system events"}><div className="p-3"><AirportTimeline events={[
        ["11:42","BMS","AHU Ward-L6 CO₂ above comfort threshold","Acute Care Tower","Warning"],
        ["11:38","EMS","Hospital demand peak forecast","12.8 MW","Warning"],
        ["11:31","CCTV","Emergency entrance camera analytics event","Emergency Entrance","Critical"],
        ["11:24","ACS","Restricted operating-theatre credential denied","Operating Theatre Access OR-04","Info"],
        ["11:16","Parking","Visitor parking occupancy reached 88%","Hospital Logistics Dock","Warning"],
      ]} /></div></AirportPanel>
    </div>
  </>;
}

function IntegratedEboCommand() {
  const { language } = useAirportLanguage();
  const vi = language === "vi";
  const [active, setActive] = useState("BMS / HVAC");
  const trend = useMemo(() => makeTrend(active.length, active.includes("Power") ? 68 : 82, 10), [active]);
  return <>
    <div className="grid grid-cols-3 gap-2 xl:grid-cols-6">
      {[
        [vi ? "EBO servers" : "EBO servers", "3 / 3", "Online"], [vi ? "Automation servers" : "Automation servers", "24 / 24", "Healthy"],
        [vi ? "Điểm đang quét" : "Scanning points", "124,860", "6 sec"], [vi ? "Lịch vận hành" : "Active schedules", "486", "Hospital-wide"],
        [vi ? "Override đang hoạt động" : "Active overrides", "12", "Authorized"], [vi ? "Cảnh báo ưu tiên" : "Priority alarms", "7", "Action"],
      ].map(([a,b,c], i) => <AirportMetricCard key={a} label={a} value={b} trend={c} compact tone={i === 5 ? "amber" : "cyan"} />)}
    </div>
    <div className="grid min-h-[690px] gap-4 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
      <AirportPanel title={vi ? "Cây hệ thống EBO" : "EBO system tree"} className="h-full">
        <div className="space-y-1 p-3">{SYSTEM_HEALTH.map(([name, scope], index) => <button key={name} onClick={() => setActive(name)} className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition ${active === name ? "border-cyan-400/25 bg-cyan-400/10 text-white" : "border-transparent text-slate-400 hover:border-white/[.06] hover:bg-white/[.035]"}`}><FacilityIcon index={index}/><span className="min-w-0"><span className="block text-[10px] font-semibold">{name}</span><span className="mt-0.5 block truncate text-[8px] text-slate-600">{scope}</span></span></button>)}</div>
      </AirportPanel>
      <AirportPanel title={`${active} · ${vi ? "Không gian điều hành" : "Operational workspace"}`} subtitle={vi ? "Giám sát, xu hướng, lệnh và trạng thái theo thời gian thực" : "Live monitoring, trends, commands and state"} className="h-full">
        <div className="grid h-full min-h-[620px] grid-rows-[auto_1fr_auto] gap-3 p-4">
          <div className="grid grid-cols-4 gap-2">{[["Availability","99.2%"],["Active points","18,420"],["Open alarms","18"],["Control mode","AUTO"]].map(([a,b], i) => <div key={a} className="rounded-lg border border-white/[.07] bg-white/[.03] p-3"><p className="text-[9px] text-slate-500">{a}</p><p className={`mt-1 text-sm font-semibold ${i === 2 ? "text-amber-200" : "text-white"}`}>{b}</p></div>)}</div>
          <div className="rounded-xl border border-white/[.07] bg-[#04111f] p-3"><AirportTrendChart data={trend} height={360} color="#22d3ee" unit="%" /></div>
          <div className="grid grid-cols-4 gap-2">{["Acknowledge alarms","Open schematic","Create work order","Export event log"].map((label, i) => <button key={label} onClick={() => toast.success(`${label} · demo`)} className={`rounded-lg border p-3 text-[9px] font-semibold ${i === 0 ? "border-amber-400/20 bg-amber-400/[.07] text-amber-200" : "border-cyan-400/15 bg-cyan-400/[.045] text-cyan-200"}`}>{label}</button>)}</div>
        </div>
      </AirportPanel>
      <AirportPanel title={vi ? "Live alarms & commands" : "Live alarms & commands"} className="h-full">
        <div className="space-y-2 p-3">{[
          ["11:42","High","AHU T1-L2","CO₂ above threshold"],["11:38","Medium","MDB-02","Demand peak forecast"],
          ["11:31","Critical","CAM-P07","Emergency Entrance correlation"],["11:24","Info","ACS-A04","Credential denied"],
          ["11:16","Medium","PARK-P2","Occupancy 88%"],["11:09","Low","LGT-T1-18","Lamp group degraded"],
        ].map(([time, priority, asset, message]) => <button key={`${time}-${asset}`} onClick={() => toast.info(`${asset}: ${message}`)} className="w-full rounded-lg border border-white/[.06] bg-white/[.025] p-3 text-left"><div className="flex items-center justify-between"><span className="font-mono text-[9px] text-cyan-300">{time}</span><AirportStatusBadge status={priority === "Critical" ? "critical" : priority === "High" || priority === "Medium" ? "warning" : "info"} label={priority}/></div><p className="mt-2 text-[10px] font-semibold text-white">{asset}</p><p className="mt-1 text-[9px] text-slate-500">{message}</p></button>)}</div>
      </AirportPanel>
    </div>
  </>;
}

function EnergyPowerOperations() {
  const { language } = useAirportLanguage();
  const vi = language === "vi";
  const [source, setSource] = useState("Grid A");
  const [selected, setSelected] = useState<{ name: string; value: string; state: string } | null>(null);
  const sources = [
    { name: "Grid A", value: "6.8 MW", state: "Available" },
    { name: "Grid B", value: "6.0 MW", state: "Available" },
    { name: "Generator G1-G8", value: "0 MW", state: "Standby" },
    { name: "UPS Data Center", value: "82% load", state: "Online" },
    { name: "Road & Public Lighting", value: "1.4 MW", state: "Online" },
    { name: "R&D Labs & Cleanrooms", value: "2.1 MW", state: "Online" },
  ];
  return <>
    <div className="grid grid-cols-3 gap-2 xl:grid-cols-6">{[
      [vi?"Nhu cầu hiện tại":"Current demand","12.8 MW","-3.1%"],[vi?"Công suất đỉnh":"Peak demand","15.4 MW","19:10"],
      [vi?"Năng lượng hôm nay":"Energy today","186 MWh","+4.2%"],["PUE","1.42","Mini DC"],[vi?"Máy phát sẵn sàng":"Generators ready","8 / 8","N+1"],[vi?"UPS khả dụng":"UPS availability","99.99%","2N"],
    ].map(([a,b,c],i)=><AirportMetricCard key={a} label={a} value={b} trend={c} compact tone={i===1?"amber":i===5?"emerald":"cyan"}/>)}</div>
    <div className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
      <AirportPanel title={vi?"Sơ đồ điện một sợi bệnh viện":"Hospital single-line power diagram"} action={<select value={source} onChange={e=>setSource(e.target.value)} className="airport-select"><option>Grid A</option><option>Grid B</option><option>Generator Bus</option><option>UPS Bus</option></select>}>
        <div className="relative min-h-[520px] overflow-hidden p-5" style={{backgroundImage:"radial-gradient(circle at 1px 1px,rgba(34,211,238,.12) 1px,transparent 0)",backgroundSize:"22px 22px"}}>
          <div className="grid h-full min-h-[470px] grid-cols-5 items-center gap-3">{[
            [source,"110 kV","normal"],["Transformer TR-01","40 MVA","normal"],["Main Bus MDB-A","22 kV","normal"],["Distribution","8 substations","normal"],["Park Critical Loads","12.8 MW","warning"],
          ].map(([name,value,status],index)=><React.Fragment key={name}><button onClick={()=>setSelected({name,value,state:status})} className={`rounded-xl border p-4 text-center ${index===4?"border-amber-400/25 bg-amber-400/[.08]":"border-cyan-400/18 bg-cyan-400/[.055]"}`}><Zap className="mx-auto text-cyan-300" size={20}/><p className="mt-3 text-[10px] font-semibold text-white">{name}</p><p className="mt-2 text-[9px] text-emerald-300">{value}</p><AirportStatusBadge status={status as "normal"|"warning"}/></button>{index<4&&<div className="h-[2px] bg-cyan-400/30"><span className="float-right -mt-2 text-cyan-300">▶</span></div>}</React.Fragment>)}</div>
        </div>
      </AirportPanel>
      <AirportPanel title={vi?"Nguồn và phụ tải trọng yếu":"Sources and critical loads"}><div className="space-y-2 p-3">{sources.map((item,i)=><button key={item.name} onClick={()=>setSelected(item)} className="w-full rounded-lg border border-white/[.06] bg-white/[.025] p-3 text-left"><div className="flex items-center justify-between"><p className="text-[10px] font-semibold text-white">{item.name}</p><AirportStatusBadge status={i===2?"info":"normal"} label={item.state}/></div><p className="mt-2 text-[9px] text-slate-500">{item.value}</p></button>)}</div></AirportPanel>
    </div>
    <AirportPanel title={vi?"Xu hướng công suất và dự báo":"Power demand and forecast"}><div className="p-3"><AirportTrendChart data={makeTrend(7,64,16)} height={285} color="#fbbf24" unit="%"/></div></AirportPanel>
    <EboOperationalModal open={Boolean(selected)} onClose={()=>setSelected(null)} title={selected?.name ?? "Power asset"} subtitle="PME / EBO integrated electrical context" status={selected?.state==="warning"?"warning":"normal"} statusLabel={selected?.state ?? "Online"} fields={[
      {label:"Electrical value",value:selected?.value ?? "—",tone:"normal"},{label:"Source system",value:"EcoStruxure Power Monitoring Expert"},{label:"EBO integration",value:"Read / alarm / command gateway"},{label:"Audit state",value:"Enabled",tone:"normal"},
    ]} footer={<><button onClick={()=>toast.success("Electrical event acknowledged and audit logged")} className="airport-button">Acknowledge</button><button onClick={()=>toast.success("Single-line context opened in demo mode")} className="airport-button !border-cyan-400/20 !bg-cyan-400/[.06] !text-cyan-200">Open single-line</button></>}>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]"><AirportPanel title="Electrical operating profile"><div className="p-3"><AirportTrendChart data={makeTrend(5,72,12)} height={330} color="#fbbf24" unit="%"/></div></AirportPanel><AirportPanel title="Protection and switching state"><div className="space-y-2 p-3">{[["Breaker state","Closed"],["Protection relay","Healthy"],["Power quality","Within limits"],["Control authority","Authorized operator only"],["Last command","12:39:18 · audited"]].map(([a,b])=><div key={a} className="flex justify-between rounded-lg border border-white/[.06] bg-white/[.03] p-3 text-[10px]"><span className="text-slate-500">{a}</span><b className="text-white">{b}</b></div>)}</div></AirportPanel></div>
    </EboOperationalModal>
  </>;
}

const CCTV_STOCK_MEDIA = [
  { sourceId: "30984704", label: "Hospital campus external overview", zone: "Hospital Campus", mediaUrl: "https://videos.pexels.com/video-files/30984701/13246840_640_360_60fps.mp4", posterUrl: "https://images.pexels.com/videos/30984704/industrial-area-30984704.jpeg?auto=compress&cs=tinysrgb&w=640" },
  { sourceId: "9573753", label: "Cleanroom process monitoring", zone: "R&D Cleanroom", mediaUrl: "https://videos.pexels.com/video-files/9573900/9573900-sd_960_506_25fps.mp4", posterUrl: "https://images.pexels.com/videos/9573753/pexels-photo-9573753.jpeg?auto=compress&cs=tinysrgb&w=640" },
  { sourceId: "15170997", label: "Warehouse safety overview", zone: "Hospital Logistics Dock", mediaUrl: "https://videos.pexels.com/video-files/16971219/16971219-sd_360_640_30fps.mp4", posterUrl: "https://images.pexels.com/videos/15170997/action-camera-assemble-assembling-assembly-15170997.jpeg?auto=compress&cs=tinysrgb&w=640" },
  { sourceId: "10472376", label: "Automated parcel sorting", zone: "Distribution Center", mediaUrl: "https://videos.pexels.com/video-files/10472349/10472349-sd_640_360_25fps.mp4", posterUrl: "https://images.pexels.com/videos/10472376/pexels-photo-10472376.jpeg?auto=compress&cs=tinysrgb&w=640" },
  { sourceId: "32243654", label: "Forklift receiving lane", zone: "Material Receiving", mediaUrl: "https://videos.pexels.com/video-files/32243651/13751461_640_360_25fps.mp4", posterUrl: "https://images.pexels.com/videos/32243654/pexels-photo-32243654.jpeg?auto=compress&cs=tinysrgb&w=640" },
  { sourceId: "32268484", label: "Advanced manufacturing hall", zone: "Manufacturing Precinct", mediaUrl: "https://videos.pexels.com/video-files/32268483/13762749_640_360_60fps.mp4", posterUrl: "https://images.pexels.com/videos/32268484/pexels-photo-32268484.jpeg?auto=compress&cs=tinysrgb&w=640" },
  { sourceId: "34799017", label: "Green industry perimeter", zone: "Solar Manufacturing Campus", mediaUrl: "https://videos.pexels.com/video-files/34788653/14749917_640_360_60fps.mp4", posterUrl: "https://images.pexels.com/videos/34799017/pexels-photo-34799017.jpeg?auto=compress&cs=tinysrgb&w=640" },
  { sourceId: "8381457", label: "Biosafety laboratory", zone: "Research Laboratory", mediaUrl: "https://videos.pexels.com/video-files/8381449/8381449-sd_640_360_25fps.mp4", posterUrl: "https://images.pexels.com/videos/8381457/pexels-photo-8381457.jpeg?auto=compress&cs=tinysrgb&w=640" },
  { sourceId: "4292581", label: "Warehouse aisle monitoring", zone: "Central Warehouse", mediaUrl: "https://videos.pexels.com/video-files/4291724/4291724-sd_640_360_25fps.mp4", posterUrl: "https://images.pexels.com/videos/4292581/pexels-photo-4292581.jpeg?auto=compress&cs=tinysrgb&w=640" },
  { sourceId: "9574128", label: "Precision laboratory workflow", zone: "Innovation Center", mediaUrl: "https://videos.pexels.com/video-files/9573911/9573911-sd_960_506_25fps.mp4", posterUrl: "https://images.pexels.com/videos/9574128/pexels-photo-9574128.jpeg?auto=compress&cs=tinysrgb&w=640" },
  { sourceId: "4291727", label: "Logistics supervision", zone: "Warehouse Control Zone", mediaUrl: "https://videos.pexels.com/video-files/4291726/4291726-sd_640_360_25fps.mp4", posterUrl: "https://images.pexels.com/videos/4291727/pexels-photo-4291727.jpeg?auto=compress&cs=tinysrgb&w=640" },
  { sourceId: "30781300", label: "Hospital campus aerial reference", zone: "Hospital Support Zone", mediaUrl: "https://videos.pexels.com/video-files/30781291/13166473_640_360_60fps.mp4", posterUrl: "https://images.pexels.com/videos/30781300/industrial-area-sonadezi-chau-d-c-30781300.jpeg?auto=compress&cs=tinysrgb&w=640" },
];

function CctvStockVideo({ src, playing, className = "" }: { src: string; playing: boolean; className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (playing) void video.play().catch(() => undefined);
    else video.pause();
  }, [playing, src]);

  return <video ref={videoRef} src={src} muted loop playsInline preload="metadata" className={className} />;
}

function CctvVmsOperations() {
  const { language }=useAirportLanguage();
  const vi=language==="vi";
  const cameras = CCTV_STOCK_MEDIA.map((media,i)=>({id:`CAM-${String(i+1).padStart(3,"0")}`,zone:["Acute Care Tower","Manufacturing Precinct","Emergency Entrance","Hospital Logistics Dock"][i%4],status:[3,9].includes(i)?"Degraded":"Live",event:[2,7].includes(i)?"Analytics event":"Normal",resolution:i%3===0?"4K":"1080p",retention:"30 days",...media}));
  const [selected,setSelected]=useState<(typeof cameras)[number]|null>(null);
  const [playing,setPlaying]=useState(true);
  return <>
    <div className="grid grid-cols-3 gap-2 xl:grid-cols-6">{[[vi?"Camera trực tuyến":"Cameras online","1,272 / 1,284","99.1%"],[vi?"Luồng AI":"AI analytics streams","428","Live"],[vi?"Sự kiện hôm nay":"Events today","2,846","-6%"],[vi?"Camera suy giảm":"Degraded cameras","12","Maintenance"],[vi?"Lưu trữ":"Retention","30 days","Healthy"],[vi?"Độ phủ":"Coverage confidence","98.4%","Hospital-wide"]].map(([a,b,c],i)=><AirportMetricCard key={a} label={a} value={b} trend={c} compact tone={i===3?"amber":"cyan"}/>)}</div>
    <div className="grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
      <AirportPanel title={vi?"Video wall VMS":"VMS video wall"}><div className="grid grid-cols-4 gap-2 p-3">{cameras.map((cam)=><button key={cam.id} onClick={()=>{setSelected(cam);setPlaying(true);}} className="relative aspect-video overflow-hidden rounded-lg border border-white/[.07] bg-[#06111f]"><img src={cam.posterUrl} alt={`${cam.id} · ${cam.label}`} loading="lazy" className="pointer-events-none absolute inset-0 h-full w-full object-cover grayscale contrast-125 saturate-50"/><div className="pointer-events-none absolute inset-0 opacity-20" style={{backgroundImage:"repeating-linear-gradient(0deg,transparent 0,transparent 3px,rgba(34,211,238,.22) 4px)"}}/><div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#04111f]/85 via-transparent to-black/25"/><span className="absolute left-2 top-2 rounded bg-black/55 px-1.5 py-1 font-mono text-[7px] text-cyan-100/80">{cam.label}</span><div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-[#04111f]/75 px-2 py-1.5"><span className="font-mono text-[8px] text-white">{cam.id}</span><span className={`h-1.5 w-1.5 rounded-full ${cam.status==="Live"?"bg-emerald-300":"bg-amber-300"}`}/></div>{cam.event!=="Normal"&&<span className="absolute right-2 top-2 rounded bg-amber-400/15 px-1.5 py-1 text-[7px] text-amber-200">AI EVENT</span>}</button>)}</div></AirportPanel>
      <AirportPanel title={vi?"Sự kiện video ưu tiên":"Priority video events"}><div className="space-y-2 p-3">{[["11:31","Emergency Entrance P-07","Intrusion correlation","97%"],["11:18","Main Gate","Crowd density","86%"],["10:56","Cleanroom Lobby","Unattended object","Review"],["10:42","Logistics Yard North","Vehicle route deviation","Closed"],["10:24","Warehouse Gate 04","Tailgating","Investigating"]].map(([time,zone,event,confidence],i)=><button key={`${time}-${zone}`} className="w-full rounded-lg border border-white/[.06] bg-white/[.025] p-3 text-left" onClick={()=>setSelected(cameras[i])}><div className="flex justify-between"><span className="font-mono text-[9px] text-cyan-300">{time}</span><AirportStatusBadge status={i===0?"critical":i<3?"warning":"info"}/></div><p className="mt-2 text-[10px] font-semibold text-white">{zone}</p><p className="mt-1 text-[9px] text-slate-500">{event} · {confidence}</p></button>)}</div></AirportPanel>
    </div>
    <EboOperationalModal open={Boolean(selected)} onClose={()=>setSelected(null)} eyebrow="VMS integrated operational view" title={`${selected?.id ?? "Camera"} · ${selected?.zone ?? ""}`} subtitle="Video remains governed by the source VMS; EBO presents linked status, events and workflow." status={selected?.status==="Degraded"?"warning":"normal"} statusLabel={selected?.status ?? "Live"} fields={[
      {label:"Camera ID",value:selected?.id ?? "—"},{label:"Zone",value:selected?.zone ?? "—"},{label:"Stream",value:selected?.resolution ?? "—",tone:"normal"},{label:"Analytics",value:selected?.event ?? "—",tone:selected?.event!=="Normal"?"warning":"normal"},{label:"Retention",value:selected?.retention ?? "—"},{label:"Source platform",value:"Hospital VMS"},
    ]} footer={<><button onClick={()=>setPlaying(v=>!v)} className="airport-button">{playing?<Pause size={13}/>:<Play size={13}/>} {playing?"Pause":"Play"}</button><button onClick={()=>toast.success("Snapshot saved to demo incident evidence")} className="airport-button"><Camera size={13}/>Snapshot</button><button onClick={()=>toast.success("Video event assigned to security workflow")} className="airport-button !border-cyan-400/20 !bg-cyan-400/[.06] !text-cyan-200">Create incident</button></>}>
      <div className="grid gap-4 xl:grid-cols-[1.3fr_.7fr]"><div className="relative min-h-[520px] overflow-hidden rounded-xl border border-cyan-400/18 bg-[#06111f]"><CctvStockVideo src={selected?.mediaUrl ?? CCTV_STOCK_MEDIA[0].mediaUrl} playing={playing} className="absolute inset-0 h-full w-full object-cover grayscale-[20%] contrast-125 saturate-75"/><div className="pointer-events-none absolute inset-0 opacity-15" style={{backgroundImage:"repeating-linear-gradient(0deg,transparent 0,transparent 4px,rgba(34,211,238,.2) 5px)"}}/><div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/20"/><div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-lg bg-black/55 px-3 py-2 font-mono text-[9px] text-white"><span className={`h-2 w-2 rounded-full ${playing?"bg-red-400":"bg-slate-500"}`}/>{playing?"REC":"PAUSED"} · {selected?.id} · {selected?.label}</div><div className="pointer-events-none absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-xl border border-white/[.08] bg-black/50 px-3 py-2"><span className="font-mono text-[9px] text-slate-300">12:41:28 · UTC+7</span><span className="text-[9px] text-cyan-200">AI analytics overlay active</span></div></div><AirportPanel title="PTZ, analytics and event history"><div className="grid grid-cols-3 gap-2 p-3">{["Pan left","Tilt up","Zoom +","Home","Auto track","Privacy mask"].map(label=><button key={label} onClick={()=>toast.success(`${label} · demo command audited`)} className="rounded-lg border border-white/[.07] bg-white/[.03] p-3 text-[9px] text-slate-300 hover:border-cyan-400/20 hover:text-cyan-200">{label}</button>)}</div><div className="space-y-2 border-t border-white/[.06] p-3">{[["12:39:18","Motion analytics","Normal"],["12:31:04","Object classification","Person"],["12:16:42","Stream health","Recovered"],["11:58:11","Operator view","Opened"]].map(([time,event,state])=><div key={time} className="flex justify-between rounded-lg bg-white/[.03] p-3 text-[9px]"><span className="font-mono text-cyan-300">{time}</span><span className="text-slate-300">{event}</span><span className="text-emerald-300">{state}</span></div>)}</div></AirportPanel></div>
    </EboOperationalModal>
  </>;
}

function AccessControlOperations(){
  const {language}=useAirportLanguage();
  const vi=language==="vi";
  const rows=[
    {id:"ACS-T1-001",name:"Acute Care Tower main entry",state:"Online",events:"12,840",denied:"0",zone:"Public / Hospital Logistics Dock",policy:"Open policy"},
    {id:"ACS-RES-018",name:"Restricted Production Gate A18",state:"Online",events:"4,286",denied:"2",zone:"Restricted Production",policy:"Permit + role"},
    {id:"ACS-CARGO-04",name:"Warehouse Gate 04",state:"Online",events:"2,148",denied:"5",zone:"Warehouse & Logistics",policy:"Restricted"},
    {id:"ACS-DC-006",name:"Mini DC Zone 06",state:"Online",events:"486",denied:"0",zone:"Critical infrastructure",policy:"Two-factor access"},
    {id:"ACS-ATC-002",name:"ATC secure lobby",state:"Degraded",events:"824",denied:"1",zone:"ATC",policy:"Role + biometric"},
    {id:"ACS-PBB-021",name:"PBB service access",state:"Online",events:"1,286",denied:"0",zone:"Sterile departures",policy:"Staff credential"},
  ];
  const [selected,setSelected]=useState<(typeof rows)[number]|null>(null);
  return <><div className="grid grid-cols-3 gap-2 xl:grid-cols-6">{[[vi?"Điểm kiểm soát":"Access points","842 / 848","99.3%"],[vi?"Thẻ hợp lệ":"Valid credentials","12,480","Hospital-wide"],[vi?"Lượt vào hôm nay":"Access today","186,420","+4.1%"],[vi?"Từ chối":"Denied events","42","Review"],[vi?"Cửa mở lâu":"Held-open doors","3","Action"],[vi?"Anti-passback":"Anti-passback","99.8%","Healthy"]].map(([a,b,c],i)=><AirportMetricCard key={a} label={a} value={b} trend={c} compact tone={i===3||i===4?"amber":"cyan"}/>)}</div><div className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]"><AirportPanel title={vi?"Trạng thái cửa và đầu đọc":"Door and reader status"}><div className="overflow-auto"><table className="w-full min-w-[760px] text-left text-[10px]"><thead className="bg-[#0a192c] text-[8px] uppercase tracking-[.11em] text-slate-500"><tr>{["ID","Access point","State","Events today","Denied"].map(h=><th key={h} className="px-3 py-2">{h}</th>)}</tr></thead><tbody>{rows.map(row=><tr key={row.id} onClick={()=>setSelected(row)} className="cursor-pointer border-t border-white/[.05] text-slate-300 hover:bg-cyan-400/[.04]"><td className="px-3 py-3 font-mono text-cyan-300">{row.id}</td><td>{row.name}</td><td><AirportStatusBadge status={row.state==="Online"?"normal":"warning"} label={row.state}/></td><td>{row.events}</td><td>{row.denied}</td></tr>)}</tbody></table></div></AirportPanel><AirportPanel title={vi?"Quản trị vùng truy cập":"Access-zone governance"}><div className="space-y-2 p-3">{rows.map((row,i)=><button key={row.id} onClick={()=>setSelected(row)} className="w-full rounded-lg border border-white/[.06] bg-white/[.025] p-3 text-left"><div className="flex justify-between"><p className="text-[10px] font-semibold text-white">{row.zone}</p><AirportStatusBadge status={i===2?"warning":"normal"}/></div><p className="mt-2 text-[9px] text-slate-500">{row.policy}</p></button>)}</div></AirportPanel></div>
    <EboOperationalModal open={Boolean(selected)} onClose={()=>setSelected(null)} eyebrow="Security Expert / EBO integrated view" title={selected?.name ?? "Access point"} subtitle={selected?.id} status={selected?.state==="Degraded"?"warning":"normal"} statusLabel={selected?.state ?? "Online"} fields={[
      {label:"Access point",value:selected?.id ?? "—"},{label:"Zone",value:selected?.zone ?? "—"},{label:"Policy",value:selected?.policy ?? "—"},{label:"Events today",value:selected?.events ?? "—"},{label:"Denied",value:selected?.denied ?? "—",tone:Number(selected?.denied ?? 0)>0?"warning":"normal"},{label:"Source platform",value:"EcoStruxure Security Expert"},
    ]} footer={<><button onClick={()=>toast.success("Door unlock command simulated and audit logged")} className="airport-button"><DoorOpen size={13}/>Unlock 30 sec</button><button onClick={()=>toast.success("Door returned to secure state")} className="airport-button"><LockKeyhole size={13}/>Secure</button><button onClick={()=>toast.success("Access incident created")} className="airport-button !border-cyan-400/20 !bg-cyan-400/[.06] !text-cyan-200">Create incident</button></>}>
      <div className="grid gap-4 xl:grid-cols-[.8fr_1.2fr]"><div className="grid min-h-[440px] place-items-center rounded-xl border border-cyan-400/16 bg-[radial-gradient(circle_at_center,#15334b_0,#06111f_70%)]"><div className="text-center"><DoorOpen size={80} className="mx-auto text-cyan-300/70"/><p className="mt-4 text-sm font-semibold text-white">{selected?.name}</p><p className="mt-2 text-[10px] text-emerald-300">Reader online · Door secure</p><p className="mt-1 text-[9px] text-slate-500">Last valid access 12:40:12</p></div></div><AirportPanel title="Recent access events"><div className="overflow-auto"><table className="w-full min-w-[620px] text-left text-[10px]"><thead className="bg-white/[.025] text-[8px] uppercase tracking-[.1em] text-slate-500"><tr>{["Time","Credential","Decision","Reason"].map(h=><th key={h} className="px-3 py-2">{h}</th>)}</tr></thead><tbody>{[["12:40:12","STAFF-4821","Granted","Role and schedule valid"],["12:38:04","VENDOR-104","Denied","Outside approved window"],["12:31:46","STAFF-2188","Granted","Production-zone permit valid"],["12:22:11","VISITOR-88","Denied","Escort required"]].map(row=><tr key={row[0]} className="border-t border-white/[.05] text-slate-300"><td className="px-3 py-3 font-mono text-cyan-300">{row[0]}</td><td>{row[1]}</td><td className={row[2]==="Granted"?"text-emerald-300":"text-amber-300"}>{row[2]}</td><td>{row[3]}</td></tr>)}</tbody></table></div></AirportPanel></div>
    </EboOperationalModal>
  </>;
}

function SmartParkingOperations(){
  const {language}=useAirportLanguage(); const vi=language==="vi";
  const facilities=[62,78,88,54,71,46].map((value,i)=>({id:`P${i+1}`,value,spaces:810-i*24,available:Math.round((810-i*24)*(100-value)/100),state:value>85?"Warning":"Normal"}));
  const [selected,setSelected]=useState<(typeof facilities)[number]|null>(null);
  return <><div className="grid grid-cols-3 gap-2 xl:grid-cols-6">{[[vi?"Tổng chỗ đỗ":"Total spaces","4,860","P1-P6"],[vi?"Còn trống":"Available","1,534","31.6%"],[vi?"Đang sử dụng":"Occupied","3,326","68.4%"],[vi?"Xe vào / giờ":"Entries / hour","842","Peak"],[vi?"Thời gian tìm chỗ":"Search time","3.2 min","-0.8 min"],[vi?"Cảm biến online":"Sensors online","98.8%","34 degraded"]].map(([a,b,c],i)=><AirportMetricCard key={a} label={a} value={b} trend={c} compact tone={i===5?"amber":i===1?"emerald":"cyan"}/>)}</div><div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]"><AirportPanel title={vi?"Mức sử dụng theo khu đỗ":"Occupancy by parking facility"}><div className="grid grid-cols-3 gap-3 p-4">{facilities.map(item=><button key={item.id} onClick={()=>setSelected(item)} className={`rounded-xl border p-4 text-left ${item.value>85?"border-amber-400/25 bg-amber-400/[.08]":"border-cyan-400/16 bg-cyan-400/[.045]"}`}><ParkingCircle size={22} className={item.value>85?"text-amber-300":"text-cyan-300"}/><p className="mt-3 text-[10px] font-semibold text-white">Parking {item.id}</p><p className="mt-1 text-2xl font-semibold text-white">{item.value}%</p><div className="mt-3 h-1.5 overflow-hidden rounded bg-white/[.06]"><div className={`h-full ${item.value>85?"bg-amber-300":"bg-cyan-300"}`} style={{width:`${item.value}%`}}/></div></button>)}</div></AirportPanel><AirportPanel title={vi?"Làn vào ra và hướng dẫn":"Entry, exit and guidance"}><div className="space-y-2 p-3">{[["North entry","18 veh/min","Normal"],["South entry","14 veh/min","Normal"],["P2 guidance","12 spaces mismatch","Warning"],["EV charging","82 / 96 available","Normal"],["Premium parking","76% occupied","Normal"],["Bus / taxi holding","68% occupied","Normal"]].map(([name,value,state],i)=><button key={name} onClick={()=>setSelected(facilities[i%facilities.length])} className="flex w-full items-center justify-between rounded-lg border border-white/[.06] bg-white/[.025] p-3 text-left"><div><p className="text-[10px] font-semibold text-white">{name}</p><p className="mt-1 text-[9px] text-slate-500">{value}</p></div><AirportStatusBadge status={state==="Warning"?"warning":"normal"} label={state}/></button>)}</div></AirportPanel></div>
    <EboOperationalModal open={Boolean(selected)} onClose={()=>setSelected(null)} eyebrow="Parking management integrated view" title={`Parking ${selected?.id ?? ""}`} subtitle="Occupancy, guidance, lane and EV charging operations" status={selected?.state==="Warning"?"warning":"normal"} statusLabel={selected?.state ?? "Normal"} fields={[
      {label:"Capacity",value:selected?.spaces ?? "—"},{label:"Occupancy",value:selected?`${selected.value}%`:"—",tone:selected&&selected.value>85?"warning":"normal"},{label:"Available",value:selected?.available ?? "—",tone:"normal"},{label:"Sensor health",value:"98.8%"},{label:"Entry rate",value:"18 veh/min"},{label:"Integration",value:"PMS / EBO gateway"},
    ]} footer={<><button onClick={()=>toast.success("Dynamic guidance signs refreshed")} className="airport-button">Refresh guidance</button><button onClick={()=>toast.success("Overflow routing scenario activated in demo")} className="airport-button !border-cyan-400/20 !bg-cyan-400/[.06] !text-cyan-200">Activate overflow plan</button></>}>
      <div className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]"><AirportPanel title="Parking occupancy map"><div className="grid grid-cols-12 gap-2 p-4">{Array.from({length:96},(_,i)=>{const occupied=i%100<(selected?.value ?? 0);return <div key={i} className={`aspect-[1.8] rounded border ${occupied?"border-cyan-400/18 bg-cyan-400/[.12]":"border-emerald-400/20 bg-emerald-400/[.06]"}`} title={occupied?"Occupied":"Available"}/>})}</div></AirportPanel><div className="space-y-4"><AirportPanel title="Lane operations"><div className="space-y-2 p-3">{[["Entry lane 01","Open · 9 veh/min"],["Entry lane 02","Open · 9 veh/min"],["Exit lane 01","Open · 7 veh/min"],["ANPR match","98.6%"],["Payment gateway","99.98%"]].map(([a,b])=><div key={a} className="flex justify-between rounded-lg bg-white/[.03] p-3 text-[9px]"><span className="text-slate-500">{a}</span><b className="text-white">{b}</b></div>)}</div></AirportPanel><AirportPanel title="EV charging"><div className="p-3"><AirportTrendChart data={makeTrend(6,58,18)} height={210} color="#34d399" unit="%"/></div></AirportPanel></div></div>
    </EboOperationalModal>
  </>;
}

function FireLifeSafetyOperations(){
  const {language}=useAirportLanguage(); const vi=language==="vi";
  const zones=Array.from({length:42},(_,i)=>({id:`FZ-${String(i+1).padStart(2,"0")}`,state:[11,28].includes(i)?"Supervisory":"Normal",area:["Acute Care Tower","Manufacturing","Logistics","Utility Plant"][i%4],devices:168+i*3}));
  const signals=[
    {id:"SD-T1-284",message:"Smoke detector review",state:"Warning",area:"Acute Care Tower"},{id:"SPK-LOG-04",message:"Sprinkler pressure normal",state:"Normal",area:"Hospital Logistics Dock"},{id:"VES-T1-02",message:"Voice evacuation ready",state:"Normal",area:"Acute Care Tower"},{id:"FACP-CUP-01",message:"Panel normal",state:"Normal",area:"Utility Plant"},{id:"HYD-MFG-12",message:"Hydrant inspected",state:"Normal",area:"Manufacturing"},{id:"STAIR-PRESS-08",message:"Fan test due",state:"Warning",area:"Acute Care Tower"},
  ];
  const [selected,setSelected]=useState<{id:string;state:string;area:string;message?:string;devices?:number}|null>(null);
  return <><div className="grid grid-cols-3 gap-2 xl:grid-cols-6">{[[vi?"Tủ báo cháy":"Fire panels","18 / 18","Normal"],[vi?"Thiết bị online":"Devices online","8,420 / 8,424","99.95%"],[vi?"Tín hiệu giám sát":"Supervisory","2","Review"],[vi?"Zone sẵn sàng":"Zones ready","42 / 42","Healthy"],[vi?"Hệ chữa cháy":"Suppression systems","26 / 26","Armed"],[vi?"Sẵn sàng sơ tán":"Evacuation readiness","98.7%","Healthy"]].map(([a,b,c],i)=><AirportMetricCard key={a} label={a} value={b} trend={c} compact tone={i===2?"amber":i===5?"emerald":"cyan"}/>)}</div><div className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]"><AirportPanel title={vi?"Bản đồ zone PCCC":"Fire-zone readiness map"}><div className="grid grid-cols-7 gap-2 p-4">{zones.map(zone=><button key={zone.id} onClick={()=>setSelected(zone)} className={`aspect-square rounded-lg border p-2 text-center ${zone.state!=="Normal"?"border-amber-400/25 bg-amber-400/[.08]":"border-emerald-400/16 bg-emerald-400/[.045]"}`}><Flame size={13} className={`mx-auto ${zone.state!=="Normal"?"text-amber-300":"text-emerald-300"}`}/><span className="mt-1 block text-[8px] text-white">{zone.id}</span></button>)}</div></AirportPanel><AirportPanel title={vi?"Tín hiệu và quy trình":"Signals and response workflow"}><div className="space-y-2 p-3">{signals.map(item=><button key={item.id} onClick={()=>setSelected(item)} className="w-full rounded-lg border border-white/[.06] bg-white/[.025] p-3 text-left"><div className="flex justify-between"><span className="font-mono text-[9px] text-cyan-300">{item.id}</span><AirportStatusBadge status={item.state==="Warning"?"warning":"normal"}/></div><p className="mt-2 text-[10px] text-slate-300">{item.message}</p></button>)}</div></AirportPanel></div>
    <EboOperationalModal open={Boolean(selected)} onClose={()=>setSelected(null)} eyebrow="Fire alarm integration view" title={selected?.id ?? "Fire zone"} subtitle="Fire alarm and life-safety status is presented from the certified source system." status={selected?.state==="Normal"?"normal":"warning"} statusLabel={selected?.state ?? "Normal"} fields={[
      {label:"Area",value:selected?.area ?? "—"},{label:"Device count",value:selected?.devices ?? "Linked source device"},{label:"Fire panel",value:"FACP-T1-01"},{label:"Voice evacuation",value:"Ready",tone:"normal"},{label:"Suppression",value:"Armed",tone:"normal"},{label:"Source system",value:"Certified FAS / EBO integration"},
    ]} footer={<><button onClick={()=>toast.success("Supervisory signal acknowledged in demo audit trail")} className="airport-button">Acknowledge</button><button onClick={()=>toast.success("Fire response workflow opened")} className="airport-button !border-cyan-400/20 !bg-cyan-400/[.06] !text-cyan-200">Open response workflow</button></>}>
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]"><AirportPanel title="Zone devices and readiness"><div className="grid grid-cols-2 gap-3 p-4">{[["Smoke detectors","168 / 168"],["Heat detectors","42 / 42"],["Manual call points","18 / 18"],["Sounders / strobes","64 / 64"],["Sprinkler valves","12 / 12"],["Stair pressurization","4 / 4"]].map(([a,b])=><div key={a} className="rounded-lg border border-white/[.07] bg-white/[.03] p-4"><p className="text-[9px] text-slate-500">{a}</p><p className="mt-2 text-sm font-semibold text-emerald-300">{b}</p></div>)}</div></AirportPanel><AirportPanel title="Response sequence"><div className="space-y-2 p-4">{[["01","Detect and validate","Complete"],["02","Notify fire command","Ready"],["03","Control smoke / pressurization","Ready"],["04","Voice evacuation by zone","Standby"],["05","Fire brigade handoff","Standby"],["06","Restore and audit","Pending"]].map(([n,a,b])=><div key={n} className="flex items-center gap-3 rounded-lg border border-white/[.06] bg-white/[.025] p-3"><span className="text-[9px] text-cyan-300">{n}</span><span className="flex-1 text-[10px] text-white">{a}</span><span className="text-[9px] text-slate-500">{b}</span></div>)}</div></AirportPanel></div>
    </EboOperationalModal>
  </>;
}

function WaterUtilitiesOperations(){
  const {language}=useAirportLanguage(); const vi=language==="vi";
  const assets=[
    {name:"City supply",value:"4.2 bar",state:"Normal",type:"Supply"},{name:"Raw tank",value:"78%",state:"Normal",type:"Storage"},{name:"Treatment",value:"98.8%",state:"Normal",type:"Quality"},{name:"Park distribution ring",value:"3.8 bar",state:"Normal",type:"Distribution"},{name:"R&D / Manufacturing",value:"6,840 m³",state:"Normal",type:"Demand"},{name:"Leak Zone W-07",value:"3.4 L/min anomaly",state:"Warning",type:"Leak"},
  ];
  const [selected,setSelected]=useState<(typeof assets)[number]|null>(null);
  return <><div className="grid grid-cols-3 gap-2 xl:grid-cols-6">{[[vi?"Nước cấp hôm nay":"Water supply today","6,840 m³","+3.2%"],[vi?"Bể chứa":"Storage level","78%","Healthy"],[vi?"Áp lực mạng":"Network pressure","4.2 bar","Stable"],[vi?"Nước thải xử lý":"Wastewater treated","5,420 m³","99.1%"],[vi?"Chất lượng":"Water quality","98.8%","Compliant"],[vi?"Rò rỉ dự báo":"Leak anomalies","3","Investigate"]].map(([a,b,c],i)=><AirportMetricCard key={a} label={a} value={b} trend={c} compact tone={i===5?"amber":i===4?"emerald":"cyan"}/>)}</div><div className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]"><AirportPanel title={vi?"Sơ đồ cấp và xử lý nước":"Water supply and treatment schematic"}><div className="flex min-h-[460px] items-center gap-3 overflow-auto p-5">{assets.slice(0,5).map((item,i)=><React.Fragment key={item.name}><button onClick={()=>setSelected(item)} className="min-w-[150px] rounded-xl border border-cyan-400/18 bg-cyan-400/[.05] p-4 text-center"><Droplets className="mx-auto text-cyan-300"/><p className="mt-3 text-[10px] font-semibold text-white">{item.name}</p><p className="mt-2 text-[9px] text-emerald-300">{item.value}</p></button>{i<4&&<div className="h-[2px] min-w-14 bg-cyan-400/30"><span className="float-right -mt-2 text-cyan-300">▶</span></div>}</React.Fragment>)}</div></AirportPanel><AirportPanel title={vi?"Trạm bơm và chất lượng":"Pumps and water quality"}><div className="space-y-2 p-3">{[["Booster Pump BP-01","Running · 78%","Normal"],["Booster Pump BP-02","Standby","Normal"],["Wastewater Train 01","4,280 m³/day","Normal"],["pH","7.2","Normal"],["Turbidity","0.42 NTU","Normal"],["Leak Zone W-07","3.4 L/min anomaly","Warning"]].map(([name,value,state],i)=><button key={name} onClick={()=>setSelected(assets[i===5?5:Math.min(i,4)])} className="w-full rounded-lg border border-white/[.06] bg-white/[.025] p-3 text-left"><div className="flex justify-between"><p className="text-[10px] font-semibold text-white">{name}</p><AirportStatusBadge status={state==="Warning"?"warning":"normal"}/></div><p className="mt-1 text-[9px] text-slate-500">{value}</p></button>)}</div></AirportPanel></div>
    <EboOperationalModal open={Boolean(selected)} onClose={()=>setSelected(null)} title={selected?.name ?? "Water asset"} subtitle="Water, wastewater and leak-detection operational detail" status={selected?.state==="Warning"?"warning":"normal"} statusLabel={selected?.state ?? "Normal"} fields={[
      {label:"Asset type",value:selected?.type ?? "—"},{label:"Current value",value:selected?.value ?? "—",tone:selected?.state==="Warning"?"warning":"normal"},{label:"Water quality",value:"Compliant",tone:"normal"},{label:"Automation server",value:"AS-P-UTIL-03"},{label:"Sampling",value:"30 sec"},{label:"Last command",value:"12:36:14 · audited"},
    ]} footer={<><button onClick={()=>toast.success("Pump schedule command simulated and audit logged")} className="airport-button">Apply schedule</button><button onClick={()=>toast.success("Utility work order created")} className="airport-button !border-cyan-400/20 !bg-cyan-400/[.06] !text-cyan-200">Create work order</button></>}>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]"><AirportPanel title="Flow, pressure and quality trend"><div className="p-3"><AirportTrendChart data={makeTrend(7,66,11)} height={340} color="#22d3ee" unit="%"/></div></AirportPanel><AirportPanel title="Control and quality points"><div className="space-y-2 p-3">{[["Pump mode","AUTO"],["Discharge pressure","4.2 bar"],["Tank level","78%"],["pH","7.2"],["Turbidity","0.42 NTU"],["Leak model confidence","91.8%"]].map(([a,b])=><div key={a} className="flex justify-between rounded-lg border border-white/[.06] bg-white/[.03] p-3 text-[10px]"><span className="text-slate-500">{a}</span><b className="text-white">{b}</b></div>)}</div></AirportPanel></div>
    </EboOperationalModal>
  </>;
}

function LightingOperations(){
  const {language}=useAirportLanguage(); const vi=language==="vi";
  const zones=[
    {name:"R&D public areas",level:82,mode:"Auto",type:"Interior"},{name:"Innovation Center",level:88,mode:"Schedule",type:"Interior"},{name:"Logistics Yard",level:100,mode:"Operational",type:"Logistics"},{name:"Main Boulevard",level:100,mode:"Safety scene",type:"Road"},{name:"Internal Road A",level:100,mode:"Active",type:"Road"},{name:"Parking",level:64,mode:"Sensor",type:"Exterior"},
  ];
  const [selected,setSelected]=useState<(typeof zones)[number]|null>(null);
  const [commandLevel,setCommandLevel]=useState(80);
  return <><div className="grid grid-cols-3 gap-2 xl:grid-cols-6">{[[vi?"Mạch chiếu sáng":"Lighting circuits","12,860","99.6%"],[vi?"Đèn đường & công cộng":"Road & public lights","8,420","99.8%"],[vi?"Điện chiếu sáng":"Lighting power","2.84 MW","-6.2%"],[vi?"Lịch đang chạy":"Active schedules","184","Live"],[vi?"Cảm biến hiện diện":"Occupancy sensors","2,486","98.9%"],[vi?"Đèn cần bảo trì":"Maintenance due","28","Action"]].map(([a,b,c],i)=><AirportMetricCard key={a} label={a} value={b} trend={c} compact tone={i===5?"amber":"cyan"}/>)}</div><div className="grid gap-4 xl:grid-cols-[1fr_1fr]"><AirportPanel title={vi?"Zone chiếu sáng và chế độ":"Lighting zones and modes"}><div className="grid grid-cols-2 gap-3 p-4">{zones.map((zone,i)=><button key={zone.name} onClick={()=>{setSelected(zone);setCommandLevel(zone.level);}} className="rounded-xl border border-white/[.07] bg-white/[.025] p-4 text-left"><div className="flex justify-between"><Lightbulb className={i>2?"text-amber-300":"text-cyan-300"} size={20}/><AirportStatusBadge status="normal" label={zone.mode}/></div><p className="mt-3 text-[10px] font-semibold text-white">{zone.name}</p><p className="mt-1 text-xl font-semibold text-white">{zone.level}%</p></button>)}</div></AirportPanel><AirportPanel title={vi?"Lịch và cảm biến":"Schedules and sensors"}><div className="p-3"><AirportTrendChart data={makeTrend(3,68,18)} height={320} color="#fbbf24" unit="%"/></div></AirportPanel></div>
    <EboOperationalModal open={Boolean(selected)} onClose={()=>setSelected(null)} title={selected?.name ?? "Lighting zone"} subtitle="Schedule, occupancy and park-lighting operational context" status="normal" statusLabel={selected?.mode ?? "Auto"} fields={[
      {label:"Zone type",value:selected?.type ?? "—"},{label:"Current level",value:selected?`${selected.level}%`:"—",tone:"normal"},{label:"Command level",value:`${commandLevel}%`},{label:"Schedule",value:selected?.mode ?? "—"},{label:"Circuit health",value:"99.6%",tone:"normal"},{label:"Automation server",value:"AS-P-LGT-04"},
    ]} footer={<><button onClick={()=>toast.success(`Lighting command ${commandLevel}% applied in demo audit trail`)} className="airport-button">Apply level</button><button onClick={()=>toast.success("Lighting schedule restored")} className="airport-button !border-cyan-400/20 !bg-cyan-400/[.06] !text-cyan-200">Return to schedule</button></>}>
      <div className="grid gap-4 xl:grid-cols-[.85fr_1.15fr]"><AirportPanel title="Lighting control"><div className="p-5"><div className="grid min-h-[300px] place-items-center rounded-xl border border-cyan-400/16 bg-[radial-gradient(circle_at_center,rgba(251,191,36,.16),#06111f_68%)]"><Lightbulb size={92} className="text-amber-200"/><p className="absolute mt-40 text-3xl font-semibold text-white">{commandLevel}%</p></div><label className="mt-5 block"><div className="flex justify-between text-[10px]"><span className="text-slate-500">Command level</span><b className="text-white">{commandLevel}%</b></div><input type="range" min="0" max="100" value={commandLevel} onChange={e=>setCommandLevel(Number(e.target.value))} className="mt-3 w-full accent-cyan-300"/></label></div></AirportPanel><AirportPanel title="Schedule and trend"><div className="p-3"><AirportTrendChart data={makeTrend(3,68,18)} height={300} color="#fbbf24" unit="%"/></div><div className="grid grid-cols-2 gap-2 p-3">{[["Occupied mode","06:00–23:00"],["After-hours","20%"],["Sensor delay","10 min"],["Manual override","Expires in 30 min"]].map(([a,b])=><div key={a} className="rounded-lg bg-white/[.03] p-3"><p className="text-[9px] text-slate-500">{a}</p><p className="mt-1 text-[10px] text-white">{b}</p></div>)}</div></AirportPanel></div>
    </EboOperationalModal>
  </>;
}

function VerticalTransportOperations(){
  const {language}=useAirportLanguage(); const vi=language==="vi";
  const units=Array.from({length:12},(_,i)=>({id:`${i%2?"ESC":"EL"}-${String(i+1).padStart(2,"0")}`,zone:["Innovation Center","R&D Building","Parking P2","Logistics Center"][i%4],state:[5,10].includes(i)?"Service due":"Running",trips:840+i*46,type:i%2?"Escalator":"Elevator",floor:i%2?"L1-L2":`L${i%4+1}`}));
  const [selected,setSelected]=useState<(typeof units)[number]|null>(null);
  return <><div className="grid grid-cols-3 gap-2 xl:grid-cols-6">{[[vi?"Thang máy":"Elevators","86 / 88","97.7%"],[vi?"Thang cuốn":"Escalators","96 / 98","98.0%"],[vi?"Lượt vận chuyển":"Trips today","84,260","+5.1%"],[vi?"Thiết bị bảo trì":"Maintenance due","7","Next 7d"],[vi?"Sự cố kẹt":"Entrapment","0","Healthy"],[vi?"Thời gian đáp ứng":"Response time","4.8 min","SLA"]].map(([a,b,c],i)=><AirportMetricCard key={a} label={a} value={b} trend={c} compact tone={i===3?"amber":i===4?"emerald":"cyan"}/>)}</div><div className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]"><AirportPanel title={vi?"Đội thiết bị vận chuyển đứng":"Vertical transport fleet"}><div className="grid grid-cols-3 gap-2 p-4">{units.map(unit=><button key={unit.id} onClick={()=>setSelected(unit)} className={`rounded-lg border p-3 text-left ${unit.state==="Service due"?"border-amber-400/25 bg-amber-400/[.08]":"border-cyan-400/15 bg-cyan-400/[.045]"}`}><ArrowUpDown size={18} className={unit.state==="Service due"?"text-amber-300":"text-cyan-300"}/><p className="mt-2 text-[10px] font-semibold text-white">{unit.id}</p><p className="mt-1 text-[9px] text-slate-500">{unit.zone}</p><p className="mt-2 text-[9px] text-emerald-300">{unit.trips.toLocaleString()} trips</p></button>)}</div></AirportPanel><AirportPanel title={vi?"Bảo trì và lưu lượng":"Maintenance and traffic"}><div className="p-3"><AirportTrendChart data={makeTrend(9,72,14)} height={280} color="#a78bfa" unit="%"/></div><div className="grid grid-cols-2 gap-2 p-3">{[["Brake tests","98.4%"],["Door cycles","4.2M"],["Energy recovery","18%"],["SLA","96.8%"]].map(([a,b])=><div key={a} className="rounded-lg bg-white/[.03] p-3"><p className="text-[9px] text-slate-500">{a}</p><p className="mt-1 text-sm font-semibold text-white">{b}</p></div>)}</div></AirportPanel></div>
    <EboOperationalModal open={Boolean(selected)} onClose={()=>setSelected(null)} title={selected?.id ?? "Vertical transport"} subtitle={`${selected?.zone ?? ""} · ${selected?.type ?? ""}`} status={selected?.state==="Service due"?"warning":"normal"} statusLabel={selected?.state ?? "Running"} fields={[
      {label:"Equipment type",value:selected?.type ?? "—"},{label:"Location",value:selected?.zone ?? "—"},{label:"Travel",value:selected?.floor ?? "—"},{label:"Trips today",value:selected?.trips.toLocaleString() ?? "—"},{label:"Safety circuit",value:"Healthy",tone:"normal"},{label:"Maintenance",value:selected?.state ?? "—",tone:selected?.state==="Service due"?"warning":"normal"},
    ]} footer={<><button onClick={()=>toast.success("Unit placed into inspection mode in demo")} className="airport-button">Inspection mode</button><button onClick={()=>toast.success("Maintenance work order created")} className="airport-button !border-cyan-400/20 !bg-cyan-400/[.06] !text-cyan-200">Create work order</button></>}>
      <div className="grid gap-4 xl:grid-cols-[.7fr_1.3fr]"><div className="grid min-h-[430px] place-items-center rounded-xl border border-cyan-400/16 bg-[radial-gradient(circle_at_center,#15334b_0,#06111f_70%)]"><div className="text-center"><ArrowUpDown size={92} className="mx-auto text-cyan-300/70"/><p className="mt-4 text-sm font-semibold text-white">{selected?.id}</p><p className="mt-2 text-[10px] text-emerald-300">Safety circuit healthy</p><p className="mt-1 text-[9px] text-slate-500">Current position {selected?.floor}</p></div></div><AirportPanel title="Operations and maintenance"><div className="p-3"><AirportTrendChart data={makeTrend(9,72,14)} height={270} color="#a78bfa" unit="%"/></div><div className="grid grid-cols-2 gap-2 p-3">{[["Drive current","48 A"],["Door cycles","186,420"],["Brake test","Passed"],["Vibration","2.1 mm/s"],["Next service","18 Jul 2026"],["Last reset","12 Jun 2026"]].map(([a,b])=><div key={a} className="rounded-lg bg-white/[.03] p-3"><p className="text-[9px] text-slate-500">{a}</p><p className="mt-1 text-[10px] text-white">{b}</p></div>)}</div></AirportPanel></div>
    </EboOperationalModal>
  </>;
}


const CROSS_DOMAIN_ALARMS = [
  ["EBO-260713-001","11:42","High","BMS","DHTP-AHU-RD-L2-01","CO₂ above comfort threshold","Acknowledged","R&D Facility Management"],
  ["EBO-260713-002","11:38","Medium","EMS","MDB-02","Demand peak forecast","Open","Energy Ops"],
  ["EBO-260713-003","11:31","Critical","CCTV","CAM-P07-04","Emergency Entrance intrusion correlation","Investigating","Park Security"],
  ["EBO-260713-004","11:24","Low","ACS","AIR-GATE-A04","Credential denied","Closed","Access Control"],
  ["EBO-260713-005","11:16","Medium","Parking","PARK-P2","Occupancy reached 88%","Open","Hospital Logistics Dock Ops"],
  ["EBO-260713-006","11:09","Low","Lighting","LGT-T1-18","Lamp group degraded","Planned","Electrical FM"],
  ["EBO-260713-007","10:56","Medium","Fire","SD-T1-284","Detector supervisory review","Acknowledged","Fire Team"],
  ["EBO-260713-008","10:48","Medium","Water","W-ZONE-07","Leak anomaly detected","Investigating","Utilities"],
] as const;

function ClinicalEnvironmentOperations(){
  const {language}=useAirportLanguage(); const vi=language==="vi";
  const rooms=[
    ["OR-01","Operating Theatre","Positive","+16 Pa","21.4°C","52%","Normal"],
    ["OR-04","Operating Theatre","Positive","+14 Pa","21.8°C","54%","Normal"],
    ["ICU-ISO-03","ICU Isolation","Negative","-8 Pa","22.6°C","50%","Normal"],
    ["ISO-12","Airborne Isolation","Negative","-1 Pa","23.1°C","58%","Warning"],
    ["PHARM-CR-02","Pharmacy Cleanroom","Positive","+12 Pa","20.8°C","48%","Normal"],
    ["LAB-BSL2-01","Laboratory","Negative","-7 Pa","22.4°C","51%","Normal"],
  ] as const;
  return <><div className="grid grid-cols-3 gap-2 xl:grid-cols-6">{[[vi?"Phòng giám sát":"Rooms monitored","186","Live"],[vi?"Đạt áp suất":"Pressure compliant","98.7%","24 h"],[vi?"Đạt nhiệt độ":"Temperature compliant","99.1%","24 h"],[vi?"Đạt độ ẩm":"Humidity compliant","98.4%","24 h"],[vi?"HEPA cần xem xét":"HEPA reviews","3","Action"],[vi?"Cảnh báo mở":"Open alerts","4","1 priority"]].map(([a,b,c],i)=><AirportMetricCard key={a} label={a} value={b} trend={c} compact tone={i===4||i===5?"amber":"cyan"}/>)}</div><div className="grid gap-4 xl:grid-cols-[1.35fr_.65fr]"><AirportPanel title={vi?"Tuân thủ môi trường lâm sàng":"Clinical environment compliance"}><div className="overflow-auto"><table className="w-full min-w-[900px] text-left text-[10px]"><thead className="bg-[#0a192c] text-[8px] uppercase tracking-[.11em] text-slate-500"><tr>{["Room","Type","Mode","Pressure","Temperature","Humidity","Status"].map(h=><th key={h} className="px-3 py-2">{h}</th>)}</tr></thead><tbody>{rooms.map(row=><tr key={row[0]} className="border-t border-white/[.05] text-slate-300"><td className="px-3 py-3 font-mono text-cyan-300">{row[0]}</td><td>{row[1]}</td><td>{row[2]}</td><td>{row[3]}</td><td>{row[4]}</td><td>{row[5]}</td><td><AirportStatusBadge status={row[6]==="Warning"?"warning":"normal"} label={row[6]}/></td></tr>)}</tbody></table></div></AirportPanel><AirportPanel title={vi?"Kiểm soát trọng yếu":"Critical controls"}><div className="space-y-2 p-3">{[["Operating theatre pressure","8 / 8 compliant"],["Isolation pressure","17 / 18 compliant"],["Pharmacy cleanroom","2 / 2 compliant"],["Laboratory exhaust","6 / 6 available"],["HEPA differential pressure","3 reviews"],["Door-open duration","2 warnings"]].map(([a,b],i)=><div key={a} className="rounded-lg border border-white/[.06] bg-white/[.025] p-3"><div className="flex justify-between gap-3"><span className="text-[10px] text-slate-300">{a}</span><AirportStatusBadge status={i>3?"warning":"normal"}/></div><p className="mt-2 text-[11px] font-semibold text-white">{b}</p></div>)}</div></AirportPanel></div><AirportPanel title={vi?"Xu hướng chênh áp 24 giờ":"Pressure differential trend · 24 hours"}><div className="p-3"><AirportTrendChart data={makeTrend(7,12,3)} height={250} color="#22d3ee" unit=" Pa"/></div></AirportPanel></>;
}

function CrossDomainAlarmCenter(){const {language}=useAirportLanguage();const vi=language==="vi";const[selected,setSelected]=useState(CROSS_DOMAIN_ALARMS[0]);return <><div className="grid grid-cols-3 gap-2 xl:grid-cols-6">{[[vi?"Cảnh báo mở":"Open alarms","104","7 high"],[vi?"Chưa xác nhận":"Unacknowledged","18","Action"],[vi?"Trong SLA":"Within SLA","96.8%","Healthy"],[vi?"Thời gian xác nhận":"Acknowledge time","38 sec","Median"],[vi?"Cảnh báo hôm nay":"Alarms today","2,846","-6%"],[vi?"Đã đóng":"Closed","2,742","96.3%"]].map(([a,b,c],i)=><AirportMetricCard key={a} label={a} value={b} trend={c} compact tone={i<2?"amber":i===5?"emerald":"cyan"}/>)}</div><div className="grid gap-4 xl:grid-cols-[1.3fr_.7fr]"><AirportPanel title={vi?"Hàng đợi cảnh báo EBO liên hệ thống":"Cross-domain EBO alarm queue"}><div className="overflow-auto"><table className="w-full min-w-[1050px] text-left text-[10px]"><thead className="bg-[#0a192c] text-[8px] uppercase tracking-[.11em] text-slate-500"><tr>{["ID","Time","Priority","System","Asset / Zone","Message","State","Owner"].map(h=><th key={h} className="px-3 py-2">{h}</th>)}</tr></thead><tbody>{CROSS_DOMAIN_ALARMS.map(row=><tr key={row[0]} onClick={()=>setSelected(row)} className={`cursor-pointer border-t border-white/[.05] text-slate-300 hover:bg-cyan-400/[.04] ${selected[0]===row[0]?"bg-cyan-400/[.07]":""}`}><td className="px-3 py-3 font-mono text-cyan-300">{row[0]}</td><td>{row[1]}</td><td><AirportStatusBadge status={row[2]==="Critical"?"critical":row[2]==="High"||row[2]==="Medium"?"warning":"info"} label={row[2]}/></td><td>{row[3]}</td><td>{row[4]}</td><td>{row[5]}</td><td>{row[6]}</td><td>{row[7]}</td></tr>)}</tbody></table></div></AirportPanel><AirportPanel title={selected[0]}><div className="space-y-3 p-4"><AirportStatusBadge status={selected[2]==="Critical"?"critical":selected[2]==="High"||selected[2]==="Medium"?"warning":"info"} label={selected[2]}/><h3 className="text-sm font-semibold text-white">{selected[5]}</h3>{[[vi?"Hệ thống":"System",selected[3]],[vi?"Tài sản / Zone":"Asset / Zone",selected[4]],[vi?"Trạng thái":"State",selected[6]],[vi?"Chủ trì":"Owner",selected[7]],[vi?"Thời gian":"Time",selected[1]]].map(([a,b])=><div key={a} className="flex justify-between gap-3 border-b border-white/[.06] pb-2 text-[10px]"><span className="text-slate-500">{a}</span><b className="text-right text-white">{b}</b></div>)}<button onClick={()=>toast.success(vi?"Đã xác nhận cảnh báo và ghi audit trail":"Alarm acknowledged and audit logged")} className="airport-button w-full justify-center"><CheckCircle2 size={13}/>{vi?"Xác nhận cảnh báo":"Acknowledge alarm"}</button><button onClick={()=>toast.success(vi?"Đã tạo lệnh công việc mô phỏng":"Demo work order created")} className="airport-button w-full justify-center"><Sparkles size={13}/>{vi?"Tạo lệnh công việc":"Create work order"}</button></div></AirportPanel></div></>}

function FacilityTrendsReports(){const {language}=useAirportLanguage();const vi=language==="vi";const[metric,setMetric]=useState("facility");const trend=metric==="energy"?makeTrend(4,68,16):metric==="alarms"?makeTrend(8,42,12):makeTrend(2,86,6);return <><div className="grid grid-cols-3 gap-2 xl:grid-cols-6">{[[vi?"Điểm historian":"Historian points","124,860","6 sec"],[vi?"Thời gian lưu":"Retention","5 years","Online"],[vi?"Mẫu hôm nay":"Samples today","428M","Live"],[vi?"Chất lượng dữ liệu":"Data quality","98.4%","Healthy"],[vi?"Báo cáo tự động":"Auto reports","42","Scheduled"],[vi?"Mô hình phân tích":"Analytics models","18","Active"]].map(([a,b,c],i)=><AirportMetricCard key={a} label={a} value={b} trend={c} compact tone={i===3?"emerald":"cyan"}/>)}</div><AirportPanel title={vi?"Xu hướng vận hành facility":"Facility operations trends"} action={<select value={metric} onChange={e=>setMetric(e.target.value)} className="airport-select"><option value="facility">Facility health</option><option value="energy">Energy load</option><option value="alarms">Alarm volume</option></select>}><div className="p-4"><AirportTrendChart data={trend} height={330} color={metric==="energy"?"#fbbf24":metric==="alarms"?"#fb7185":"#22d3ee"} unit="%"/></div></AirportPanel><div className="grid gap-4 xl:grid-cols-3">{[[vi?"Báo cáo ca trực":"Shift operations report","Every 8 hours","Ready"],[vi?"Báo cáo năng lượng":"Energy performance report","Daily 00:15","Scheduled"],[vi?"Báo cáo alarm":"Alarm rationalization","Weekly","Review"],[vi?"Báo cáo thiết bị":"Asset availability","Daily","Ready"],[vi?"Báo cáo PCCC":"Fire readiness","Monthly","Ready"],[vi?"Báo cáo SLA":"Facility SLA","Monthly","Draft"]].map(([name,schedule,state],i)=><AirportPanel key={name} title={name}><div className="p-4"><p className="text-sm font-semibold text-white">{schedule}</p><p className={`mt-2 text-[10px] ${i===5?"text-amber-300":"text-emerald-300"}`}>{state}</p><button onClick={()=>toast.success(`${name} · generated`)} className="airport-button mt-4 w-full justify-center">{vi?"Tạo báo cáo":"Generate report"}</button></div></AirportPanel>)}</div></>}

function FacilityIcon({ index }: { index: number }) {
  const icons = [Fan, Zap, Camera, LockKeyhole, Car, Flame, Droplets, Lightbulb, ArrowUpDown];
  const Icon = icons[index % icons.length];
  return <span className="grid h-9 w-9 flex-none place-items-center rounded-lg border border-cyan-400/15 bg-cyan-400/[.07] text-cyan-300"><Icon size={17}/></span>;
}
