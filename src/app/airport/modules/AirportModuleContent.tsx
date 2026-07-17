import React from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import type { AirportModuleId } from "../config/airportRegistry";
import { getAirportModule } from "../config/airportRegistry";
import { useAirportLanguage } from "../i18n/AirportLanguage";
import { AirportSectionHeader, AirportStatusBadge } from "../shared/AirportUI";
import { EnergyUtilityModule } from "./EnergyUtilityModule";
import { FacilityOperationsModule } from "./FacilityOperationsModule";
import { HOSPITAL_SECTION_RENDERERS } from "./hospital/hospitalSectionRegistry";
import { UnsupportedHospitalSection } from "./hospital/shared/HospitalPatterns";

type Props = {
  moduleId: AirportModuleId;
  sectionId: string;
  onNavigateSection?: (sectionId: string) => void;
};

export default function AirportModuleContent({ moduleId, sectionId, onNavigateSection }: Props) {
  const { localizeModule, language } = useAirportLanguage();
  const sourceModule = getAirportModule(moduleId);
  const module = localizeModule(sourceModule);
  const section = module.sections.find((item) => item.id === sectionId) ?? module.sections[0];

  if (moduleId === "BMS") {
    return (
      <motion.div key={`${moduleId}-${sectionId}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="h-full min-h-0">
        <FacilityOperationsModule sectionId={sectionId}/>
      </motion.div>
    );
  }

  const SectionRenderer = HOSPITAL_SECTION_RENDERERS[sectionId];
  if (import.meta.env.DEV && moduleId !== "ENERGY" && !SectionRenderer) {
    console.error(`[HDT] Missing explicit renderer for ${moduleId}/${sectionId}`);
  }

  const presentation = language === "vi" ? "Dữ liệu trình diễn" : "Presentation data";
  const snapshot = language === "vi" ? "Tạo ảnh chụp" : "Create snapshot";

  return (
    <motion.div key={`${moduleId}-${sectionId}`} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .22 }} className="space-y-4 pb-28">
      <AirportSectionHeader
        eyebrow={module.label}
        title={section.label}
        description={section.description}
        actions={<>
          {moduleId === "ENERGY" && (
            <Link to="/site/yooenergy" className="airport-button !border-cyan-300/25 !bg-cyan-300/10 !text-cyan-100">
              <ExternalLink size={13}/>{language === "vi" ? "Mở YooEnergy" : "Open YooEnergy"}
            </Link>
          )}
          <AirportStatusBadge status="info" label={presentation}/>
          <button onClick={() => toast.success(language === "vi" ? "Đã tạo ảnh chụp màn hình trình diễn" : "Presentation snapshot created")} className="airport-button">
            {snapshot}
          </button>
        </>}
      />

      {moduleId === "ENERGY" ? (
        <EnergyUtilityModule sectionId={sectionId} onNavigateSection={onNavigateSection}/>
      ) : SectionRenderer ? (
        <SectionRenderer sectionId={sectionId}/>
      ) : (
        <UnsupportedHospitalSection sectionId={sectionId}/>
      )}
    </motion.div>
  );
}
