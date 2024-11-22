import { ScannedDevice } from "./PixelScanner";
import { ScannedBootloader } from "./ScannedBootloader";
import { ScannedCharger } from "./ScannedCharger";
import { ScannedPixel } from "./ScannedPixel";

const _devicesMap = new Map<
  number, // pixelId
  {
    device?: ScannedPixel | ScannedCharger;
    bootloader?: ScannedBootloader;
    legacyService?: boolean;
  }
>();

function createEmptyItem(
  pixelId: number
): NonNullable<ReturnType<typeof _devicesMap.get>> {
  const item = {};
  _devicesMap.set(pixelId, item);
  return item;
}

// For internal use only
export const ScannedDevicesRegistry = {
  store(scannedDevice: ScannedDevice, service?: "custom" | "legacy"): void {
    const item =
      _devicesMap.get(scannedDevice.pixelId) ??
      createEmptyItem(scannedDevice.pixelId);
    if (scannedDevice.type === "bootloader") {
      item.bootloader = scannedDevice;
    } else {
      item.device = scannedDevice;
    }
    item.legacyService =
      service === undefined ? undefined : service === "legacy";
  },

  find(id: string | number): ScannedDevice | undefined {
    if (typeof id === "number") {
      const item = _devicesMap.get(id);
      return item?.device ?? item?.bootloader;
    } else {
      for (const item of _devicesMap.values()) {
        if (item.device?.systemId === id) {
          return item.device;
        } else if (item.bootloader?.systemId === id) {
          return item.bootloader;
        }
      }
    }
  },

  findPixel(id: string | number): ScannedPixel | undefined {
    const scannedDevice = ScannedDevicesRegistry.find(id);
    return scannedDevice?.type === "die" ? scannedDevice : undefined;
  },

  findCharger(id: string | number): ScannedCharger | undefined {
    const scannedDevice = ScannedDevicesRegistry.find(id);
    return scannedDevice?.type === "charger" ? scannedDevice : undefined;
  },

  findBootloader(id: string | number): ScannedBootloader | undefined {
    const scannedDevice = ScannedDevicesRegistry.find(id);
    return scannedDevice?.type === "bootloader" ? scannedDevice : undefined;
  },

  hasLegacyService(id: string | number): boolean | undefined {
    if (typeof id === "number") {
      const item = _devicesMap.get(id);
      return item?.legacyService;
    } else {
      for (const item of _devicesMap.values()) {
        if (item.device?.systemId === id) {
          return item?.legacyService;
        }
      }
    }
    return false;
  },
} as const;
