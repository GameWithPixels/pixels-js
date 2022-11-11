/**
 * Returns a unique name for a Pixel, mostly to be used for sorting purposes.
 * @param pixel A Pixel or a scanned Pixel.
 * @returns A name guaranteed to be unique across Pixel peripherals.
 */
export default function (pixel: { pixelId: number; readonly name: string }) {
  return `${pixel.name}$[${pixel.pixelId}]`;
}
