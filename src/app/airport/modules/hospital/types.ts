export type HospitalViewKind =
  | "map"
  | "floor"
  | "table"
  | "board"
  | "flow"
  | "topology"
  | "schedule"
  | "matrix"
  | "dependency"
  | "command"
  | "scenario";

export type BilingualText = { en: string; vi: string };

export type HospitalSectionSeed = readonly [
  id: string,
  kind: HospitalViewKind,
  titleEn: string,
  titleVi: string,
  descriptionEn: string,
  descriptionVi: string,
  entities: readonly BilingualText[],
];

export type HospitalSectionItem = {
  id: string;
  label: BilingualText;
  location: BilingualText;
  owner: BilingualText;
  value: BilingualText;
  status: "normal" | "warning" | "critical" | "info";
  timestamp: string;
  sla: BilingualText;
};

export type HospitalSectionSpec = {
  id: string;
  domain: string;
  kind: HospitalViewKind;
  title: BilingualText;
  description: BilingualText;
  items: HospitalSectionItem[];
};

export type HospitalSectionProps = {
  sectionId: string;
};
