import { store } from "./app/store";

// TODO hack until proper management of brightness
export function hackGetDieBrightness(pixel: { pixelId: number }): number {
  return (
    store.getState().pairedDice.paired.find((d) => d.pixelId === pixel.pixelId)
      ?.brightness ?? 1
  );
}

export function isSameBrightness(
  brightness1: number,
  brightness2: number
): boolean {
  return (brightness1 * 255) >>> 0 === (brightness2 * 255) >>> 0;
}
