import { unsigned32ToHex } from "@systemic-games/pixels-core-utils";

export function getBootloaderAdvertisedName(pixelId: number): string {
  if (!pixelId) {
    throw new Error("getBootloaderAdvertisedName: got empty Pixel id");
  }
  return "PXL" + unsigned32ToHex(pixelId);
}

export function isBootloaderName(name: string): boolean {
  return name.startsWith("PXL") || name.startsWith("Dfu");
}

export function getDefaultPixelName(pixelId: number): string {
  if (!pixelId) {
    throw new Error("getDefaultPixelName: got empty Pixel id");
  }
  return "Pixel" + unsigned32ToHex(pixelId);
}
