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
} as const;

export function getBootloaderAdvertisedName(
  pixelId: number,
  type: "die" | "charger" = "die"
): string {
  if (!pixelId) {
    throw new Error("getBootloaderAdvertisedName: got empty Pixel id");
  }
  return (
    (type === "die"
      ? PixelsNamePrefixes.die.bootloader
      : PixelsNamePrefixes.charger.bootloader) + unsigned32ToHex(pixelId)
  );
}

export function isPixelBootloaderName(
  name: string,
  type: "die" | "charger" = "die"
): boolean {
  return (
    name.length === 11 &&
    name.startsWith(
      type === "die"
        ? PixelsNamePrefixes.die.bootloader
        : PixelsNamePrefixes.charger.bootloader
    )
  );
}

export function isPixelDeviceName(
  name: string,
  type: "die" | "charger" = "die"
): boolean {
  return type === "die"
    ? name.length === 13 && name.startsWith(PixelsNamePrefixes.die.default)
    : name.length === 15 && name.startsWith(PixelsNamePrefixes.charger.default);
}

export function getDefaultPixelDeviceName(
  pixelId: number,
  type: "die" | "charger" = "die"
): string {
  if (!pixelId) {
    throw new Error("getDefaultPixelName: got empty Pixel id");
  }
  return (
    (type === "die"
      ? PixelsNamePrefixes.die.default
      : PixelsNamePrefixes.charger.default) + unsigned32ToHex(pixelId)
  );
}

export function getPixelIdFromName(name: string): number | undefined {
  if (
    name.length === 11 &&
    (isPixelBootloaderName(name, "die") ||
      isPixelBootloaderName(name, "charger"))
  ) {
    return parseInt(name.slice(3), 16);
  } else if (isPixelDeviceName("die")) {
    return parseInt(name.slice(5), 16);
  } else if (isPixelDeviceName("charger")) {
    return parseInt(name.slice(7), 16);
  }
}
