import type { BilingualText, HospitalSectionSeed, HospitalSectionSpec } from "../types";

const LOCATIONS: BilingualText[] = [
  { en: "Acute Care Tower", vi: "Khối điều trị tích cực" },
  { en: "Outpatient Block", vi: "Khối ngoại trú" },
  { en: "Diagnostics Centre", vi: "Trung tâm chẩn đoán" },
  { en: "Clinical Support", vi: "Khối hỗ trợ lâm sàng" },
  { en: "Central Plant", vi: "Trung tâm hạ tầng" },
  { en: "Hospital Campus", vi: "Khuôn viên bệnh viện" },
];

const OWNERS: BilingualText[] = [
  { en: "Hospital Operations", vi: "Vận hành bệnh viện" },
  { en: "Clinical Coordination", vi: "Điều phối lâm sàng" },
  { en: "Facility Engineering", vi: "Kỹ thuật công trình" },
  { en: "Digital Health", vi: "Y tế số" },
  { en: "Safety & Quality", vi: "An toàn & Chất lượng" },
];

const STATUS = ["normal", "info", "warning", "normal", "normal", "critical"] as const;
const VALUES: BilingualText[] = [
  bi("Ready", "Sẵn sàng"), bi("8 min", "8 phút"), bi("92%", "92%"),
  bi("4 open", "4 mục mở"), bi("N+1", "N+1"), bi("Due 14:30", "Đến hạn 14:30"),
];

export function bi(en: string, vi: string): BilingualText {
  return { en, vi };
}

export function defineHospitalSections(domain: string, seeds: readonly HospitalSectionSeed[]): HospitalSectionSpec[] {
  return seeds.map(([id, kind, titleEn, titleVi, descriptionEn, descriptionVi, entities], sectionIndex) => ({
    id,
    domain,
    kind,
    title: bi(titleEn, titleVi),
    description: bi(descriptionEn, descriptionVi),
    items: entities.flatMap((label, entityIndex) => [0, 1].map((variant) => {
      const index = entityIndex * 2 + variant;
      return {
        id: `${id}-${index + 1}`,
        label,
        location: LOCATIONS[(sectionIndex + index) % LOCATIONS.length],
        owner: OWNERS[(sectionIndex * 2 + index) % OWNERS.length],
        value: VALUES[(sectionIndex + index * 2) % VALUES.length],
        status: STATUS[(sectionIndex + index) % STATUS.length],
        timestamp: `${String(8 + ((sectionIndex + index) % 10)).padStart(2, "0")}:${String((sectionIndex * 7 + index * 11) % 60).padStart(2, "0")}`,
        sla: bi(`${12 + ((sectionIndex + index) % 7) * 6} min`, `${12 + ((sectionIndex + index) % 7) * 6} phút`),
      };
    })),
  }));
}
