import { ScannedDevice } from "./PixelScanner";
import { ScannedBootloader } from "./ScannedBootloader";
import { ScannedCharger } from "./ScannedCharger";
import { ScannedPixel } from "./ScannedPixel";

const _pixelIdMap = new Map<number, ScannedDevice>();
const _legacyDevices = new Set<number>();

// For internal use only
export const ScannedDevicesRegistry = {
  store(
    scannedDevice: ScannedDevice,
    service: "custom" | "legacy" = "custom"
  ): void {
    _pixelIdMap.set(scannedDevice.pixelId, scannedDevice);
    if (service === "legacy") {
      _legacyDevices.add(scannedDevice.pixelId);
    } else {
      _legacyDevices.delete(scannedDevice.pixelId);
    }
  },

  find(id: string | number): ScannedDevice | undefined {
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
    const scannedDevice = ScannedDevicesRegistry.find(id);
    return scannedDevice?.type === "pixel" ? scannedDevice : undefined;
  },

  findCharger(id: string | number): ScannedCharger | undefined {
    const scannedDevice = ScannedDevicesRegistry.find(id);
    return scannedDevice?.type === "charger" ? scannedDevice : undefined;
  },

  findBootloader(id: string | number): ScannedBootloader | undefined {
    const scannedDevice = ScannedDevicesRegistry.find(id);
    return scannedDevice?.type === "bootloader" ? scannedDevice : undefined;
  },

  hasLegacyService(id: number): boolean {
    return _legacyDevices.has(id);
  },
} as const;
