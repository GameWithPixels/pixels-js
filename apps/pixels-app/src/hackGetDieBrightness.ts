import { store } from "./app/store";

// TODO hack until proper management of brightness
export function hackGetDieBrightness(pixel: { pixelId: number }): number {
  return (
    store.getState().pairedDice.paired.find((d) => d.pixelId === pixel.pixelId)
      ?.brightness ?? 1
  );
}
