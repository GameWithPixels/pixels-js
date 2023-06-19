import { Pixel } from "./Pixel";

/**
 * Class used by {@link Pixel} to throw errors.
 * @category Pixel
 */
export class PixelError extends Error {
  private _pixel: Pixel;

  get pixel(): Pixel {
    return this._pixel;
  }

  constructor(pixel: Pixel, message: string) {
    super(`Pixel ${pixel.name}: ${message}`);
    this.name = "PixelError";
    this._pixel = pixel;
  }
}

/**
 * Class used by {@link Pixel} to throw errors caused by a connection timeout.
 * @category Pixel
 */
export class PixelConnectTimeoutError extends PixelError {
  constructor(pixel: Pixel, message: string) {
    super(pixel, message);
    this.name = "PixelConnectTimeoutError";
  }
}

/**
 * Class used by {@link Pixel} to throw errors caused by a connection timeout.
 * @category Pixel
 */
export class PixelConnectCancelledError extends PixelError {
  constructor(pixel: Pixel) {
    super(pixel, `Connection cancelled (current state is ${pixel.status})`);
    this.name = "PixelConnectCancelledError";
  }
}

/**
 * Class used by {@link Pixel} to throw errors caused by a timeout waiting for a message.
 * @category Pixel
 */
export class PixelMessageTimeoutError extends PixelError {
  constructor(pixel: Pixel, message: string) {
    super(pixel, message);
    this.name = "PixelMessageTimeoutError";
  }
}

/**
 * Class used by {@link Pixel} to throw errors caused by an Pixel id mismatch.
 * @category Pixel
 */
export class PixelIdMismatchError extends PixelError {
  constructor(pixel: Pixel, pixelId: number) {
    super(
      pixel,
      `Pixel identification mismatch: expecting ${pixel.pixelId.toString(
        16
      )} but got ${pixelId.toString(16)}`
    );
    this.name = "PixelIdMismatchError";
  }
}
