import { spatialSections } from "./spatialSections";
import { patientFlowSections } from "./patientFlowSections";
import { clinicalSections } from "./clinicalSections";
import { experienceSections } from "./experienceSections";
import { assetSections } from "./assetSections";
import { criticalUtilitySections } from "./criticalUtilitySections";
import { safetySections } from "./safetySections";
import { logisticsSections } from "./logisticsSections";
import { intelligenceSections } from "./intelligenceSections";
import { systemsSections } from "./systemsSections";

export const HOSPITAL_SECTION_SPECS = [
  ...spatialSections,
  ...patientFlowSections,
  ...clinicalSections,
  ...experienceSections,
  ...assetSections,
  ...criticalUtilitySections,
  ...safetySections,
  ...logisticsSections,
  ...intelligenceSections,
  ...systemsSections,
];

export const HOSPITAL_SECTION_DESCRIPTIONS_VI = Object.fromEntries(
  HOSPITAL_SECTION_SPECS.map((spec) => [spec.id, spec.description.vi]),
) as Record<string, string>;

export const HOSPITAL_SECTION_TITLES_VI = Object.fromEntries(
  HOSPITAL_SECTION_SPECS.map((spec) => [spec.id, spec.title.vi]),
) as Record<string, string>;
