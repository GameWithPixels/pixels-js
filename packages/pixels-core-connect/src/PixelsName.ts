import { unsigned32ToHex } from "@systemic-games/pixels-core-utils";

export const PixelsNamePrefixes = {
  die: {
    bootloader: "PXL",
    default: "Pixel",
  },
  charger: {
    bootloader: "LCC",
    default: "Charger",
  },
  mpc: {
    bootloader: "LCC", // MPC
    default: "Control", // PixelMPC
  },
} as const;

export function getPixelsBootloaderAdvertisedName(
  type: keyof typeof PixelsNamePrefixes,
  pixelId: number
): string {
  if (!pixelId) {
    throw new Error("getBootloaderAdvertisedName: got empty Pixel id");
  }
  const prefix = PixelsNamePrefixes[type].bootloader;
  if (!prefix) {
    throw new Error("isPixelDeviceName: unknown Pixels device type");
  }
  return prefix + unsigned32ToHex(pixelId);
}

function isPixelsName(name: string, prefix: string): boolean {
  return name.length === prefix.length + 8 && name.startsWith(prefix);
}

export function isPixelsBootloaderName(
  type: keyof typeof PixelsNamePrefixes,
  name: string
): boolean {
  const prefix = PixelsNamePrefixes[type].bootloader;
  if (!prefix) {
    throw new Error("isPixelDeviceName: unknown Pixels device type");
  }
  return isPixelsName(name, prefix);
}

export function isPixelsDeviceName(
  type: keyof typeof PixelsNamePrefixes,
  name: string
): boolean {
  const prefix = PixelsNamePrefixes[type].default;
  if (!prefix) {
    throw new Error("isPixelDeviceName: unknown Pixels device type");
  }
  return isPixelsName(name, prefix);
}

export function getDefaultPixelsDeviceName(
  type: keyof typeof PixelsNamePrefixes,
  pixelId: number
): string {
  if (!pixelId) {
    throw new Error("getDefaultPixelName: got empty Pixel id");
  }
  const prefix = PixelsNamePrefixes[type].default;
  if (!prefix) {
    throw new Error("getDefaultPixelName: unknown Pixels device type");
  }
  return prefix + unsigned32ToHex(pixelId);
}

function getPixelId(name: string, prefix: string): number | undefined {
  if (isPixelsName(name, prefix)) {
    return parseInt(name.slice(prefix.length), 16);
  }
}

export function getPixelIdFromName(name: string): number | undefined {
  for (const prefixes of Object.values(PixelsNamePrefixes)) {
    const blId = getPixelId(name, prefixes.bootloader);
    if (blId !== undefined) {
      return blId;
    }
    const devId = getPixelId(name, prefixes.default);
    if (devId !== undefined) {
      return devId;
    }
  }
}
