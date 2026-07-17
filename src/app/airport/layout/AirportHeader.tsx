import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CloudSun, Database, Languages, Search, User, X } from "lucide-react";
import { toast } from "sonner";
import { useAirportLanguage } from "../i18n/AirportLanguage";

type TimeContext = "Live" | "Playback" | "Forecast" | "Simulation";

export function AirportHeader({ viewMode, onViewModeChange, spatialContext, onSpatialContextChange }: {
  viewMode: "2d" | "3d"; onViewModeChange: (mode: "2d" | "3d") => void;
  spatialContext: string; onSpatialContextChange: (value: string) => void;
}) {
  const { language, setLanguage, tr } = useAirportLanguage();
  const [now, setNow] = useState(new Date());
  const [timeContext, setTimeContext] = useState<TimeContext>("Live");
  const [scope, setScope] = useState("Hospital-wide");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const contextOptions: TimeContext[] = ["Live", "Playback", "Forecast", "Simulation"];
  const scopeOptions = ["Hospital-wide", "Acute & Critical Care", "Inpatient Services", "Diagnostics & Treatment", "Clinical Support", "Facility & Infrastructure"];
  const spatialOptions = ["All zones", "Emergency Department", "Intensive Care Unit", "Operating Theatre", "Isolation Ward", "Diagnostics & Imaging", "Central Utility Plant"];
  const notificationItems = language === "vi"
    ? [
      "Dự trữ oxy y tế thấp hơn mục tiêu vận hành 48 giờ",
      "Dự báo lượng bệnh nhân cấp cứu tăng trong 2 giờ tới",
      "Cảnh báo áp suất phòng cách ly ISO-12 đã được xử lý",
      "Độ trễ truyền ảnh PACS đang được theo dõi",
    ]
    : [
      "Medical oxygen reserve below the 48-hour operating target",
      "Emergency arrivals forecast to increase over the next two hours",
      "Isolation room ISO-12 pressure alert has been resolved",
      "PACS image-transfer latency is under monitoring",
    ];

  return (
    <header className="relative z-[85] flex h-[68px] flex-none items-center border-b border-white/[0.08] bg-[#04101e]/94 px-4 shadow-[0_8px_35px_rgba(0,0,0,.22)] backdrop-blur-2xl">
      <div className="flex min-w-[390px] items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl border border-cyan-300/25 bg-gradient-to-br from-cyan-300/20 to-blue-500/10 text-[10px] font-black tracking-wider text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,.12)]">HDT</div>
        <div className="border-l border-white/10 pl-3">
          <h1 className="text-[12px] font-bold tracking-[0.06em] text-white">Hospital Digital Twin</h1>
          <p className="mt-0.5 text-[8px] uppercase tracking-[0.16em] text-slate-600">Hospital Command · BIM · IoT · EBO · YooEnergy · AI Simulation</p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center gap-2 px-3">
        <div className="flex rounded-lg border border-white/[0.08] bg-white/[0.035] p-0.5">
          {(["2d", "3d"] as const).map((mode) => (
            <button key={mode} onClick={() => onViewModeChange(mode)} className={`rounded-md px-3 py-1.5 text-[9px] font-bold uppercase transition ${viewMode === mode ? "bg-cyan-300 text-slate-950" : "text-slate-500 hover:text-white"}`}>{mode}</button>
          ))}
        </div>
        <select value={scope} onChange={(event) => { setScope(event.target.value); toast.info(`${tr("Spatial context")}: ${tr(event.target.value)}`); }} className="airport-select">
          {scopeOptions.map((option) => <option key={option} value={option}>{tr(option)}</option>)}
        </select>
        <select value={spatialContext} onChange={(event) => onSpatialContextChange(event.target.value)} className="airport-select">
          {spatialOptions.map((option) => <option key={option} value={option}>{tr(option)}</option>)}
        </select>
        <div className="hidden items-center rounded-lg border border-white/[0.08] bg-white/[0.025] p-0.5 2xl:flex">
          {contextOptions.map((context) => (
            <button key={context} onClick={() => { setTimeContext(context); toast.success(`${tr(context)} ${language === "vi" ? "đã kích hoạt" : "context activated"}`); }} className={`rounded-md px-2.5 py-1.5 text-[9px] transition ${timeContext === context ? "bg-blue-400/15 text-blue-200" : "text-slate-600 hover:text-slate-300"}`}>{tr(context)}</button>
          ))}
        </div>
      </div>

      <div className="flex min-w-[370px] items-center justify-end gap-1.5">
        <div className="hidden items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.025] px-2.5 py-1.5 xl:flex">
          <CloudSun size={15} className="text-cyan-300" />
          <div><p className="text-[9px] font-semibold text-white">23.5°C · RH 52%</p><p className="text-[8px] text-slate-600">{language === "vi" ? "Môi trường ngoài trời ổn định" : "Outdoor environment stable"}</p></div>
        </div>
        <div className="hidden rounded-lg border border-white/[0.07] bg-white/[0.025] px-2.5 py-1.5 xl:block"><p className="font-mono text-[10px] font-semibold text-white">{now.toLocaleTimeString(language === "vi" ? "vi-VN" : "en-GB")}</p><p className="text-[8px] text-slate-600">UTC+7 · {tr("Live")}</p></div>
        <div className="flex items-center rounded-lg border border-white/[0.08] bg-white/[0.03] p-0.5" title="Language / Ngôn ngữ"><Languages size={13} className="mx-1 text-cyan-300" /><button onClick={() => setLanguage("en")} className={`rounded-md px-2 py-1 text-[8px] font-bold ${language === "en" ? "bg-cyan-300 text-slate-950" : "text-slate-500"}`}>ENG</button><button onClick={() => setLanguage("vi")} className={`rounded-md px-2 py-1 text-[8px] font-bold ${language === "vi" ? "bg-cyan-300 text-slate-950" : "text-slate-500"}`}>VNI</button></div>
        <button onClick={() => toast.success(language === "vi" ? "118/121 dịch vụ tích hợp đang hoạt động ổn định" : "Integration health: 118 of 121 services nominal")} className="airport-icon-button" title="Data freshness and integration health"><Database size={15} className="text-emerald-300" /></button>
        <button onClick={() => setSearchOpen(true)} className="airport-icon-button"><Search size={15} /></button>
        <div className="relative"><button onClick={() => setNotificationOpen(!notificationOpen)} className="airport-icon-button relative"><Bell size={15} /><span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-red-400" /></button><HeaderPopup open={notificationOpen} title={tr("Live notifications")} onClose={() => setNotificationOpen(false)}><div className="space-y-2">{notificationItems.map((item, index) => <button key={item} onClick={() => toast.info(item)} className="block w-full rounded-lg border border-white/[.06] bg-white/[.025] p-2 text-left text-[10px] text-slate-300 hover:bg-white/5"><span className={index < 2 ? "text-amber-300" : "text-cyan-300"}>●</span> {item}</button>)}</div></HeaderPopup></div>
        <div className="relative"><button onClick={() => setUserOpen(!userOpen)} className="airport-icon-button"><User size={15} /></button><HeaderPopup open={userOpen} title={tr("Demo operator")} onClose={() => setUserOpen(false)}><div className="space-y-1 text-[10px]"><p className="text-white">{language === "vi" ? "Điều hành viên Hospital Command" : "Hospital Command Operator"}</p><p className="text-slate-500">{tr("Simulation environment · Read/write demo")}</p><button onClick={() => toast.success(language === "vi" ? "Đã mở hồ sơ điều hành viên" : "Operator profile loaded")} className="airport-button mt-3 w-full justify-center">{tr("Open profile")}</button></div></HeaderPopup></div>
      </div>

      <AnimatePresence>{searchOpen && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="absolute left-1/2 top-[76px] z-[120] w-[640px] -translate-x-1/2 rounded-xl border border-white/10 bg-[#071426]/98 p-3 shadow-2xl"><div className="flex items-center gap-2"><Search size={16} className="text-cyan-300" /><input autoFocus placeholder={language === "vi" ? "Tìm khoa, phòng, giường, thiết bị, hệ thống và sự cố…" : "Search departments, rooms, beds, equipment, systems and incidents…"} onKeyDown={(event) => { if (event.key === "Enter") toast.info(`${language === "vi" ? "Tìm kiếm demo" : "Demo search"}: ${(event.target as HTMLInputElement).value}`); }} className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600" /><button onClick={() => setSearchOpen(false)} className="airport-icon-button"><X size={15} /></button></div><div className="mt-3 grid grid-cols-3 gap-2">{["ED-RESUS-02", "ICU-BED-18", language === "vi" ? "Phòng mổ OR-04" : "Operating Theatre OR-04", "ISO-12", "MED-00084", "Medical Gas Plant"].map((item) => <button key={item} onClick={() => { toast.success(`${tr("Spatial context")}: ${item}`); setSearchOpen(false); }} className="rounded-lg bg-white/[.035] px-3 py-2 text-left text-[10px] text-slate-400 hover:text-cyan-200">{item}</button>)}</div></motion.div>}</AnimatePresence>
    </header>
  );
}

function HeaderPopup({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  return <AnimatePresence>{open && <motion.div initial={{ opacity: 0, y: -6, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: .98 }} className="absolute right-0 top-11 z-[130] w-72 rounded-xl border border-white/10 bg-[#071426]/98 p-3 shadow-2xl"><div className="mb-3 flex items-center justify-between"><h3 className="text-xs font-semibold text-white">{title}</h3><button onClick={onClose} className="text-slate-600 hover:text-white"><X size={14} /></button></div>{children}</motion.div>}</AnimatePresence>;
}
