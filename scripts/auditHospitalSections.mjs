import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const hospitalRoot = path.join(root, "src/app/airport/modules/hospital");
const registryPath = path.join(hospitalRoot, "hospitalSectionRegistry.tsx");
const configPath = path.join(root, "src/app/airport/config/airportRegistry.ts");
const domainFiles = [
  "spatialSections.ts", "patientFlowSections.ts", "clinicalSections.ts",
  "experienceSections.ts", "assetSections.ts", "criticalUtilitySections.ts",
  "safetySections.ts", "logisticsSections.ts", "intelligenceSections.ts", "systemsSections.ts",
].map((file) => path.join(hospitalRoot, "data", file));

const read = (file) => fs.readFileSync(file, "utf8");
const specs = domainFiles.flatMap((file) => [...read(file).matchAll(/^\s*\["([a-z0-9-]+)",\s*"([a-z]+)",/gm)].map((match) => ({ id: match[1], kind: match[2], file })));
const rendererIds = [...read(registryPath).matchAll(/^\s*"([^"]+)": createHospitalSectionRenderer\("\1"\),/gm)].map((match) => match[1]);
const configuredIds = new Set([...read(configPath).matchAll(/id:\s*"([a-z0-9-]+)"/g)].map((match) => match[1]));
const duplicate = (values) => values.filter((value, index) => values.indexOf(value) !== index);
const specIds = specs.map((spec) => spec.id);
const allowedKinds = new Set(["map", "floor", "table", "board", "flow", "topology", "schedule", "matrix", "dependency", "command", "scenario"]);

const failures = [];
if (specs.length !== 94) failures.push(`Expected 94 section specs; found ${specs.length}`);
if (rendererIds.length !== 94) failures.push(`Expected 94 explicit renderers; found ${rendererIds.length}`);
if (duplicate(specIds).length) failures.push(`Duplicate section specs: ${duplicate(specIds).join(", ")}`);
if (duplicate(rendererIds).length) failures.push(`Duplicate renderers: ${duplicate(rendererIds).join(", ")}`);
const missingRenderer = specIds.filter((id) => !rendererIds.includes(id));
const missingSpec = rendererIds.filter((id) => !specIds.includes(id));
const missingConfig = specIds.filter((id) => !configuredIds.has(id));
const invalidKinds = specs.filter((spec) => !allowedKinds.has(spec.kind));
if (missingRenderer.length) failures.push(`Specs without renderer: ${missingRenderer.join(", ")}`);
if (missingSpec.length) failures.push(`Renderers without spec: ${missingSpec.join(", ")}`);
if (missingConfig.length) failures.push(`Specs absent from navigation config: ${missingConfig.join(", ")}`);
if (invalidKinds.length) failures.push(`Invalid renderer kinds: ${invalidKinds.map((item) => `${item.id}:${item.kind}`).join(", ")}`);

const genericSource = read(path.join(root, "src/app/airport/modules/AirportModuleContent.tsx"));
if (/HospitalDomainDashboard|DOMAIN_PROFILES|generic dashboard/i.test(genericSource)) failures.push("Generic Hospital dashboard fallback is still referenced");

const bannedContent = /(?:1[.,]128\s*ha|semiconductor|industrial park|khu\s+công\s+nghiệp|\bKCN\b|\binvestor\b|\bparcel\b|\btenant\b)/i;
const contentFiles = [...domainFiles, path.join(hospitalRoot, "shared/HospitalPatterns.tsx")];
const bannedHits = contentFiles.filter((file) => bannedContent.test(read(file))).map((file) => path.relative(root, file));
if (bannedHits.length) failures.push(`Banned legacy content in rebuilt Hospital UI: ${bannedHits.join(", ")}`);

const kindCounts = Object.fromEntries([...allowedKinds].map((kind) => [kind, specs.filter((spec) => spec.kind === kind).length]));
console.log(JSON.stringify({ sectionSpecs: specs.length, explicitRenderers: rendererIds.length, configuredSections: specs.length - missingConfig.length, kindCounts, failures }, null, 2));
if (failures.length) process.exit(1);
