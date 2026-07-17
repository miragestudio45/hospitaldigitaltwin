import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BellRing, Bot, BrainCircuit, ChevronRight, Droplets, Send, Sparkles, X, Zap } from "lucide-react";

type AssistantMessage = { id: string; role: "assistant" | "user"; text: string; sectionId?: string };
type AssistantReply = { text: string; sectionId?: string };

const SECTION_LABELS: Record<string, { vi: string; en: string }> = {
  "budgets-alerts": { vi: "Mở Budget & Alerts", en: "Open Budget & Alerts" },
  "ai-analytics": { vi: "Mở AI Analytics", en: "Open AI Analytics" },
  "tenant-billing": { vi: "Mở phân bổ chi phí", en: "Open cost allocation" },
  "gateway-management": { vi: "Mở Gateway Management", en: "Open Gateway Management" },
};

function buildReply(input: string, language: "vi" | "en"): AssistantReply {
  const normalized = input.toLowerCase();
  if (/(cảnh báo|ngưỡng|budget|alert|notification|noti)/i.test(normalized)) {
    return { sectionId: "budgets-alerts", text: language === "vi" ? "Bạn có thể tạo rule theo đối tượng, chỉ số, ngưỡng, ngân sách, kênh App/Email/Zalo OA/Webhook và escalation. Mình đã mở đúng khu vực cấu hình; các kênh gửi đang ở chế độ trình diễn." : "Create a rule by scope, metric, threshold, budget, App/Email/Zalo OA/Webhook channels and escalation. I can take you to the setup area; delivery channels are in presentation mode." };
  }
  if (/(nước|rò rỉ|water|leak|dma)/i.test(normalized)) {
    return { sectionId: "ai-analytics", text: language === "vi" ? "YooAI phát hiện mẫu lưu lượng nền bất thường tại DMA-04 từ 01:00–04:00, ước tính 420 m³/ngày. Đề xuất tạo work order kiểm tra van và tuyến ống; độ tin cậy 91%." : "YooAI detects abnormal DMA-04 base flow from 01:00–04:00, estimated at 420 m³/day. Recommended action: inspect valves and the DMA-04 pipe route; confidence 91%." };
  }
  if (/(hóa đơn|billing|invoice|phân bổ|chi phí|tiền)/i.test(normalized)) {
    return { sectionId: "tenant-billing", text: language === "vi" ? "Có 18/20 cost center đã sẵn sàng phân bổ chi phí. Khoa Chẩn đoán hình ảnh và khu Dialysis đang chờ kiểm tra dữ liệu đo. Bạn có thể mở Phân bổ chi phí để xem statement, tariff và luồng phê duyệt." : "18 of 20 hospital cost centers are allocation-ready. Imaging and Dialysis still require meter-data review. Open Cost Allocation to inspect statements, tariffs and the approval flow." };
  }
  if (/(gateway|mqtt|http|modbus|bacnet|ebo|scada)/i.test(normalized)) {
    return { sectionId: "gateway-management", text: language === "vi" ? "Lớp gateway trình diễn hỗ trợ MQTT, HTTP, Modbus và BACnet/IP. GW-TEN-118 có timeout 14 phút; chưa có kết nối thiết bị thực tế. Mở Gateway Management để xem diagnostics và kiến trúc edge." : "The presentation gateway layer supports MQTT, HTTP, Modbus and BACnet/IP. GW-TEN-118 shows a 14-minute timeout; no live field connection is active. Open Gateway Management for diagnostics and edge architecture." };
  }
  if (/(đỉnh|điện|energy|electric|peak|tiết kiệm|ai|phân tích)/i.test(normalized)) {
    return { sectionId: "ai-analytics", text: language === "vi" ? "Dự báo cho thấy đỉnh tải 48.2 MW lúc 14:00, cao hơn mục tiêu 2.4 MW. Khuyến nghị dịch tải không thiết yếu sang sau 15:00, tiềm năng tiết kiệm khoảng ₫128M/tháng với độ tin cậy 94%." : "The forecast shows a 48.2 MW peak at 14:00, 2.4 MW above target. Shift non-critical load after 15:00 for an estimated ₫128M/month saving at 94% confidence." };
  }
  return { text: language === "vi" ? "Mình có thể hỗ trợ phân tích điện, nước, BTU/gas nhiên liệu, phân bổ chi phí theo khoa, cảnh báo ngân sách và tình trạng gateway. Hãy chọn một gợi ý bên dưới hoặc mô tả bài toán năng lượng bạn muốn kiểm tra." : "I can help with electricity, water, BTU/fuel gas, hospital cost allocation, budget alerts and gateway status. Choose a suggestion below or describe the energy question you want to explore." };
}

