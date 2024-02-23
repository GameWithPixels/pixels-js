import {
  Color,
  getPixel,
  Pixel,
  PixelInfo,
} from "@systemic-games/react-native-pixels-connect";

export function blinkDie(pixel?: Pick<PixelInfo, "pixelId">): void {
  (!pixel || pixel instanceof Pixel ? pixel : getPixel(pixel.pixelId))
    ?.blink(Color.dimMagenta, { duration: 1000, count: 2 })
    .catch(() => {});
}
