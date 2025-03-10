import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";

import idsCsv from "!/labels/certification-ids.csv";

// Cached value
let getProductIds: ((name: string) => ProductIds | undefined) | undefined;

export interface ProductIds {
  name: string;
  colorInitials: string;
  model: string;
  fccId1: string; // die
  fccId2: string; // charger
  icId1: string; // die
  icId2: string; // charger
  upcCode: string;
}

/**
 * Loads certification ids data, parse it, and returns a function that gets
 * the products ids for a given product name.
 * @remarks The returned function is kept and returned on subsequent calls.
 */
export async function loadCertificationIds(): Promise<
  (name: string) => ProductIds | undefined
> {
  // Only load once
  if (!getProductIds) {
    // Load CSV files with certification ids
    const assets = await Asset.loadAsync(idsCsv);
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

    // Get lines and headers from CSV
    const lines = csv.split(csv.includes("\r\n") ? "\r\n" : "\n");
    if (lines.length < 6) {
      throw new Error("readCertificationIds: Empty or single line CSV file");
    }
    const headers = lines[2].split(",");
    if (headers.length < 5) {
      throw new Error(
        `readCertificationIds: Not enough columns (${headers.length}) in CSV file`
      );
    }

    // Identify columns
    const getIndex = (partialName: string) => {
      const nameLower = partialName.toLowerCase();
      const index = headers.findIndex((s) =>
        s.toLowerCase().includes(nameLower)
      );
      if (index < 0) {
        throw new Error(
          `readCertificationIds: Missing column for '${partialName}' in CSV file`
        );
      }
      return index;
    };
    const lookupNameIndex = getIndex("full name lookup");
    const nameIndex = getIndex("Packaging Full Name");
    const colorInitialsIndex = getIndex("Color Initials");
    const modelIndex = getIndex("Packaging Model ID");
    const fccId1Index = getIndex("Packaging FCC ID 1");
    const fccId2Index = getIndex("Packaging FCC ID 2");
    const icId1Index = getIndex("Packaging IC ID 1");
    const icId2Index = getIndex("Packaging IC ID 2");
    const upcIndex = getIndex("GS1 US TIN");

    // Break up lines in cells
    const cells = lines
      .filter((l) => !!l.length)
      .map((l, i) => {
        const elements = l.split(",");
        if (elements.length < 5) {
          throw new Error(
            `readCertificationIds: Not enough columns (${
              headers.length
            }) for line ${i + 1} in CSV file`
          );
        }
        const upcCode = elements[upcIndex];
        if (upcCode.length === 14 && upcCode.startsWith("00")) {
          elements[upcIndex] = upcCode.substring(2);
        }
        return elements;
      });

    // Function to get the value of a cell
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

    // Our return value: a function that returns the product ids for a given product name
    getProductIds = (lookupName: string) => {
      const nameLower = lookupName.toLowerCase();
      const lineIndex = cells.findIndex((line) =>
        line[lookupNameIndex]?.toLowerCase().includes(nameLower)
      );
      if (lineIndex > 0) {
        return {
          name: getCellValue(nameIndex, lineIndex),
          colorInitials: getCellValue(colorInitialsIndex, lineIndex),
          model: getCellValue(modelIndex, lineIndex),
          fccId1: getCellValue(fccId1Index, lineIndex),
          fccId2: getCellValue(fccId2Index, lineIndex),
          icId1: getCellValue(icId1Index, lineIndex),
          icId2: getCellValue(icId2Index, lineIndex),
          upcCode: getCellValue(upcIndex, lineIndex),
        };
      }
    };
  }
  return getProductIds;
}
