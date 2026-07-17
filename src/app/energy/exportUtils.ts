export type ExportFileFormat = "xlsx" | "csv" | "json" | "txt" | "pdf";

export type ExportValue = string | number | boolean | null | undefined;
export type ExportRow = Record<string, ExportValue>;

type ExportOptions = {
  baseName: string;
  sheetName: string;
  rows: ExportRow[];
  format: ExportFileFormat;
};

const MIME_TYPES: Record<ExportFileFormat, string> = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv;charset=utf-8",
  json: "application/json;charset=utf-8",
  txt: "text/plain;charset=utf-8",
  pdf: "application/pdf",
};

function safeName(value: string) {
  return value.trim().replace(/[^a-zA-Z0-9-_]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "yooenergy-export";
}

function headersFor(rows: ExportRow[]) {
  return Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
}

function valueText(value: ExportValue) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function csvCell(value: ExportValue) {
  const text = valueText(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function tabularText(rows: ExportRow[], separator: string) {
  const headers = headersFor(rows);
  return [headers.join(separator), ...rows.map((row) => headers.map((header) => valueText(row[header])).join(separator))].join("\r\n");
}

function xmlEscape(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function columnName(index: number) {
  let current = index + 1;
  let result = "";
  while (current > 0) {
    const remainder = (current - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    current = Math.floor((current - 1) / 26);
  }
  return result;
}

function xlsxSheetXml(rows: ExportRow[]) {
  const headers = headersFor(rows);
  const matrix: ExportValue[][] = [headers, ...rows.map((row) => headers.map((header) => row[header]))];
  const lastCell = `${columnName(Math.max(headers.length - 1, 0))}${Math.max(matrix.length, 1)}`;
  const sheetRows = matrix.map((row, rowIndex) => {
    const cells = row.map((value, columnIndex) => {
      const ref = `${columnName(columnIndex)}${rowIndex + 1}`;
      if (typeof value === "number" && Number.isFinite(value)) return `<c r="${ref}"><v>${value}</v></c>`;
      if (typeof value === "boolean") return `<c r="${ref}" t="b"><v>${value ? 1 : 0}</v></c>`;
      return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(valueText(value))}</t></is></c>`;
    }).join("");
    return `<row r="${rowIndex + 1}">${cells}</row>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:${lastCell}"/><sheetViews><sheetView workbookViewId="0"/></sheetViews><sheetFormatPr defaultRowHeight="15"/><sheetData>${sheetRows}</sheetData></worksheet>`;
}

let crcTable: Uint32Array | null = null;

function getCrcTable() {
  if (crcTable) return crcTable;
  crcTable = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
    crcTable[index] = value >>> 0;
  }
  return crcTable;
}

function crc32(bytes: Uint8Array) {
  const table = getCrcTable();
  let crc = 0xffffffff;
  for (const byte of bytes) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function uint16(value: number) {
  const bytes = new Uint8Array(2);
  new DataView(bytes.buffer).setUint16(0, value, true);
  return bytes;
}

function uint32(value: number) {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value >>> 0, true);
  return bytes;
}

function concatBytes(parts: Uint8Array[]) {
  const result = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

function zipStore(files: Array<{ name: string; content: string }>) {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let localOffset = 0;

  for (const file of files) {
    const name = encoder.encode(file.name);
    const data = encoder.encode(file.content);
    const crc = crc32(data);
    const localHeader = concatBytes([
      uint32(0x04034b50), uint16(20), uint16(0x0800), uint16(0), uint16(0), uint16(0),
      uint32(crc), uint32(data.length), uint32(data.length), uint16(name.length), uint16(0), name,
    ]);
    localParts.push(localHeader, data);

    const centralHeader = concatBytes([
      uint32(0x02014b50), uint16(20), uint16(20), uint16(0x0800), uint16(0), uint16(0), uint16(0),
      uint32(crc), uint32(data.length), uint32(data.length), uint16(name.length), uint16(0), uint16(0),
      uint16(0), uint16(0), uint32(0), uint32(localOffset), name,
    ]);
    centralParts.push(centralHeader);
    localOffset += localHeader.length + data.length;
  }

  const localData = concatBytes(localParts);
  const centralData = concatBytes(centralParts);
  const end = concatBytes([
    uint32(0x06054b50), uint16(0), uint16(0), uint16(files.length), uint16(files.length),
    uint32(centralData.length), uint32(localData.length), uint16(0),
  ]);
  return concatBytes([localData, centralData, end]);
}

function createXlsx(rows: ExportRow[], sheetName: string) {
  const safeSheetName = sheetName.replace(/[\\/?*:[\]]/g, " ").slice(0, 31) || "YooEnergy";
  const files = [
    { name: "[Content_Types].xml", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>` },
    { name: "_rels/.rels", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
    { name: "xl/workbook.xml", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${xmlEscape(safeSheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>` },
    { name: "xl/_rels/workbook.xml.rels", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>` },
    { name: "xl/worksheets/sheet1.xml", content: xlsxSheetXml(rows) },
  ];
  return new Blob([zipStore(files)], { type: MIME_TYPES.xlsx });
}

function pdfEscape(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function asciiText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/₫/g, "VND ").replace(/[^\x20-\x7E]/g, " ");
}

function createPdf(rows: ExportRow[], title: string) {
  const headers = headersFor(rows);
  const lines = [title, `Exported: ${new Date().toISOString()}`, "", headers.join(" | "), ...rows.map((row) => headers.map((header) => valueText(row[header])).join(" | "))]
    .map((line) => asciiText(line).slice(0, 150));
  const pageChunks: string[][] = [];
  for (let index = 0; index < lines.length; index += 43) pageChunks.push(lines.slice(index, index + 43));

  const pageCount = Math.max(pageChunks.length, 1);
  const fontId = 3 + pageCount * 2;
  const objects: string[] = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  const pageIds = Array.from({ length: pageCount }, (_, index) => 3 + index * 2);
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageCount} >>`;
  pageChunks.forEach((chunk, index) => {
    const pageId = 3 + index * 2;
    const contentId = pageId + 1;
    const commands = ["BT", "/F1 8 Tf", "36 560 Td", ...chunk.flatMap((line, lineIndex) => [`(${pdfEscape(line)}) Tj`, lineIndex < chunk.length - 1 ? "0 -12 Td" : ""]), "ET"].filter(Boolean).join("\n");
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId] = `<< /Length ${commands.length} >>\nstream\n${commands}\nendstream`;
  });
  objects[fontId] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let id = 1; id <= fontId; id += 1) {
    offsets[id] = pdf.length;
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${fontId + 1}\n0000000000 65535 f \n`;
  for (let id = 1; id <= fontId; id += 1) pdf += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${fontId + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([pdf], { type: MIME_TYPES.pdf });
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function createTabularExport({ baseName, sheetName, rows, format }: ExportOptions) {
  if (rows.length === 0) throw new Error("No rows available for export");
  const normalizedBaseName = safeName(baseName);
  let blob: Blob;
  if (format === "xlsx") blob = createXlsx(rows, sheetName);
  else if (format === "csv") blob = new Blob([`\ufeff${tabularText(rows, ",")}`], { type: MIME_TYPES.csv });
  else if (format === "json") blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), rows }, null, 2)], { type: MIME_TYPES.json });
  else if (format === "txt") blob = new Blob([tabularText(rows, "\t")], { type: MIME_TYPES.txt });
  else blob = createPdf(rows, sheetName);
  const fileName = `${normalizedBaseName}.${format}`;
  return { blob, fileName };
}

export function downloadTabularFile(options: ExportOptions) {
  const { blob, fileName } = createTabularExport(options);
  downloadBlob(blob, fileName);
  return fileName;
}
