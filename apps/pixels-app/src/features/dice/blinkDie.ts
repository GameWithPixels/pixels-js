import {
  Color,
  getPixel,
  Pixel,
  PixelInfo,
} from "@systemic-games/react-native-pixels-connect";

export function blinkDie(die?: Pick<PixelInfo, "pixelId">): void {
  const pixel = !die || die instanceof Pixel ? die : getPixel(die.pixelId);
  pixel?.blink(Color.dimGreen, { duration: 1000, count: 2 }).catch(() => {});
}
