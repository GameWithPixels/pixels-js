import { PixelDesignAndColor, PixelRollState } from "./Messages";

/**
 * Common accessible values for all Pixel implementations.
 * @category Pixel
 */
export interface PixelInfo {
  readonly systemId: string;
  readonly pixelId: number;
  readonly name: string;
  readonly ledCount: number;
  readonly designAndColor: PixelDesignAndColor;
  readonly firmwareDate: Date;
  readonly rssi: number;
  readonly batteryLevel: number; // Percentage
  readonly isCharging: boolean;
  readonly rollState: PixelRollState;
  readonly currentFace: number; // Face value (not index)
}