export function YooEnergyAssistant({ language, onNavigateSection }: { language: "vi" | "en"; onNavigateSection: (sectionId: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [thinking, setThinking] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([
    { id: "welcome", role: "assistant", text: language === "vi" ? "Chào bạn, mình là YooAI — trợ lý dành riêng cho Energy & Utility Management. Mình có thể phân tích dữ liệu trình diễn và dẫn bạn đến đúng chức năng." : "Hi, I’m YooAI — the assistant for Energy & Utility Management. I can analyze presentation data and guide you to the right workflow." },
  ]);

  const send = (suggested?: string) => {
    const text = (suggested ?? query).trim();
    if (!text || thinking) return;
    setQuery("");
    setMessages((current) => [...current, { id: `user-${Date.now()}`, role: "user", text }]);
    setThinking(true);
    window.setTimeout(() => {
      const reply = buildReply(text, language);
      setMessages((current) => [...current, { id: `assistant-${Date.now()}`, role: "assistant", ...reply }]);
      setThinking(false);
    }, 480);
  };

  const quickActions = language === "vi"
    ? [["Phân tích đỉnh tải", Zap], ["Kiểm tra rò rỉ nước", Droplets], ["Thiết lập cảnh báo", BellRing], ["Xem AI khuyến nghị", BrainCircuit]] as const
    : [["Analyze peak demand", Zap], ["Check water leakage", Droplets], ["Set up an alert", BellRing], ["View AI recommendations", BrainCircuit]] as const;

  return <>
    <AnimatePresence>
      {open && <motion.aside data-yooai-panel initial={{ opacity: 0, y: 18, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 14, scale: .97 }} className="fixed bottom-[82px] right-3 z-[130] flex h-[min(620px,calc(100vh-100px))] w-[min(390px,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl border border-cyan-300/20 bg-[#06111f]/98 shadow-[0_24px_80px_rgba(0,0,0,.62),0_0_38px_rgba(34,211,238,.1)] backdrop-blur-2xl sm:right-4">
        <div className="flex items-center gap-3 border-b border-white/[.07] bg-gradient-to-r from-cyan-400/[.09] to-violet-400/[.055] p-3">
          <motion.div animate={{ y: [0, -2, 0] }} transition={{ duration: 2.2, repeat: Infinity }} className="relative grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-200"><Bot size={21}/><span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#06111f] bg-emerald-400"/></motion.div>
          <div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><h3 className="text-[12px] font-bold text-white">YooAI</h3><Sparkles size={12} className="text-violet-300"/></div><p className="mt-0.5 text-[8px] uppercase tracking-[.13em] text-slate-500">Energy intelligence copilot</p></div>
          <button aria-label={language === "vi" ? "Đóng YooAI" : "Close YooAI"} onClick={()=>setOpen(false)} className="airport-icon-button"><X size={15}/></button>
        </div>
        <div className="airport-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
          {messages.map((message)=><div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[88%] rounded-xl border px-3 py-2 text-[10px] leading-relaxed ${message.role === "user" ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-50" : "border-white/[.07] bg-white/[.035] text-slate-300"}`}><p>{message.text}</p>{message.sectionId && <button type="button" onClick={()=>{onNavigateSection(message.sectionId!);setOpen(false)}} className="mt-2 flex items-center gap-1 text-[9px] font-semibold text-cyan-300 hover:text-cyan-100">{SECTION_LABELS[message.sectionId]?.[language] ?? message.sectionId}<ChevronRight size={12}/></button>}</div></div>)}
          {thinking && <div className="flex justify-start"><div className="rounded-xl border border-white/[.07] bg-white/[.035] px-3 py-2 text-[10px] text-slate-500"><span className="inline-flex gap-1"><i className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300"/><i className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300 [animation-delay:120ms]"/><i className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300 [animation-delay:240ms]"/></span></div></div>}
        </div>
        <div className="border-t border-white/[.07] p-3">
          <div className="mb-2 grid grid-cols-2 gap-1.5">{quickActions.map(([label,Icon])=><button type="button" key={label} onClick={()=>send(label)} className="flex items-center gap-1.5 rounded-lg border border-white/[.06] bg-white/[.025] px-2 py-2 text-left text-[8px] text-slate-400 hover:border-cyan-300/20 hover:text-cyan-100"><Icon size={12}/>{label}</button>)}</div>
          <div className="flex items-end gap-2 rounded-xl border border-white/[.08] bg-white/[.035] p-2"><textarea aria-label={language === "vi" ? "Nhập câu hỏi cho YooAI" : "Ask YooAI"} rows={2} value={query} onChange={(event)=>setQuery(event.target.value)} onKeyDown={(event)=>{if(event.key==="Enter"&&!event.shiftKey){event.preventDefault();send()}}} placeholder={language === "vi" ? "Hỏi về điện, nước, BTU, gas, billing…" : "Ask about energy, water, BTU, gas, billing…"} className="min-h-9 flex-1 resize-none bg-transparent text-[10px] leading-relaxed text-white outline-none placeholder:text-slate-600"/><button aria-label={language === "vi" ? "Gửi" : "Send"} onClick={()=>send()} disabled={!query.trim() || thinking} className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-cyan-300 text-slate-950 disabled:opacity-30"><Send size={14}/></button></div>
          <p className="mt-2 text-center text-[8px] text-slate-700">{language === "vi" ? "YooAI sử dụng dữ liệu trình diễn và không gửi lệnh tới thiết bị." : "YooAI uses presentation data and sends no device commands."}</p>
        </div>
      </motion.aside>}
    </AnimatePresence>
    <motion.button data-yooai-launcher aria-label={open ? (language === "vi" ? "Đóng YooAI" : "Close YooAI") : (language === "vi" ? "Mở trợ lý YooAI" : "Open YooAI assistant")} onClick={()=>setOpen((value)=>!value)} whileHover={{ scale: 1.04 }} whileTap={{ scale: .96 }} className="fixed bottom-4 right-3 z-[131] flex items-center gap-2 rounded-2xl border border-cyan-300/25 bg-[#07182a]/96 p-2 pr-3 text-cyan-100 shadow-[0_14px_48px_rgba(0,0,0,.5),0_0_28px_rgba(34,211,238,.14)] backdrop-blur-xl sm:right-4"><motion.span animate={{ y: [0, -2, 0], rotate: [0, -2, 2, 0] }} transition={{ duration: 2.4, repeat: Infinity }} className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-300/20 to-violet-400/15"><Bot size={21}/><span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#07182a] bg-emerald-400"/></motion.span><span className="text-left"><b className="block text-[10px]">YooAI</b><small className="block text-[8px] text-slate-500">Energy copilot</small></span></motion.button>
  </>;
}

export default YooEnergyAssistant;
