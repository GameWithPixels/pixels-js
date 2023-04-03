import { PixelDesignAndColorNames, PixelRollStateNames } from "./Messages";

/**
 * Common accessible values for all Pixel implementations.
 * @category Pixel
 */
export interface PixelInfo {
  readonly systemId: string;
  readonly pixelId: number;
  readonly name: string;
  readonly ledCount: number;
  readonly designAndColor: PixelDesignAndColorNames;
  readonly firmwareDate: Date;
  readonly rssi: number;
  readonly batteryLevel: number; // Percentage
  readonly isCharging: boolean;
  readonly rollState: PixelRollStateNames;
  readonly currentFace: number; // Face value (not index)
}
