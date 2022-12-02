import type {
  IPixel,
  PixelDesignAndColorNames,
  PixelRollStateNames,
} from "@systemic-games/pixels-core-connect";

export default interface ScannedPixel extends IPixel {
  readonly systemId: string;
  readonly pixelId: number;
  readonly address: number;
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
