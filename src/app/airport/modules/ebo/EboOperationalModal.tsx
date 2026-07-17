import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ShieldCheck, X } from "lucide-react";
import { AirportStatusBadge } from "../../shared/AirportUI";

export interface EboDetailField {
  label: string;
  value: React.ReactNode;
  tone?: "normal" | "warning" | "critical" | "info";
}

export function EboOperationalModal({
  open,
  onClose,
  eyebrow = "EBO integrated operational view",
  title,
  subtitle,
  status = "normal",
  statusLabel = "Live",
  fields = [],
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  status?: "normal" | "warning" | "critical" | "offline" | "info";
  statusLabel?: string;
  fields?: EboDetailField[];
  children?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && <>
        <motion.button
          aria-label="Close operational detail"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed bottom-0 left-0 right-0 top-[60px] z-[150] cursor-default bg-black/72 backdrop-blur-sm"
        />
        <motion.section
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0, scale: .985, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: .985, y: 8 }}
          transition={{ type: "spring", stiffness: 280, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 top-[68px] z-[151] flex min-h-0 flex-col overflow-hidden rounded-2xl border border-cyan-400/18 bg-[#06111f] shadow-[0_32px_110px_rgba(0,0,0,.72)]"
        >
          <header className="flex flex-none items-center gap-3 border-b border-white/[.08] bg-[#071426]/96 px-4 py-3">
            <span className="grid h-9 w-9 flex-none place-items-center rounded-lg border border-cyan-400/18 bg-cyan-400/[.08] text-cyan-300"><ShieldCheck size={17}/></span>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-semibold uppercase tracking-[.18em] text-cyan-300">{eyebrow}</p>
              <h2 className="mt-0.5 truncate text-sm font-semibold text-white">{title}</h2>
              {subtitle && <p className="mt-0.5 truncate text-[9px] text-slate-500">{subtitle}</p>}
            </div>
            <AirportStatusBadge status={status} label={statusLabel}/>
            <button onClick={onClose} className="airport-icon-button !h-9 !w-9" title="Close"><X size={16}/></button>
          </header>

          <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_310px]">
            <main className="airport-scrollbar min-h-0 overflow-y-auto p-4">{children}</main>
            <aside className="airport-scrollbar min-h-0 overflow-y-auto border-l border-white/[.08] bg-[#08172a]/72 p-4">
              <p className="text-[9px] font-semibold uppercase tracking-[.16em] text-slate-500">Operational context</p>
              <div className="mt-3 space-y-2">
                {fields.map((field) => <div key={field.label} className="rounded-lg border border-white/[.07] bg-white/[.03] px-3 py-2.5">
                  <div className="flex items-start justify-between gap-3"><span className="text-[9px] text-slate-500">{field.label}</span><b className={`text-right text-[10px] ${field.tone === "warning" ? "text-amber-200" : field.tone === "critical" ? "text-red-200" : field.tone === "normal" ? "text-emerald-300" : "text-cyan-200"}`}>{field.value}</b></div>
                </div>)}
              </div>
              <div className="mt-5 rounded-xl border border-emerald-400/15 bg-emerald-400/[.045] p-3">
                <div className="flex items-start gap-2"><CheckCircle2 size={14} className="mt-0.5 flex-none text-emerald-300"/><p className="text-[9px] leading-relaxed text-slate-400">Commands in this demonstration environment require role-based permission, confirmation and an audit-trail entry. Integrated security and video functions remain governed by their source platforms.</p></div>
              </div>
            </aside>
          </div>
          {footer && <footer className="flex flex-none items-center justify-end gap-2 border-t border-white/[.08] bg-[#071426]/96 px-4 py-3">{footer}</footer>}
        </motion.section>
      </>}
    </AnimatePresence>
  );
}
