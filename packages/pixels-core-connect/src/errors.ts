import { MessageType } from "./Messages";
import { Pixel } from "./Pixel";

/**
 * Base class for errors thrown by the {@link Pixel} class.
 * @category Pixels
 */
export class PixelError extends Error {
  /** The Pixel for which the error occurred. */
  readonly pixel: Pixel;

  /** The error description. */
  readonly description: string;

  /** The original error that caused this error to be thrown. */
  readonly cause?: Error;

  constructor(pixel: Pixel, message: string, cause?: Error) {
    // We get a code from native errors
    const code = cause && (cause as any).code;
    if (code) {
      message += ` (${code})`;
    }
    // Initialize instance
    super(`Pixel ${pixel.name}: ${message}`);
    this.name = "PixelError";
    this.pixel = pixel;
    this.description = message;
    this.cause = cause;
  }
}

/**
 * Base class for errors thrown by the {@link Pixel.connect} instance method.
 * @category Pixels
 */
export class PixelConnectError extends PixelError {
  constructor(pixel: Pixel, msgOrError: string | Error | unknown) {
    const isError = msgOrError instanceof Error;
    const isPixelError = isError && msgOrError instanceof PixelError;
    const msg =
      typeof msgOrError === "string"
        ? msgOrError
        : isPixelError
        ? `Connection error, ${(msgOrError as PixelError).description}`
        : isError
        ? `Connection error, ${msgOrError.message}`
        : `Unknown connection error, ${JSON.stringify(msgOrError)}`;
    const cause = isError ? msgOrError : undefined;
    super(pixel, msg, cause);
    this.name = "PixelConnectError";
  }
}

/**
 * Thrown by {@link Pixel.connect} on connection timeout.
 * @category Pixels
 */
export class PixelConnectTimeoutError extends PixelConnectError {
  constructor(pixel: Pixel, timeoutMs: number) {
    super(pixel, `Connection timeout after ${timeoutMs} ms`);
    this.name = "PixelConnectTimeoutError";
  }
}

/**
 * Thrown by {@link Pixel.connect} on connection error caused by a cancellation
 * (such as a call to {@link Pixel.disconnect} during the connection sequence).
 * @category Pixels
 */
export class PixelConnectCancelledError extends PixelConnectError {
  constructor(pixel: Pixel) {
    super(pixel, `Connection cancelled (current state is ${pixel.status})`);
    this.name = "PixelConnectCancelledError";
  }
}

/**
 * Thrown by {@link Pixel.connect} on connection error caused by a Pixel id
 * mismatch between the one given to the instance's constructor and the one
 * received during identification.
 * @category Pixels
 */
export class PixelConnectIdMismatchError extends PixelConnectError {
  constructor(pixel: Pixel, pixelId: number) {
    super(
      pixel,
      `Identification mismatch, expecting ${pixel.pixelId.toString(
        16
      )} but got ${pixelId.toString(16)}`
    );
    this.name = "PixelIdMismatchError";
  }
}

/**
 * Thrown by methods of the {@link Pixel} class on errors caused by a timeout
 * while waiting for a message from the die.
 * @category Pixels
 */
export class PixelWaitForMessageTimeoutError extends PixelError {
  constructor(pixel: Pixel, timeoutMs: number, messageType: MessageType) {
    super(
      pixel,
      `Timeout of ${timeoutMs}ms waiting for message ${messageType}`
    );
    this.name = "PixelMessageTimeoutError";
  }
}

/**
 * Thrown by methods of the {@link Pixel} class on errors caused by a disconnection
 * while waiting for a message from the die.
 * @category Pixels
 */
export class PixelWaitForMessageDisconnectError extends PixelError {
  constructor(pixel: Pixel, messageType: MessageType) {
    super(pixel, `Disconnected while waiting for message ${messageType}`);
    this.name = "PixelMessageConnectStatusError";
  }
}

/**
 * Thrown by methods of the {@link Pixel} class when trying to send a message which
 * is incompatible with the current firmware running on the die.
 * @category Pixels
 */
export class PixelIncompatibleMessageError extends PixelConnectError {
  constructor(
    pixel: Pixel,
    name: string,
    libApiVersion: number,
    fwApiVersion: number,
    compat: "library" | "firmware"
  ) {
    super(
      pixel,
      `Message ${name} cannot be send, firmware ${
        compat === "firmware" ? "compat. " : ""
      } API version is ${fwApiVersion} but library ${
        compat === "library" ? "compat. " : ""
      } API version is ${libApiVersion}`
    );
    this.name = "PixelConnectIncompatibleFirmwareError";
  }
}
