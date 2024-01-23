import { Color, Pixel } from "@systemic-games/react-native-pixels-connect";

export function blinkDie(pixel?: Pixel): void {
  pixel?.blink(Color.dimMagenta, { duration: 1000, count: 2 }).catch(() => {});
}
