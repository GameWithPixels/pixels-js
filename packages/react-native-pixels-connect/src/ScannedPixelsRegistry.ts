import { ScannedPixel } from "./ScannedPixel";

const _pixelIdMap = new Map<number, ScannedPixel>();

// For internal use only
export const ScannedPixelsRegistry = {
  register(scannedPixel: ScannedPixel): void {
    _pixelIdMap.set(scannedPixel.pixelId, scannedPixel);
  },

  find(id: string | number): ScannedPixel | undefined {
    if (typeof id === "number") {
      return _pixelIdMap.get(id);
    } else {
      for (const sp of _pixelIdMap.values()) {
        if (sp.systemId === id) {
          return sp;
        }
      }
    }
  },

  getAll(): ScannedPixel[] {
    return [..._pixelIdMap.values()];
  },
} as const;
