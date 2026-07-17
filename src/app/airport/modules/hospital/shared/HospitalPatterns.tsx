import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle, ArrowRight, CheckCircle2, ChevronRight, Clock3, Filter,
  GitBranch, Layers3, MapPin, Network, Play, Search, ShieldCheck, SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { useAirportLanguage } from "../../../i18n/AirportLanguage";
import { AirportPanel, AirportStatusBadge } from "../../../shared/AirportUI";
import type { BilingualText, HospitalSectionItem, HospitalSectionSpec } from "../types";

const campusImage = "https://pub-ad3c98c8c26c4e95ad475279f7257940.r2.dev/Hospital-Digital-Twin.png";

const UI = {
  presentation: { en: "Presentation data", vi: "Dữ liệu trình diễn" },
  noControl: { en: "No live clinical or life-safety control", vi: "Không điều khiển trực tiếp hệ thống lâm sàng hoặc an toàn sự sống" },
  search: { en: "Search this operational dataset…", vi: "Tìm trong bộ dữ liệu vận hành…" },
  all: { en: "All states", vi: "Mọi trạng thái" },
  owner: { en: "Owner", vi: "Phụ trách" },
  location: { en: "Location", vi: "Vị trí" },
  status: { en: "Status", vi: "Trạng thái" },
  updated: { en: "Updated", vi: "Cập nhật" },
  details: { en: "Operational detail", vi: "Chi tiết vận hành" },
  action: { en: "Demo action recorded", vi: "Đã ghi nhận hành động demo" },
  page: { en: "Page 1 of 2", vi: "Trang 1 / 2" },
  baseline: { en: "Baseline", vi: "Cơ sở" },
  scenario: { en: "Scenario", vi: "Kịch bản" },
  assumptions: { en: "Assumptions & confidence", vi: "Giả định & độ tin cậy" },
} satisfies Record<string, BilingualText>;

function useCopy() {
  const { language } = useAirportLanguage();
  return (text: BilingualText) => text[language];
}

function DemoNotice() {
  const copy = useCopy();
  return <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-amber-400/20 bg-amber-400/[.055] px-3 py-2 text-[10px]"><span className="font-semibold text-amber-200">{copy(UI.presentation)}</span><span className="text-slate-500">·</span><span className="text-slate-400">{copy(UI.noControl)}</span></div>;
}

function SectionFacts({ spec }: { spec: HospitalSectionSpec }) {
  const copy = useCopy();
  const normal = spec.items.filter((item) => item.status === "normal").length;
  const warnings = spec.items.filter((item) => item.status === "warning" || item.status === "critical").length;
  const facts = [
    [copy(spec.items[0].label), copy(spec.items[0].value), "cyan"],
    [copy(spec.items[2].label), copy(spec.items[2].sla), "blue"],
    [copy(UI.status), `${normal}/${spec.items.length}`, "emerald"],
    [copy({ en: "Items requiring review", vi: "Mục cần rà soát" }), String(warnings), warnings ? "amber" : "emerald"],
  ] as const;
  return <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{facts.map(([label, value, tone]) => <div key={label} className={`rounded-xl border p-3 ${tone === "amber" ? "border-amber-400/20 bg-amber-400/[.06]" : tone === "emerald" ? "border-emerald-400/20 bg-emerald-400/[.05]" : "border-cyan-400/15 bg-cyan-400/[.04]"}`}><p className="truncate text-[9px] uppercase tracking-[.11em] text-slate-500">{label}</p><strong className="mt-1 block text-lg text-white">{value}</strong></div>)}</div>;
}

function ItemCard({ item, selected, onClick }: { item: HospitalSectionItem; selected?: boolean; onClick?: () => void }) {
  const copy = useCopy();
  return <button onClick={onClick} className={`w-full rounded-xl border p-3 text-left transition ${selected ? "border-cyan-300/40 bg-cyan-300/10" : "border-white/[.07] bg-white/[.025] hover:border-cyan-400/25"}`}><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-[11px] font-semibold text-white">{copy(item.label)}</p><p className="mt-1 truncate text-[9px] text-slate-500">{copy(item.location)}</p></div><AirportStatusBadge status={item.status} /></div><div className="mt-3 flex items-center justify-between text-[9px]"><span className="text-cyan-300">{copy(item.value)}</span><span className="text-slate-600">{item.timestamp}</span></div></button>;
}

