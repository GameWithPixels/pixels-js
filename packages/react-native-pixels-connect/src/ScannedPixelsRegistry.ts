import { ScannedPixel } from "./ScannedPixel";

const _pixelIdMap = new Map<number, ScannedPixel>();

// For internal use only
const ScannedPixelsRegistry = {
  register(scannedPixel: ScannedPixel): void {
    _pixelIdMap.set(scannedPixel.pixelId, scannedPixel);
  },

  find(pixelId: number): ScannedPixel | undefined {
    return _pixelIdMap.get(pixelId);
  },

  getAll(): ScannedPixel[] {
    return [..._pixelIdMap.values()];
  },
} as const;

export default ScannedPixelsRegistry;
