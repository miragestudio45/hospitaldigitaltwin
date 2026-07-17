import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin, X } from "lucide-react";
import { BMSModelViewer } from "./BMSModelViewer";
import { ASSET_LOCATION_MODEL_URL, type AssetLocationInfo } from "./bmsAssetLocationConfig";
import type { BMSEquipment } from "./bmsEquipmentConfig";
import { AirportStatusBadge } from "../../shared/AirportUI";
import { useAirportLanguage } from "../../i18n/AirportLanguage";

export function BMSAssetLocationModal({
  open,
  onClose,
  equipment,
  info,
}: {
  open: boolean;
  onClose: () => void;
  equipment: BMSEquipment;
  info?: AssetLocationInfo;
}) {
  const { language } = useAirportLanguage();
  const vi = language === "vi";
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  return <AnimatePresence>
    {open && <>
      <motion.button
        aria-label="Close asset location"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed bottom-0 left-0 right-0 top-[60px] z-[120] cursor-default bg-black/70 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: .97, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .97, y: 10 }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        className="fixed bottom-4 left-4 right-4 top-[68px] z-[121] flex min-h-0 flex-col overflow-hidden rounded-2xl border border-cyan-400/18 bg-[#06111f] shadow-[0_30px_100px_rgba(0,0,0,.65)]"
      >
        <div className="flex items-center gap-3 border-b border-white/[.08] px-4 py-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg border border-cyan-400/18 bg-cyan-400/[.08] text-cyan-300"><MapPin size={17}/></span>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-semibold uppercase tracking-[.18em] text-cyan-300">{vi ? "Vị trí thiết bị" : "Asset location"}</p>
            <h3 className="mt-0.5 truncate text-sm font-semibold text-white">{equipment.name} · {vi ? equipment.nameVi : equipment.category}</h3>
          </div>
          <AirportStatusBadge status="normal" label={vi ? "Đã định vị" : "Located"}/>
          <button onClick={onClose} className="airport-icon-button !h-9 !w-9" title={vi ? "Đóng" : "Close"}><X size={16}/></button>
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-h-0 p-3"><BMSModelViewer modelUrl={ASSET_LOCATION_MODEL_URL} highlightObjectName={info?.locationObjectName} accentColor={equipment.accentColor}/></div>
          <aside className="airport-scrollbar min-h-0 overflow-y-auto border-l border-white/[.08] bg-[#08172a]/88 p-4">
            <p className="text-[9px] font-semibold uppercase tracking-[.16em] text-slate-500">{vi ? "Thông tin asset" : "Asset information"}</p>
            <div className="mt-3 space-y-2">
              {[
                [vi ? "Mã thiết bị" : "Asset ID", info?.code ?? "—"],
                [vi ? "Công trình" : "Building", info?.building ?? "—"],
                [vi ? "Tầng" : "Level", info?.floor ?? "—"],
                [vi ? "Khu vực" : "Area", info?.area ?? "—"],
                [vi ? "Hệ" : "System", equipment.category],
                [vi ? "Loại thiết bị" : "Equipment type", equipment.name],
              ].map(([label,value]) => <div key={label} className="flex items-start justify-between gap-3 rounded-lg border border-white/[.07] bg-white/[.03] px-3 py-2.5"><span className="text-[10px] text-slate-500">{label}</span><b className="text-right text-[10px] text-cyan-200">{value}</b></div>)}
            </div>
            <p className="mt-5 text-[9px] font-semibold uppercase tracking-[.16em] text-slate-500">{vi ? "Thông số vận hành" : "Operating values"}</p>
            <div className="mt-3 space-y-2">{equipment.parameters.map(parameter => <div key={parameter.key} className="rounded-lg border border-white/[.07] bg-white/[.03] px-3 py-2.5"><div className="flex items-center justify-between gap-3"><span className="text-[10px] text-slate-400">{parameter.label}</span><b className="text-[10px] text-white">{String(parameter.value)} {parameter.unit}</b></div></div>)}</div>
          </aside>
        </div>
      </motion.div>
    </>}
  </AnimatePresence>;
}