function DetailPanel({ item }: { item: HospitalSectionItem }) {
  const copy = useCopy();
  const status = copy({ en: item.status, vi: item.status === "normal" ? "Bình thường" : item.status === "warning" ? "Cảnh báo" : item.status === "critical" ? "Nghiêm trọng" : "Thông tin" });
  return <AirportPanel title={copy(UI.details)}><div className="space-y-3 p-4"><div><p className="text-sm font-semibold text-white">{copy(item.label)}</p><p className="mt-1 text-[10px] text-slate-500">{copy(item.location)}</p></div>{[[UI.owner, copy(item.owner)], [UI.status, status], [UI.updated, item.timestamp], [{ en: "SLA", vi: "SLA" }, copy(item.sla)]].map(([label, value]) => <div key={copy(label as BilingualText)} className="flex items-center justify-between border-t border-white/[.06] pt-2 text-[10px]"><span className="text-slate-500">{copy(label as BilingualText)}</span><span className="text-slate-200">{value as string}</span></div>)}<button onClick={() => toast.success(copy(UI.action))} className="airport-button w-full justify-center"><CheckCircle2 size={13}/>{copy({ en: "Record demo action", vi: "Ghi nhận hành động demo" })}</button></div></AirportPanel>;
}

function MapView({ spec, floor = false }: { spec: HospitalSectionSpec; floor?: boolean }) {
  const copy = useCopy();
  const [selected, setSelected] = useState(spec.items[0]);
  const [layer, setLayer] = useState("all");
  return <div className="grid min-h-[480px] gap-3 xl:grid-cols-[minmax(0,1fr)_280px]"><AirportPanel title={copy(spec.title)} subtitle={copy(spec.description)} action={<select value={layer} onChange={(event) => setLayer(event.target.value)} className="airport-select"><option value="all">{copy({ en: "All layers", vi: "Tất cả lớp" })}</option><option value="clinical">{copy({ en: "Clinical", vi: "Lâm sàng" })}</option><option value="alerts">{copy({ en: "Alerts", vi: "Cảnh báo" })}</option></select>}><div className={`relative min-h-[430px] overflow-hidden rounded-b-xl ${floor ? "bg-[#0a1930]" : "bg-cover bg-center"}`} style={floor ? undefined : { backgroundImage: `linear-gradient(rgba(3,12,24,.42),rgba(3,12,24,.72)),url(${campusImage})` }}>{floor && <div className="absolute inset-4 grid grid-cols-4 grid-rows-3 gap-2">{spec.items.slice(0, 8).map((item, index) => <button key={item.id} onClick={() => setSelected(item)} className={`rounded-lg border p-2 text-left ${selected.id === item.id ? "border-cyan-300 bg-cyan-400/15" : "border-cyan-400/15 bg-cyan-400/[.045]"}`} style={{ gridColumn: `${(index % 4) + 1} / span ${index % 3 === 0 ? 2 : 1}` }}><span className="text-[9px] font-medium text-slate-200">{copy(item.label)}</span></button>)}</div>}{!floor && spec.items.slice(0, 8).map((item, index) => <button key={item.id} onClick={() => setSelected(item)} className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-2 py-1 text-[9px] shadow-xl backdrop-blur ${selected.id === item.id ? "border-cyan-200 bg-cyan-300 text-slate-950" : "border-cyan-300/40 bg-[#06111f]/88 text-cyan-100"}`} style={{ left: `${16 + ((index * 29) % 72)}%`, top: `${20 + ((index * 23) % 64)}%` }}><MapPin size={10} className="inline"/> {copy(item.label)}</button>)}<svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M8 82 C28 64 45 74 62 45 S84 28 94 18" fill="none" stroke="rgba(34,211,238,.72)" strokeWidth=".7" strokeDasharray="2 2"/><path d="M5 28 C30 34 52 22 92 74" fill="none" stroke="rgba(251,191,36,.72)" strokeWidth=".6"/></svg><div className="absolute bottom-3 left-3 flex gap-2 rounded-lg border border-white/10 bg-[#06111f]/85 p-2 text-[8px] text-slate-300"><span className="text-cyan-300">● {copy({ en: "Operational point", vi: "Điểm vận hành" })}</span><span className="text-amber-300">━ {copy({ en: "Controlled route", vi: "Tuyến kiểm soát" })}</span></div></div></AirportPanel><DetailPanel item={selected}/></div>;
}

function TableView({ spec }: { spec: HospitalSectionSpec }) {
  const copy = useCopy();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(spec.items[0]);
  const filtered = useMemo(() => spec.items.filter((item) => (status === "all" || item.status === status) && copy(item.label).toLowerCase().includes(search.toLowerCase())), [copy, search, spec.items, status]);
  const rows = filtered.slice((page - 1) * 4, page * 4);
  return <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_280px]"><AirportPanel title={copy(spec.title)} subtitle={copy(spec.description)}><div className="flex flex-wrap gap-2 border-b border-white/[.07] p-3"><label className="flex min-w-52 flex-1 items-center gap-2 rounded-lg border border-white/10 bg-white/[.03] px-3 py-2"><Search size={13} className="text-slate-500"/><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={copy(UI.search)} className="w-full bg-transparent text-xs text-white outline-none"/></label><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="airport-select"><option value="all">{copy(UI.all)}</option><option value="normal">{copy({ en: "Normal", vi: "Bình thường" })}</option><option value="warning">{copy({ en: "Warning", vi: "Cảnh báo" })}</option><option value="critical">{copy({ en: "Critical", vi: "Nghiêm trọng" })}</option></select></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-[10px]"><thead className="bg-white/[.025] text-[8px] uppercase tracking-[.11em] text-slate-500"><tr><th className="px-4 py-3">{copy({ en: "Record", vi: "Bản ghi" })}</th><th>{copy(UI.location)}</th><th>{copy(UI.owner)}</th><th>{copy(UI.status)}</th><th>SLA</th><th>{copy(UI.updated)}</th></tr></thead><tbody>{rows.map((item) => <tr key={item.id} onClick={() => setSelected(item)} className="cursor-pointer border-t border-white/[.055] hover:bg-cyan-400/[.05]"><td className="px-4 py-3 font-medium text-white">{copy(item.label)}</td><td className="text-slate-400">{copy(item.location)}</td><td className="text-slate-400">{copy(item.owner)}</td><td><AirportStatusBadge status={item.status}/></td><td className="text-cyan-300">{copy(item.sla)}</td><td className="text-slate-500">{item.timestamp}</td></tr>)}</tbody></table></div><div className="flex items-center justify-between border-t border-white/[.06] p-3 text-[10px] text-slate-500"><span>{copy(UI.page)}</span><div className="flex gap-2"><button disabled={page === 1} onClick={() => setPage(1)} className="airport-button">1</button><button disabled={filtered.length <= 4} onClick={() => setPage(2)} className="airport-button">2</button></div></div></AirportPanel><DetailPanel item={selected}/></div>;
}

function BoardView({ spec }: { spec: HospitalSectionSpec }) {
  const copy = useCopy();
  const [items, setItems] = useState(spec.items);
  const columns = [
    { key: "info", title: { en: "Requested", vi: "Yêu cầu" } },
    { key: "warning", title: { en: "In progress", vi: "Đang xử lý" } },
    { key: "normal", title: { en: "Ready / complete", vi: "Sẵn sàng / hoàn tất" } },
    { key: "critical", title: { en: "Escalated", vi: "Đã leo thang" } },
  ];
  const advance = (item: HospitalSectionItem) => setItems((current) => current.map((candidate) => candidate.id === item.id ? { ...candidate, status: candidate.status === "info" ? "warning" : "normal" } : candidate));
  return <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">{columns.map((column) => <AirportPanel key={column.key} title={copy(column.title)} subtitle={`${items.filter((item) => item.status === column.key).length} ${copy({ en: "items", vi: "mục" })}`}><div className="min-h-64 space-y-2 p-3">{items.filter((item) => item.status === column.key).map((item) => <div key={item.id}><ItemCard item={item}/><button onClick={() => advance(item)} className="mt-1 w-full rounded-md border border-white/[.05] py-1 text-[8px] text-slate-500 hover:text-cyan-300">{copy({ en: "Advance demo state", vi: "Chuyển trạng thái demo" })} →</button></div>)}</div></AirportPanel>)}</div>;
}

function FlowView({ spec }: { spec: HospitalSectionSpec }) {
  const copy = useCopy();
  const [active, setActive] = useState(0);
  return <AirportPanel title={copy(spec.title)} subtitle={copy(spec.description)}><div className="overflow-x-auto p-5"><div className="flex min-w-[820px] items-stretch gap-2">{spec.items.slice(0, 6).map((item, index) => <React.Fragment key={item.id}><button onClick={() => setActive(index)} className={`min-w-28 flex-1 rounded-xl border p-4 text-left ${active === index ? "border-cyan-300/50 bg-cyan-400/12" : "border-white/[.08] bg-white/[.025]"}`}><span className="text-[8px] uppercase text-cyan-300">{String(index + 1).padStart(2, "0")}</span><p className="mt-2 text-[11px] font-semibold text-white">{copy(item.label)}</p><p className="mt-2 text-[9px] text-slate-500">{copy(item.owner)}</p><div className="mt-3"><AirportStatusBadge status={item.status}/></div></button>{index < 5 && <ArrowRight className="mt-12 flex-none text-slate-700" size={18}/>}</React.Fragment>)}</div><div className="mt-4 grid gap-2 sm:grid-cols-3">{spec.items.slice(5).map((item) => <ItemCard key={item.id} item={item}/>)}</div></div></AirportPanel>;
}

function TopologyView({ spec, dependency = false }: { spec: HospitalSectionSpec; dependency?: boolean }) {
  const copy = useCopy();
  const [selected, setSelected] = useState(spec.items[0]);
  return <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_280px]"><AirportPanel title={copy(spec.title)} subtitle={copy(spec.description)}><div className="relative min-h-[430px] overflow-hidden p-5"><div className="absolute left-1/2 top-1/2 h-px w-[72%] -translate-x-1/2 bg-cyan-400/25"/><div className="absolute left-1/2 top-[18%] h-[64%] w-px bg-cyan-400/20"/><div className="relative grid h-[390px] grid-cols-3 grid-rows-3 place-items-center gap-4">{spec.items.slice(0, 7).map((item, index) => <motion.button whileHover={{ scale: 1.03 }} key={item.id} onClick={() => setSelected(item)} className={`z-10 w-full max-w-44 rounded-xl border p-3 text-left ${selected.id === item.id ? "border-cyan-300/45 bg-cyan-400/12" : "border-white/10 bg-[#0a1930]"}`} style={{ gridColumn: index === 0 ? 2 : index < 4 ? index : index - 3, gridRow: index === 0 ? 2 : index < 4 ? 1 : 3 }}><div className="flex items-center gap-2">{dependency ? <GitBranch size={14} className="text-violet-300"/> : <Network size={14} className="text-cyan-300"/>}<span className="text-[10px] font-semibold text-white">{copy(item.label)}</span></div><p className="mt-2 text-[8px] text-slate-500">{copy(item.value)} · {copy(item.location)}</p></motion.button>)}</div><div className="absolute bottom-3 left-4 text-[8px] text-slate-600">{copy({ en: "Click a node to inspect dependency and presentation status", vi: "Chọn node để xem phụ thuộc và trạng thái trình diễn" })}</div></div></AirportPanel><DetailPanel item={selected}/></div>;
}

function ScheduleView({ spec }: { spec: HospitalSectionSpec }) {
  const copy = useCopy();
  return <AirportPanel title={copy(spec.title)} subtitle={copy(spec.description)}><div className="overflow-x-auto p-4"><div className="min-w-[850px]"><div className="ml-52 grid grid-cols-8 text-center text-[8px] text-slate-600">{["08", "09", "10", "11", "12", "13", "14", "15"].map((hour) => <span key={hour}>{hour}:00</span>)}</div><div className="mt-2 space-y-2">{spec.items.map((item, index) => <div key={item.id} className="grid grid-cols-[190px_1fr] items-center gap-3"><div><p className="truncate text-[10px] font-medium text-white">{copy(item.label)}</p><p className="text-[8px] text-slate-600">{copy(item.owner)}</p></div><div className="relative h-9 rounded-lg bg-white/[.035]"><div className={`absolute top-1 h-7 rounded-md border px-2 py-1 text-[8px] ${item.status === "warning" ? "border-amber-400/30 bg-amber-400/12 text-amber-200" : "border-cyan-400/25 bg-cyan-400/10 text-cyan-200"}`} style={{ left: `${(index * 11) % 45}%`, width: `${24 + (index % 4) * 8}%` }}>{copy(item.value)}</div></div></div>)}</div></div></div></AirportPanel>;
}

function MatrixView({ spec }: { spec: HospitalSectionSpec }) {
  const copy = useCopy();
  const columns = [{ en: "State", vi: "Trạng thái" }, { en: "Readiness", vi: "Sẵn sàng" }, { en: "Evidence", vi: "Bằng chứng" }, { en: "Action", vi: "Hành động" }];
  return <AirportPanel title={copy(spec.title)} subtitle={copy(spec.description)}><div className="overflow-x-auto p-4"><div className="min-w-[760px] grid grid-cols-[220px_repeat(4,1fr)] gap-1"><div/>{columns.map((column) => <div key={column.en} className="rounded-md bg-white/[.04] p-2 text-center text-[8px] uppercase tracking-wider text-slate-500">{copy(column)}</div>)}{spec.items.map((item, row) => <React.Fragment key={item.id}><div className="rounded-md border border-white/[.06] p-3"><p className="text-[10px] font-medium text-white">{copy(item.label)}</p><p className="mt-1 text-[8px] text-slate-600">{copy(item.location)}</p></div>{columns.map((column, columnIndex) => <div key={column.en} className={`grid min-h-14 place-items-center rounded-md border text-[9px] ${((row + columnIndex) % 5) === 2 ? "border-amber-400/20 bg-amber-400/[.07] text-amber-200" : "border-emerald-400/15 bg-emerald-400/[.05] text-emerald-300"}`}>{columnIndex === 0 ? <AirportStatusBadge status={item.status}/> : columnIndex === 1 ? copy(item.value) : columnIndex === 2 ? item.timestamp : <ShieldCheck size={14}/>}</div>)}</React.Fragment>)}</div><p className="mt-3 text-[9px] text-slate-600">{copy({ en: "Presentation profile only; thresholds remain configurable and are not a compliance claim.", vi: "Chỉ là hồ sơ trình diễn; ngưỡng có thể cấu hình và không phải tuyên bố tuân thủ." })}</p></div></AirportPanel>;
}

function ScenarioView({ spec }: { spec: HospitalSectionSpec }) {
  const copy = useCopy();
  const [demand, setDemand] = useState(35);
  const [capacity, setCapacity] = useState(72);
  const [ran, setRan] = useState(false);
  const gap = Math.max(0, demand + 54 - capacity);
  return <div className="grid gap-3 xl:grid-cols-[.8fr_1.2fr]"><AirportPanel title={copy(spec.title)} subtitle={copy(spec.description)}><div className="space-y-5 p-5"><label className="block"><span className="flex justify-between text-[10px] text-slate-400"><span>{copy(spec.items[0].label)}</span><b className="text-white">{demand}%</b></span><input type="range" min="0" max="100" value={demand} onChange={(event) => { setDemand(Number(event.target.value)); setRan(false); }} className="mt-2 w-full accent-violet-400"/></label><label className="block"><span className="flex justify-between text-[10px] text-slate-400"><span>{copy(spec.items[1].label)}</span><b className="text-white">{capacity}%</b></span><input type="range" min="20" max="100" value={capacity} onChange={(event) => { setCapacity(Number(event.target.value)); setRan(false); }} className="mt-2 w-full accent-cyan-400"/></label><button onClick={() => setRan(true)} className="airport-button w-full justify-center !border-violet-400/25 !bg-violet-400/10 !text-violet-200"><Play size={14}/>{copy({ en: "Run decision-support scenario", vi: "Chạy kịch bản hỗ trợ quyết định" })}</button><div className="rounded-lg border border-amber-400/20 bg-amber-400/[.05] p-3 text-[9px] leading-relaxed text-slate-400">{copy({ en: "Results require authorized human review, documented assumptions and an approved rollback plan.", vi: "Kết quả cần người có thẩm quyền rà soát, ghi nhận giả định và kế hoạch hoàn tác được phê duyệt." })}</div></div></AirportPanel><AirportPanel title={copy({ en: "Baseline versus scenario", vi: "Cơ sở so với kịch bản" })} subtitle={copy(UI.assumptions)}><div className="p-5"><div className="grid grid-cols-2 gap-3"><div className="rounded-xl border border-white/[.08] bg-white/[.025] p-4"><p className="text-[9px] uppercase text-slate-500">{copy(UI.baseline)}</p><strong className="mt-2 block text-3xl text-white">8</strong><p className="text-[9px] text-slate-500">{copy({ en: "capacity-gap units", vi: "đơn vị thiếu hụt" })}</p></div><div className={`rounded-xl border p-4 ${gap > 20 ? "border-red-400/25 bg-red-400/[.07]" : "border-cyan-400/20 bg-cyan-400/[.06]"}`}><p className="text-[9px] uppercase text-slate-500">{copy(UI.scenario)}</p><strong className="mt-2 block text-3xl text-white">{ran ? gap : "—"}</strong><p className="text-[9px] text-slate-500">{ran ? copy({ en: "88% confidence", vi: "Độ tin cậy 88%" }) : copy({ en: "Run required", vi: "Cần chạy mô phỏng" })}</p></div></div><div className="mt-4 space-y-2">{spec.items.slice(2, 7).map((item, index) => <div key={item.id} className="flex items-center gap-3 rounded-lg border border-white/[.06] bg-white/[.02] p-3"><span className={`grid h-7 w-7 place-items-center rounded-full ${ran ? "bg-emerald-400/12 text-emerald-300" : "bg-white/[.05] text-slate-600"}`}>{ran ? <CheckCircle2 size={14}/> : index + 1}</span><div><p className="text-[10px] text-white">{copy(item.label)}</p><p className="text-[8px] text-slate-600">{copy(item.owner)} · {copy(item.sla)}</p></div></div>)}</div></div></AirportPanel></div>;
}

function CommandView({ spec }: { spec: HospitalSectionSpec }) {
  const copy = useCopy();
  return <div className="grid gap-3 xl:grid-cols-[1.15fr_.85fr]"><FlowView spec={{ ...spec, items: spec.items.slice(0, 6) }}/><AirportPanel title={copy({ en: "Priority operating picture", vi: "Bức tranh vận hành ưu tiên" })}><div className="grid gap-2 p-3 sm:grid-cols-2 xl:grid-cols-1">{spec.items.slice(4).map((item) => <ItemCard key={item.id} item={item}/>)}</div></AirportPanel></div>;
}

export function HospitalPatternRenderer({ spec }: { spec: HospitalSectionSpec }) {
  let primary: React.ReactNode;
  switch (spec.kind) {
    case "map": primary = <MapView spec={spec}/>; break;
    case "floor": primary = <MapView spec={spec} floor/>; break;
    case "table": primary = <TableView spec={spec}/>; break;
    case "board": primary = <BoardView spec={spec}/>; break;
    case "flow": primary = <FlowView spec={spec}/>; break;
    case "topology": primary = <TopologyView spec={spec}/>; break;
    case "dependency": primary = <TopologyView spec={spec} dependency/>; break;
    case "schedule": primary = <ScheduleView spec={spec}/>; break;
    case "matrix": primary = <MatrixView spec={spec}/>; break;
    case "scenario": primary = <ScenarioView spec={spec}/>; break;
    case "command": primary = <CommandView spec={spec}/>; break;
  }
  return <div className="space-y-3"><DemoNotice/><SectionFacts spec={spec}/>{primary}</div>;
}

export function UnsupportedHospitalSection({ sectionId }: { sectionId: string }) {
  const copy = useCopy();
  return <div className="grid min-h-80 place-items-center rounded-xl border border-red-400/20 bg-red-400/[.04] p-8 text-center"><div><AlertTriangle className="mx-auto text-red-300"/><h3 className="mt-3 text-sm font-semibold text-white">{copy({ en: "Unsupported hospital section", vi: "Section bệnh viện chưa được hỗ trợ" })}</h3><p className="mt-2 font-mono text-xs text-red-200">{sectionId}</p></div></div>;
}




