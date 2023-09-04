import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";

import stickerZip from "!/stickers/certification-ids.csv";

export interface ProductIds {
  name: string;
  model: string;
  fccId: string;
  icId: string;
  upcCode: string;
}

export async function loadCertificationIds(): Promise<
  (name: string) => ProductIds | undefined
> {
  const assets = await Asset.loadAsync(stickerZip);
  if (!assets[0]) {
    throw new Error("readCertificationIds: no asset loaded for CSV file");
  }
  const uri = assets[0].localUri;
  if (!uri?.length) {
    throw new Error(
      "readCertificationIds: Certification ids CSV file is not local"
    );
  }
  const csv = await FileSystem.readAsStringAsync(uri);
  const lines = csv.split(csv.includes("\r\n") ? "\r\n" : "\n");
  if (lines.length < 2) {
    throw new Error("readCertificationIds: Empty or single line CSV file");
  }
  const titles = lines[0].split(",");
  if (titles.length < 5) {
    throw new Error(
      `readCertificationIds: Not enough columns (${titles.length}) in CSV file`
    );
  }
  // Identify columns
  const getIndex = (partialName: string) => {
    const nameLower = partialName.toLowerCase();
    const index = titles.findIndex((s) => s.toLowerCase().includes(nameLower));
    if (index < 0) {
      throw new Error(
        `readCertificationIds: Missing column for '${partialName}' in CSV file`
      );
    }
    return index;
  };
  const nameIndex = getIndex("Full Name");
  const modelIndex = getIndex("Full Model");
  const fccIdIndex = getIndex("FCC ID");
  const icIdIndex = getIndex("IC ID");
  const upcIndex = getIndex("GS1 US TIN");
  const cells = lines.map((l, i) => {
    const elements = l.split(",");
    if (elements.length < 5) {
      throw new Error(
        `readCertificationIds: Not enough columns (${titles.length}) for line ${
          i + 1
        } in CSV file`
      );
    }
    const upcCode = elements[upcIndex];
    if (upcCode.length === 14 && upcCode.startsWith("00")) {
      elements[upcIndex] = upcCode.substring(2);
    }
    return elements;
  });
  const getCellValue = (nameIndex: number, lineIndex: number) => {
    let value = "";
    // Go up lines until we find a value (we stop at the header line)
    while (!value && lineIndex > 0) {
      value = cells[lineIndex][nameIndex];
      --lineIndex;
    }
    if (!value) {
      throw new Error(
        `readCertificationIds: Unable to resolve cell ${lineIndex}:${nameIndex} in CSV file`
      );
    }
    return value;
  };
  return (name: string) => {
    const nameLower = name.toLowerCase();
    const lineIndex = cells.findIndex((line) =>
      line[nameIndex]?.toLowerCase().includes(nameLower)
    );
    if (lineIndex > 0) {
      return {
        name: getCellValue(nameIndex, lineIndex),
        model: getCellValue(modelIndex, lineIndex),
        fccId: getCellValue(fccIdIndex, lineIndex),
        icId: getCellValue(icIdIndex, lineIndex),
        upcCode: getCellValue(upcIndex, lineIndex),
      };
    }
  };
}
