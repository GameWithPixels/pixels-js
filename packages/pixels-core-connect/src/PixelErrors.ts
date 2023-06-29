import { Pixel } from "./Pixel";

/**
 * Base class for all errors thrown by the {@link Pixel} class.
 * @category Pixel
 */
export class PixelError extends Error {
  private _pixel: Pixel;
  private _cause?: Error;

  /** The Pixels die for which the error occurred. */
  get pixel(): Pixel {
    return this._pixel;
  }

  /** The original error that caused this error to be thrown. */
  get cause(): Error | undefined {
    return this._cause;
  }

  constructor(pixel: Pixel, message: string, cause?: Error) {
    super(`Pixel ${pixel.name}: ${message}`);
    this.name = "PixelError";
    this._pixel = pixel;
    this._cause = cause;
  }
}

/**
 * Base class for all errors thrown by the {@link Pixel.connect}
 * instance method.
 * @category Pixel
 */
export class PixelConnectError extends PixelError {
  constructor(pixel: Pixel, msgOrError: string | Error | unknown) {
    const isError = msgOrError instanceof Error;
    const msg =
      typeof msgOrError === "string"
        ? msgOrError
        : isError
        ? `Connection error. ${msgOrError.message}`
        : `Unsupported connection error, data is ${JSON.stringify(msgOrError)}`;
    const cause = isError ? msgOrError : undefined;
    super(pixel, `Pixel ${pixel.name}: ${msg}`, cause);
    this.name = "PixelConnectError";
  }
}

/**
 * Class used by {@link Pixel} to throw errors caused by a connection timeout.
 * @category Pixel
 */
export class PixelConnectTimeoutError extends PixelConnectError {
  constructor(pixel: Pixel, message: string) {
    super(pixel, message);
    this.name = "PixelConnectTimeoutError";
  }
}

/**
 * Class used by {@link Pixel} to throw errors caused by a connection error
 * to do to cancellation (such as a call to {@link Pixel.disconnect} during
 * the connection process).
 * @category Pixel
 */
export class PixelConnectCancelledError extends PixelConnectError {
  constructor(pixel: Pixel) {
    super(pixel, `Connection cancelled (current state is ${pixel.status})`);
    this.name = "PixelConnectCancelledError";
  }
}

/**
 * Class used by {@link Pixel} to throw errors caused by a Pixel id mismatch
 * between the one given to the instance's constructor and the one received
 * during identification.
 * @category Pixel
 */
export class PixelConnectIdMismatchError extends PixelError {
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
