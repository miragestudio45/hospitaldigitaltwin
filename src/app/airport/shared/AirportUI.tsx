import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownUp, ChevronLeft, ChevronRight, Columns3, Download, Grid3X3, Search,
  SlidersHorizontal, X, PanelLeftClose,
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { AirportModuleDefinition, AirportModuleId, AirportSectionDefinition, AirportStatus } from "../config/airportRegistry";
import { AIRPORT_MODULES } from "../config/airportRegistry";
import type { PageSize } from "../data/airportMockData";
import { useAirportLanguage } from "../i18n/AirportLanguage";

const statusClasses: Record<AirportStatus | "info", string> = {
  normal: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
  optimized: "border-cyan-400/25 bg-cyan-400/10 text-cyan-200",
  warning: "border-amber-400/25 bg-amber-400/10 text-amber-200",
  critical: "border-red-400/30 bg-red-400/10 text-red-200",
  offline: "border-slate-400/20 bg-slate-400/10 text-slate-300",
  info: "border-blue-400/25 bg-blue-400/10 text-blue-200",
};

export function AirportStatusBadge({ status, label }: { status: AirportStatus | "info"; label?: string }) {
  const { tr } = useAirportLanguage();
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-semibold ${statusClasses[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current shadow-[0_0_8px_currentColor]" />
      {tr(label ?? status)}
    </span>
  );
}

export function AirportMetricCard({ label, value, trend, tone = "cyan", compact = false }: { label: string; value: string | number; trend?: string; tone?: "cyan" | "blue" | "emerald" | "amber" | "red" | "violet"; compact?: boolean }) {
  const { tr } = useAirportLanguage();
  const tones = {
    cyan: "from-cyan-400/16 border-cyan-400/20 text-cyan-200",
    blue: "from-blue-400/16 border-blue-400/20 text-blue-200",
    emerald: "from-emerald-400/16 border-emerald-400/20 text-emerald-200",
    amber: "from-amber-400/16 border-amber-400/20 text-amber-200",
    red: "from-red-400/16 border-red-400/20 text-red-200",
    violet: "from-violet-400/16 border-violet-400/20 text-violet-200",
  };
  return (
    <motion.div whileHover={{ y: -2 }} className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${tones[tone]} to-transparent ${compact ? "p-3" : "p-4"}`}>
      <div className="absolute right-0 top-0 h-16 w-16 rounded-full bg-current opacity-[0.035] blur-xl" />
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">{tr(label)}</p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <strong className={`${compact ? "text-xl" : "text-2xl"} tracking-tight text-white`}>{value}</strong>
        {trend && <span className="text-[10px] font-medium text-current">{tr(trend)}</span>}
      </div>
    </motion.div>
  );
}

export function AirportSectionHeader({ title, description, eyebrow, actions }: { title: string; description: string; eyebrow?: string; actions?: React.ReactNode }) {
  const { tr } = useAirportLanguage();
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        {eyebrow && <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">{tr(eyebrow)}</p>}
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">{tr(title)}</h2>
        <p className="mt-1 max-w-3xl text-xs text-slate-400">{tr(description)}</p>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function AirportPanel({ title, subtitle, action, children, className = "" }: { title?: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  const { tr } = useAirportLanguage();
  return (
    <section className={`rounded-xl border border-white/[0.08] bg-[#071426]/88 shadow-[0_18px_50px_rgba(0,0,0,.18)] backdrop-blur-xl ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3">
          <div><h3 className="text-xs font-semibold text-slate-100">{title ? tr(title) : title}</h3>{subtitle && <p className="mt-0.5 text-[10px] text-slate-500">{tr(subtitle)}</p>}</div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function AirportFilterBar({ search, onSearch, timeRange, onTimeRange, children }: { search?: string; onSearch?: (value: string) => void; timeRange?: string; onTimeRange?: (value: string) => void; children?: React.ReactNode }) {
  const { tr } = useAirportLanguage();
  const ranges = ["Live", "24 Hours", "7 Days", "30 Days", "90 Days", "1 Year", "3 Years", "5 Years"];
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.07] bg-slate-950/45 p-2">
      {onSearch && <label className="flex min-w-52 flex-1 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.035] px-3 py-2"><Search size={14} className="text-slate-500" /><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder={tr("Search park data…")} className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-600" /></label>}
      {onTimeRange && <select value={timeRange} onChange={(event) => onTimeRange(event.target.value)} className="airport-select">{ranges.map((range) => <option key={range} value={range}>{tr(range)}</option>)}</select>}
      {children}
      <button className="airport-button"><SlidersHorizontal size={14} /> {tr("Filters")}</button>
    </div>
  );
}

export interface AirportColumn<T> { key: keyof T & string; label: string; width?: string; render?: (row: T) => React.ReactNode; headerClassName?: string; cellClassName?: string }

export function AirportDataTable<T extends { id?: string }>({
  rows, columns, total, page, pageSize, onPageChange, onPageSizeChange, onRowClick, selectedId,
}: {
  rows: T[]; columns: AirportColumn<T>[]; total: number; page: number; pageSize: PageSize;
  onPageChange: (page: number) => void; onPageSizeChange: (size: PageSize) => void;
  onRowClick?: (row: T) => void; selectedId?: string;
}) {
  const { tr } = useAirportLanguage();
  const [sortKey, setSortKey] = useState<string>(columns[0]?.key ?? "");
  const [ascending, setAscending] = useState(true);
  const [visible, setVisible] = useState(() => new Set(columns.map((column) => column.key)));
  const [showColumns, setShowColumns] = useState(false);
  const sortedRows = useMemo(() => [...rows].sort((a, b) => {
    const left = String(a[sortKey as keyof T] ?? "");
    const right = String(b[sortKey as keyof T] ?? "");
    return left.localeCompare(right, undefined, { numeric: true }) * (ascending ? 1 : -1);
  }), [rows, sortKey, ascending]);
  const visibleColumns = columns.filter((column) => visible.has(column.key));
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const exportCsv = () => {
    const csv = [visibleColumns.map((column) => column.label), ...rows.map((row) => visibleColumns.map((column) => String(row[column.key] ?? "")))].map((line) => line.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "hospital-digital-twin-export.csv"; link.click(); URL.revokeObjectURL(url);
  };
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#071426]/90 shadow-[0_18px_45px_rgba(0,0,0,.22)]">
      <div className="flex items-center justify-between border-b border-white/[0.07] px-3 py-2">
        <span className="text-[9px] text-slate-500">{total.toLocaleString()} {tr("records · deterministic demo data")}</span>
        <div className="relative flex gap-2">
          <button onClick={() => setShowColumns(!showColumns)} className="airport-button"><Columns3 size={13} /> {tr("Columns")}</button>
          <button onClick={exportCsv} className="airport-button"><Download size={13} /> CSV</button>
          {showColumns && <div className="absolute right-20 top-10 z-50 w-52 rounded-xl border border-white/10 bg-[#09182b] p-2 shadow-2xl">{columns.map((column) => <label key={column.key} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs text-slate-300 hover:bg-white/5"><input type="checkbox" checked={visible.has(column.key)} onChange={() => setVisible((current) => { const next = new Set(current); next.has(column.key) ? next.delete(column.key) : next.add(column.key); return next; })} className="accent-cyan-400" />{column.label}</label>)}</div>}
        </div>
      </div>
      <div className="overflow-auto">
        <table className="w-full min-w-[980px] text-left text-[10px]">
          <thead className="sticky top-0 z-10 bg-[#0a192c] text-[8px] uppercase tracking-[0.11em] text-slate-500"><tr>{visibleColumns.map((column) => <th key={column.key} style={{ minWidth: column.width }} className={`px-2.5 py-1.5 align-bottom ${column.headerClassName ?? ""}`}><button className="flex items-center gap-1 whitespace-nowrap leading-tight hover:text-cyan-300" onClick={() => { if (sortKey === column.key) setAscending(!ascending); else { setSortKey(column.key); setAscending(true); } }}>{tr(column.label)}<ArrowDownUp size={10} /></button></th>)}</tr></thead>
          <tbody>{sortedRows.map((row, index) => <tr key={row.id ?? index} onClick={() => onRowClick?.(row)} className={`border-t border-white/[0.045] text-slate-300 transition-colors ${onRowClick ? "cursor-pointer hover:bg-cyan-400/[0.055]" : ""} ${row.id === selectedId ? "bg-cyan-400/[0.08]" : ""}`}>{visibleColumns.map((column) => <td key={column.key} className={`max-w-56 truncate px-2.5 py-2 text-[10px] ${column.cellClassName ?? ""}`}>{column.render ? column.render(row) : String(row[column.key] ?? "—")}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <AirportPagination page={page} totalPages={totalPages} pageSize={pageSize} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} />
    </div>
  );
}

export function AirportPagination({ page, totalPages, pageSize, onPageChange, onPageSizeChange }: { page: number; totalPages: number; pageSize: PageSize; onPageChange: (page: number) => void; onPageSizeChange: (size: PageSize) => void }) {
  const { tr } = useAirportLanguage();
  return <div className="flex items-center justify-between border-t border-white/[0.07] px-3 py-2"><select className="airport-select" value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value) as PageSize)}>{[25, 50, 100].map((size) => <option key={size} value={size}>{size} / page</option>)}</select><div className="flex items-center gap-2 text-[10px] text-slate-400"><button className="airport-icon-button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}><ChevronLeft size={14} /></button><span>{tr("Page")} <b className="text-white">{page.toLocaleString()}</b> {tr("of")} {totalPages.toLocaleString()}</span><button className="airport-icon-button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}><ChevronRight size={14} /></button></div></div>;
}

export function AirportTrendChart({ data, color = "#22d3ee", height = 210, unit = "" }: { data: Array<{ time: string; value: number; forecast?: number }>; color?: string; height?: number; unit?: string }) {
  return <div style={{ height }} className="w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data}><defs><linearGradient id={`airport-gradient-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.38} /><stop offset="100%" stopColor={color} stopOpacity={0.02} /></linearGradient></defs><CartesianGrid stroke="rgba(148,163,184,.09)" vertical={false} /><XAxis dataKey="time" tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false} minTickGap={28} /><YAxis tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false} width={38} /><Tooltip contentStyle={{ background: "#071426", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, fontSize: 11 }} formatter={(value) => [`${value}${unit}`, "Actual"]} /><Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#airport-gradient-${color.replace("#", "")})`} /><Area type="monotone" dataKey="forecast" stroke="#a78bfa" strokeWidth={1.2} strokeDasharray="4 4" fill="transparent" /></AreaChart></ResponsiveContainer></div>;
}

export function AirportTimeline({ events }: { events: ReadonlyArray<ReadonlyArray<string>> }) {
  const { tr } = useAirportLanguage();
  return <div className="space-y-1.5">{events.map((event, index) => <div key={`${event[0]}-${index}`} className="grid grid-cols-[48px_74px_1fr_auto] items-center gap-2 rounded-lg border border-white/[0.055] bg-white/[0.025] px-3 py-2"><span className="font-mono text-[10px] text-cyan-300">{event[0]}</span><span className="truncate text-[10px] font-semibold text-white">{tr(event[1])}</span><span className="truncate text-[10px] text-slate-400">{tr(event[2])} · {tr(event[3])}</span><AirportStatusBadge status={event[4] === "Warning" ? "warning" : event[4] === "Critical" ? "critical" : event[4] === "Info" ? "info" : "normal"} label={event[4]} /></div>)}</div>;
}

export function AirportModuleSidebar({ module, activeSection, onSectionChange, open, onClose, docked = false }: { module: AirportModuleDefinition; activeSection: string; onSectionChange: (id: string) => void; open: boolean; onClose: () => void; docked?: boolean }) {
  const { tr, localizeModule } = useAirportLanguage();
  const localized = localizeModule(module);
  const content = (
    <div className="airport-scrollbar h-full w-72 overflow-y-auto px-3 pb-28 pt-4">
      <div className="mb-3 flex items-start justify-between gap-3 px-2">
        <div>
          <p className="text-[9px] uppercase tracking-[0.18em] text-slate-600">{tr("Module navigation")}</p>
          <h2 className="mt-1 text-sm font-semibold text-white">{localized.label}</h2>
        </div>
        <button onClick={onClose} className="airport-icon-button !h-8 !w-8" title={tr("Hide module navigation")}>
          <PanelLeftClose size={15} />
        </button>
      </div>
      <nav className="space-y-1">
        {localized.sections.map((section) => {
          const Icon = section.icon ?? localized.icon;
          const active = section.id === activeSection;
          return (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={`group flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-all ${active ? "border-cyan-400/25 bg-cyan-400/10 text-white" : "border-transparent text-slate-400 hover:border-white/[0.07] hover:bg-white/[0.035] hover:text-slate-200"}`}
            >
              <Icon size={15} className={`mt-0.5 flex-shrink-0 ${active ? "text-cyan-300" : "text-slate-600 group-hover:text-slate-400"}`} />
              <span>
                <span className="block text-[11px] font-medium">{section.label}</span>
                <span className="mt-0.5 line-clamp-2 block text-[9px] text-slate-600">{section.description}</span>
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );

  if (docked) {
    return (
      <motion.aside
        initial={false}
        animate={{ width: open ? 288 : 0, opacity: open ? 1 : 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 280 }}
        className="relative z-[65] h-full flex-none overflow-hidden border-r border-white/[0.08] bg-[#06111f]/96 shadow-[20px_0_55px_rgba(0,0,0,.28)] backdrop-blur-2xl"
        aria-hidden={!open}
      >
        {content}
      </motion.aside>
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: -310, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -310, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 260 }}
          className="airport-scrollbar fixed bottom-0 left-0 top-[68px] z-[76] w-72 overflow-y-auto border-r border-white/[0.08] bg-[#06111f]/96 px-3 pb-28 pt-4 shadow-[24px_0_80px_rgba(0,0,0,.42)] backdrop-blur-2xl"
        >
          {content}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

export function AirportBottomNavigation({ activeModule, onModuleChange, onLauncher }: { activeModule: AirportModuleId; onModuleChange: (id: AirportModuleId) => void; onLauncher: () => void }) {
  const { tr, localizeModule } = useAirportLanguage();
  const navRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ pointerId: -1, startX: 0, startScrollLeft: 0, moved: false });

  const stopDragging = (element: HTMLDivElement, pointerId: number) => {
    if (dragRef.current.pointerId !== pointerId) return;
    if (element.hasPointerCapture(pointerId)) element.releasePointerCapture(pointerId);
    dragRef.current.pointerId = -1;
    window.setTimeout(() => { dragRef.current.moved = false; }, 0);
  };

  return (
    <div
      ref={navRef}
      className="airport-scrollbar-hidden fixed bottom-4 left-1/2 z-[80] flex w-[calc(100vw-24px)] max-w-[calc(100vw-24px)] -translate-x-1/2 flex-nowrap items-center gap-1 overflow-x-auto overflow-y-hidden rounded-2xl border border-white/10 bg-[#06111f]/88 p-1.5 shadow-[0_20px_70px_rgba(0,0,0,.5)] backdrop-blur-2xl xl:w-max xl:overflow-x-hidden"
      onWheel={(event) => {
        const element = navRef.current;
        if (!element || element.scrollWidth <= element.clientWidth) return;
        if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
          event.preventDefault();
          element.scrollLeft += event.deltaY;
        }
      }}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        const element = event.currentTarget;
        if (element.scrollWidth <= element.clientWidth + 1) {
          dragRef.current = { pointerId: -1, startX: 0, startScrollLeft: element.scrollLeft, moved: false };
          return;
        }
        dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startScrollLeft: element.scrollLeft, moved: false };
      }}
      onPointerMove={(event) => {
        if (dragRef.current.pointerId !== event.pointerId) return;
        const distance = event.clientX - dragRef.current.startX;
        if (Math.abs(distance) > 6 && !dragRef.current.moved) {
          dragRef.current.moved = true;
          event.currentTarget.setPointerCapture(event.pointerId);
        }
        if (!dragRef.current.moved) return;
        event.currentTarget.scrollLeft = dragRef.current.startScrollLeft - distance;
      }}
      onPointerUp={(event) => stopDragging(event.currentTarget, event.pointerId)}
      onPointerCancel={(event) => stopDragging(event.currentTarget, event.pointerId)}
      onClickCapture={(event) => {
        if (!dragRef.current.moved) return;
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      {AIRPORT_MODULES.map((sourceModule) => {
        const module = localizeModule(sourceModule);
        const Icon = module.icon;
        const active = activeModule === module.id;
        return <button key={module.id} onClick={() => onModuleChange(module.id)} className={`relative flex min-w-[84px] flex-none items-center justify-center gap-1.5 rounded-xl px-2.5 py-2.5 text-[10px] font-semibold transition-colors sm:gap-2 sm:px-3 xl:min-w-0 xl:flex-auto ${active ? "text-[#03111e]" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>{active && <motion.span layoutId="airport-active-module" className="absolute inset-0 rounded-xl bg-cyan-300" transition={{ type: "spring", bounce: 0.18, duration: 0.55 }} />}<Icon size={14} className="relative flex-none" /><span className="relative whitespace-nowrap">{module.shortLabel}</span></button>;
      })}
      <div className="mx-1 h-7 w-px flex-none bg-white/10" />
      <button onClick={onLauncher} className="flex flex-none items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-[10px] font-semibold text-slate-300 hover:bg-white/5 hover:text-white xl:min-w-0 xl:flex-auto"><Grid3X3 size={15} className="flex-none" /><span className="whitespace-nowrap">{tr("All Modules")}</span></button>
    </div>
  );
}

export function AirportAppLauncher({ open, onClose, onSelect }: { open: boolean; onClose: () => void; onSelect: (moduleId: AirportModuleId, sectionId: string) => void }) {
  const { tr, localizeModule } = useAirportLanguage();
  return <AnimatePresence>{open && <><motion.button aria-label="Close launcher" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" /><motion.div initial={{ opacity: 0, scale: .96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .96, y: 20 }} className="airport-scrollbar fixed inset-x-[8vw] bottom-24 top-24 z-[101] overflow-auto rounded-2xl border border-white/10 bg-[#071426]/98 p-6 shadow-2xl"><div className="flex items-center justify-between"><div><p className="text-[10px] uppercase tracking-[.2em] text-cyan-300">{tr("Hospital application launcher")}</p><h2 className="mt-1 text-xl font-semibold text-white">{tr("All operational modules")}</h2></div><button onClick={onClose} className="airport-icon-button"><X size={18} /></button></div><div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-3">{AIRPORT_MODULES.map((sourceModule) => { const module = localizeModule(sourceModule); const Icon = module.icon; return <section key={module.id} className="rounded-xl border border-white/[.07] bg-white/[.025] p-4"><div className="mb-3 flex items-center gap-3"><span className="rounded-lg bg-cyan-400/10 p-2 text-cyan-300"><Icon size={17} /></span><div><h3 className="text-sm font-semibold text-white">{module.label}</h3><p className="text-[9px] text-slate-500">{module.sections.length} {tr("operational views")}</p></div></div><div className="grid grid-cols-2 gap-1">{module.sections.map((section) => <button key={section.id} onClick={() => { onSelect(module.id, section.id); onClose(); }} className="rounded-lg px-2 py-2 text-left text-[10px] text-slate-400 hover:bg-cyan-400/[.08] hover:text-cyan-200">{section.label}</button>)}</div></section>; })}</div></motion.div></>}</AnimatePresence>;
}

export function AirportDetailDrawer({ open, title, subtitle, onClose, children }: { open: boolean; title: string; subtitle?: string; onClose: () => void; children: React.ReactNode }) {
  const { tr } = useAirportLanguage();
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return <AnimatePresence>{open && <>
    <motion.button
      aria-label="Close detail drawer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[94] cursor-default bg-black/25"
    />
    <motion.aside
      initial={{ x: 520 }}
      animate={{ x: 0 }}
      exit={{ x: 520 }}
      transition={{ type: "spring", damping: 28, stiffness: 240 }}
      className="airport-scrollbar fixed bottom-0 right-0 top-[60px] z-[95] w-[480px] max-w-[94vw] overflow-y-auto border-l border-white/10 bg-[#071426]/98 shadow-[-30px_0_80px_rgba(0,0,0,.45)] backdrop-blur-2xl"
    >
      <div className="sticky top-0 z-20 flex items-start justify-between border-b border-white/[.08] bg-[#071426]/96 px-5 py-4 backdrop-blur-2xl">
        <div><p className="text-[9px] uppercase tracking-[.18em] text-cyan-300">Context detail</p><h2 className="mt-1 text-lg font-semibold text-white">{tr(title)}</h2>{subtitle && <p className="mt-1 text-xs text-slate-500">{tr(subtitle)}</p>}</div>
        <button onClick={onClose} aria-label={tr("Close")} title={tr("Close")} className="airport-icon-button shrink-0 border-cyan-400/20 bg-cyan-400/[.06] text-cyan-200"><X size={18} /></button>
      </div>
      <div className="p-5">{children}</div>
    </motion.aside>
  </>}</AnimatePresence>;
}

export function AirportEmptyState({ title, description }: { title: string; description: string }) {
  const { tr } = useAirportLanguage();
  return <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-cyan-400/20 bg-cyan-400/[.025] p-8 text-center"><Grid3X3 className="text-cyan-400" /><h3 className="mt-3 text-sm font-semibold text-white">{tr(title)}</h3><p className="mt-1 max-w-md text-xs text-slate-500">{tr(description)}</p></div>;
}

export function sectionFor(module: AirportModuleDefinition, sectionId: string): AirportSectionDefinition {
  return module.sections.find((section) => section.id === sectionId) ?? module.sections[0];
}
