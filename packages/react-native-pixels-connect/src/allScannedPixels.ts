import { ScannedPixel } from "./ScannedPixel";

const _pixelIdMap = new Map<number, ScannedPixel>();

// For internal use only
export function registerScannedPixel(scannedPixel: ScannedPixel): void {
  _pixelIdMap.set(scannedPixel.pixelId, scannedPixel);
}

// For internal use only
export function getScannedPixel(pixelId: number): ScannedPixel | null {
  return _pixelIdMap.get(pixelId) ?? null;
}
