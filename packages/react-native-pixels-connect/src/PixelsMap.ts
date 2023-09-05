import { Pixel } from "@systemic-games/pixels-core-connect";

// Keep list of Pixel instances in a separate file so it is not reloaded by Fast Refresh after a change in getPixel
export const PixelsMap = new Map<string, Pixel>();
