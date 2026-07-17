import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import {
  Bell, Building2, ChevronRight, CircleGauge, Database, Languages, Menu,
  Network, PanelLeftClose, Search, Server, Settings2, X, Zap,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { AIRPORT_MODULES } from "../airport/config/airportRegistry";
import { AirportLanguageProvider, useAirportLanguage } from "../airport/i18n/AirportLanguage";
import { EnergyUtilityModule } from "../airport/modules/EnergyUtilityModule";
import { AirportSectionHeader, AirportStatusBadge } from "../airport/shared/AirportUI";
import { YooEnergyAssistant } from "./YooEnergyAssistant";
import "../airport/styles/airport.css";

const ENERGY_MODULE = AIRPORT_MODULES.find((module) => module.id === "ENERGY")!;

export function YooEnergyPage() {
  return <AirportLanguageProvider><YooEnergyPageContent /></AirportLanguageProvider>;
}

function YooEnergyPageContent() {
  const { language, setLanguage, localizeModule, tr } = useAirportLanguage();
  const module = useMemo(() => localizeModule(ENERGY_MODULE), [localizeModule]);
  const [sectionId, setSectionId] = useState(ENERGY_MODULE.defaultSection);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [now, setNow] = useState(new Date());
  const mainRef = useRef<HTMLElement>(null);
  const section = module.sections.find((item) => item.id === sectionId) ?? module.sections[0];
  const searchResults = module.sections.filter((item) => `${item.label} ${item.description}`.toLowerCase().includes(searchQuery.toLowerCase()));
  const navigateSection = (nextSectionId: string) => {
    setSectionId(nextSectionId);
    setSearchOpen(false);
    setAlertsOpen(false);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  useEffect(() => {
    document.title = "YooEnergy · Energy & Utility Management Platform";
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => { mainRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }, [sectionId]);

  return <div className="airport-platform flex h-screen min-h-[620px] flex-col overflow-hidden">
    <Toaster position="top-center" richColors theme="dark" />
    <header className="relative z-[90] flex min-h-[68px] flex-none items-center border-b border-white/[.08] bg-[#04101e]/95 px-3 shadow-[0_10px_36px_rgba(0,0,0,.28)] backdrop-blur-2xl sm:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <button onClick={() => setSidebarOpen((value) => !value)} className="airport-icon-button">{sidebarOpen ? <PanelLeftClose size={16}/> : <Menu size={16}/>}</button>
        <div className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/25 bg-gradient-to-br from-cyan-300/20 to-blue-500/10 font-black text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,.14)]">YE</div>
        <div className="min-w-0 border-l border-white/10 pl-2 sm:pl-3"><h1 className="truncate text-[11px] font-bold tracking-[.03em] text-white sm:text-[13px] sm:tracking-[.05em]">YooEnergy · Energy & Utility Management Platform</h1><p className="mt-0.5 hidden text-[8px] uppercase tracking-[.16em] text-slate-600 lg:block">Electricity · Water · Thermal / BTU · Gas · Billing · AI</p></div>
      </div>

      <div className="mx-auto hidden items-center gap-2 xl:flex">
        {(language === "vi" ? ["Chu kỳ dữ liệu · 6 giây", "2.486 điểm đo", "18 cost center sẵn sàng phân bổ"] : ["Data cycle · 6 sec", "2,486 meter endpoints", "18 allocation-ready cost centers"]).map((item, index) => <div key={item} className="flex items-center gap-2 rounded-lg border border-white/[.07] bg-white/[.025] px-3 py-2 text-[9px] text-slate-400"><span className={`h-1.5 w-1.5 rounded-full ${index === 2 ? "bg-amber-300" : "bg-emerald-300"}`}/>{item}</div>)}
      </div>

      <div className="ml-2 flex flex-none items-center justify-end gap-1 sm:gap-1.5">
        <div className="hidden rounded-lg border border-white/[.07] bg-white/[.025] px-3 py-1.5 xl:block"><p className="font-mono text-[10px] font-semibold text-white">{now.toLocaleTimeString(language === "vi" ? "vi-VN" : "en-GB")}</p><p className="text-[8px] text-slate-600">UTC+7 · Live</p></div>
        <button aria-label={language === "vi" ? "Đổi ngôn ngữ" : "Change language"} className="airport-icon-button sm:hidden" onClick={()=>setLanguage(language === "vi" ? "en" : "vi")}><Languages size={14}/></button>
        <div className="hidden items-center rounded-lg border border-white/[.08] bg-white/[.03] p-0.5 sm:flex"><Languages size={13} className="mx-1 text-cyan-300"/><button onClick={() => setLanguage("en")} className={`rounded-md px-2 py-1 text-[8px] font-bold ${language === "en" ? "bg-cyan-300 text-slate-950" : "text-slate-500"}`}>ENG</button><button onClick={() => setLanguage("vi")} className={`rounded-md px-2 py-1 text-[8px] font-bold ${language === "vi" ? "bg-cyan-300 text-slate-950" : "text-slate-500"}`}>VNI</button></div>
        <button aria-label={language === "vi" ? "Tìm chức năng" : "Search functions"} className="airport-icon-button hidden sm:inline-grid" onClick={() => {setSearchOpen(true);setAlertsOpen(false)}}><Search size={15}/></button>
        <button aria-label={language === "vi" ? "Mở cảnh báo" : "Open alerts"} className="airport-icon-button relative hidden sm:inline-grid" onClick={() => {setAlertsOpen((value)=>!value);setSearchOpen(false)}}><Bell size={15}/><span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-amber-400"/></button>
        <Link aria-label={language === "vi" ? "Quay lại Digital Twin" : "Back to Digital Twin"} title={language === "vi" ? "Quay lại Digital Twin" : "Back to Digital Twin"} to="/site/hospital" className="airport-button !h-[34px] !border-cyan-300/30 !bg-cyan-300/[.08] !py-0 !font-semibold !text-cyan-50 shadow-[0_0_18px_rgba(34,211,238,.12)] transition hover:!-translate-y-0.5 hover:!border-cyan-200/50 hover:!bg-cyan-300/[.14] hover:shadow-[0_0_24px_rgba(34,211,238,.22)] focus-visible:!ring-2 focus-visible:!ring-cyan-200/60"><Building2 size={14} className="text-cyan-300 drop-shadow-[0_0_6px_rgba(103,232,249,.65)]"/><span className="hidden md:inline">Digital Twin</span></Link>
      </div>
    </header>

    <div className="relative flex min-h-0 flex-1">
      <motion.aside initial={false} animate={{ width: sidebarOpen ? 288 : 0, opacity: sidebarOpen ? 1 : 0 }} transition={{ type: "spring", damping: 30, stiffness: 280 }} className="h-full flex-none overflow-hidden border-r border-white/[.08] bg-[#06111f]/96 shadow-[20px_0_55px_rgba(0,0,0,.28)] max-lg:absolute max-lg:inset-y-0 max-lg:left-0 max-lg:z-40">
        <div className="airport-scrollbar h-full w-72 overflow-y-auto px-3 pb-8 pt-4">
          <div className="mb-4 rounded-xl border border-cyan-400/15 bg-gradient-to-br from-cyan-400/[.07] to-transparent p-4"><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300"><Zap size={19}/></span><AirportStatusBadge status="info" label={language === "vi" ? "Mô-đun độc lập" : "Independent module"}/></div><p className="mt-4 text-[10px] uppercase tracking-[.16em] text-cyan-300">Independent product</p><h2 className="mt-1 text-sm font-semibold text-white">{module.label}</h2><p className="mt-2 text-[9px] leading-relaxed text-slate-500">Runs independently and integrates with EBO, SCADA, ERP, hospital cost centers and Digital Twin.</p></div>
          <p className="mb-2 px-2 text-[9px] uppercase tracking-[.18em] text-slate-600">{tr("Module navigation")}</p>
          <nav className="space-y-1">{module.sections.map((item) => { const Icon = item.icon ?? CircleGauge; const active = item.id === sectionId; return <button key={item.id} onClick={() => navigateSection(item.id)} className={`group flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition ${active ? "border-cyan-400/25 bg-cyan-400/10 text-white" : "border-transparent text-slate-400 hover:border-white/[.07] hover:bg-white/[.035] hover:text-slate-200"}`}><Icon size={15} className={`mt-0.5 flex-none ${active ? "text-cyan-300" : "text-slate-600"}`}/><span className="min-w-0 flex-1"><span className="block text-[11px] font-medium">{item.label}</span><span className="mt-0.5 line-clamp-2 block text-[9px] text-slate-600">{item.description}</span></span>{active&&<ChevronRight size={14} className="mt-1 text-cyan-300"/>}</button>})}</nav>
          <div className="mt-4 grid grid-cols-2 gap-2">{[["EBO",Server,"ebo-digital-twin-integration"],["SCADA",Network,"gateway-management"],["Allocation",Database,"tenant-billing"],["Rules",Settings2,"budgets-alerts"]].map(([label,Icon,target])=><button type="button" key={String(label)} onClick={()=>navigateSection(String(target))} className="rounded-lg border border-white/[.06] bg-white/[.025] p-3 text-left transition hover:border-cyan-300/20 hover:bg-cyan-300/[.045]"><Icon size={14} className="text-cyan-300"/><p className="mt-2 text-[9px] text-slate-400">{String(label)}</p></button>)}</div>
        </div>
      </motion.aside>

      <main ref={mainRef} className="airport-scrollbar min-w-0 flex-1 overflow-y-auto px-3 pb-16 pt-3 sm:px-4 sm:pt-4">
        <AirportSectionHeader eyebrow="YooEnergy" title={section.label} description={section.description} actions={<><AirportStatusBadge status="info" label={language === "vi" ? "Dữ liệu trình diễn" : "Presentation data"}/><button className="airport-button" onClick={() => toast.success(language === "vi" ? "Đã tạo snapshot" : "Snapshot created")}>Create snapshot</button></>}/>
        <div className="mt-4 pb-12"><EnergyUtilityModule sectionId={sectionId} onNavigateSection={navigateSection}/></div>
      </main>
    </div>
    {searchOpen && <motion.div initial={{opacity:0}} animate={{opacity:1}} className="fixed inset-0 z-[120] bg-[#020711]/75 p-3 backdrop-blur-sm"><div className="mx-auto mt-16 w-full max-w-xl overflow-hidden rounded-2xl border border-cyan-300/18 bg-[#071426] shadow-2xl"><div className="flex items-center gap-2 border-b border-white/[.07] p-3"><Search size={15} className="text-cyan-300"/><input autoFocus value={searchQuery} onChange={(event)=>setSearchQuery(event.target.value)} placeholder={language === "vi" ? "Tìm section, chức năng hoặc dữ liệu…" : "Search sections, workflows or data…"} className="min-w-0 flex-1 bg-transparent text-[11px] text-white outline-none placeholder:text-slate-600"/><button aria-label={language === "vi" ? "Đóng tìm kiếm" : "Close search"} onClick={()=>setSearchOpen(false)} className="airport-icon-button"><X size={14}/></button></div><div className="airport-scrollbar max-h-[60vh] space-y-1 overflow-y-auto p-2">{searchResults.map((item)=>{const Icon=item.icon??CircleGauge;return <button key={item.id} onClick={()=>navigateSection(item.id)} className="flex w-full items-center gap-3 rounded-xl border border-transparent p-3 text-left hover:border-cyan-300/15 hover:bg-cyan-300/[.045]"><span className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-300/8 text-cyan-300"><Icon size={16}/></span><span className="min-w-0 flex-1"><b className="block text-[10px] text-white">{item.label}</b><small className="mt-1 line-clamp-1 block text-[9px] text-slate-600">{item.description}</small></span><ChevronRight size={14} className="text-slate-600"/></button>})}{searchResults.length===0&&<p className="p-6 text-center text-[10px] text-slate-500">{language === "vi" ? "Không tìm thấy chức năng phù hợp" : "No matching workflow found"}</p>}</div></div></motion.div>}
    {alertsOpen && <motion.aside initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} className="fixed right-3 top-[76px] z-[115] w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-amber-300/15 bg-[#071426]/98 shadow-2xl backdrop-blur-xl"><div className="flex items-center justify-between border-b border-white/[.07] p-3"><div><p className="text-[10px] font-semibold text-white">{language === "vi" ? "Cảnh báo ưu tiên" : "Priority alerts"}</p><p className="mt-0.5 text-[8px] text-slate-600">{language === "vi" ? "4 sự kiện đang mở" : "4 open events"}</p></div><button aria-label={language === "vi" ? "Đóng cảnh báo" : "Close alerts"} onClick={()=>setAlertsOpen(false)} className="airport-icon-button"><X size={14}/></button></div><div className="space-y-2 p-3">{[["Budget","Khối điều trị nội trú đạt 90% ngân sách điện tháng","budgets-alerts"],["Water","Khu Dialysis có mẫu lưu lượng đêm bất thường","ai-analytics"],["Gateway","GW-WARD-06 timeout 14 phút","gateway-management"],["Demand","Đỉnh tải 14:00 có thể vượt 5.9 MW","ai-analytics"]].map(([kind,text,target])=><button key={kind} onClick={()=>navigateSection(target)} className="w-full rounded-xl border border-white/[.06] bg-white/[.025] p-3 text-left hover:border-amber-300/18"><div className="flex justify-between gap-3"><span className="text-[9px] font-semibold text-amber-300">{kind}</span><ChevronRight size={13} className="text-slate-600"/></div><p className="mt-1 text-[10px] text-slate-300">{text}</p></button>)}<button onClick={()=>navigateSection("budgets-alerts")} className="airport-button w-full justify-center"><Settings2 size={14}/>{language === "vi" ? "Thiết lập rule cảnh báo" : "Configure alert rules"}</button></div></motion.aside>}
    <YooEnergyAssistant language={language} onNavigateSection={navigateSection}/>
  </div>;
}

export default YooEnergyPage;
