import type {
  PixelDesignAndColor,
  PixelRollState,
} from "@systemic-games/pixels-core-connect";

export default interface ScannedPixel {
  readonly systemId: string;
  readonly pixelId: number;
  readonly address: number;
  readonly name: string;
  readonly rssi: number;
  readonly ledCount: number;
  readonly designAndColor: PixelDesignAndColor;
  readonly rollState: PixelRollState;
  readonly currentFace: number; // Face number (not index)
  readonly batteryLevel: number;
  readonly buildTimestamp: number;
}
