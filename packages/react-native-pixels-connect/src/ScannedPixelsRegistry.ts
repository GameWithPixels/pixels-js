import { ScannedCharger } from "./ScannedCharger";
import { ScannedPixel } from "./ScannedPixel";

const _pixelIdMap = new Map<number, ScannedPixel | ScannedCharger>();

// For internal use only
export const ScannedPixelsRegistry = {
  register(scannedDevice: ScannedPixel | ScannedCharger): void {
    _pixelIdMap.set(scannedDevice.pixelId, scannedDevice);
  },

  find(id: string | number): ScannedPixel | ScannedCharger | undefined {
    if (typeof id === "number") {
      return _pixelIdMap.get(id);
    } else {
      for (const entry of _pixelIdMap.values()) {
        if (entry.systemId === id) {
          return entry;
        }
      }
    }
  },

  findPixel(id: string | number): ScannedPixel | undefined {
    const scannedDevice = ScannedPixelsRegistry.find(id);
    return scannedDevice?.type === "pixel" ? scannedDevice : undefined;
  },

  findCharger(id: string | number): ScannedCharger | undefined {
    const scannedDevice = ScannedPixelsRegistry.find(id);
    return scannedDevice?.type === "charger" ? scannedDevice : undefined;
  },
} as const;
