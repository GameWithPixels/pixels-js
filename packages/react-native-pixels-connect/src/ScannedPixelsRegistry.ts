import { ScannedCharger } from "./ScannedCharger";
import { ScannedPixel } from "./ScannedPixel";

const _pixelIdMap = new Map<
  number,
  | { type: "pixel"; item: ScannedPixel }
  | { type: "charger"; item: ScannedCharger }
>();

// For internal use only
export const ScannedPixelsRegistry = {
  registerPixel(scannedPixel: ScannedPixel): void {
    _pixelIdMap.set(scannedPixel.pixelId, {
      type: "pixel",
      item: scannedPixel,
    });
  },

  registerCharger(scannedCharger: ScannedCharger): void {
    _pixelIdMap.set(scannedCharger.pixelId, {
      type: "charger",
      item: scannedCharger,
    });
  },

  find(
    id: string | number
  ):
    | { type: "pixel"; item: ScannedPixel }
    | { type: "charger"; item: ScannedCharger }
    | undefined {
    if (typeof id === "number") {
      return _pixelIdMap.get(id);
    } else {
      for (const entry of _pixelIdMap.values()) {
        if (entry.type === "pixel" && entry.item.systemId === id) {
          return entry;
        }
      }
    }
  },

  findPixel(id: string | number): ScannedPixel | undefined {
    const entry = ScannedPixelsRegistry.find(id);
    return entry?.type === "pixel" ? entry.item : undefined;
  },

  findCharger(id: string | number): ScannedCharger | undefined {
    const entry = ScannedPixelsRegistry.find(id);
    return entry?.type === "charger" ? entry.item : undefined;
  },
} as const;
