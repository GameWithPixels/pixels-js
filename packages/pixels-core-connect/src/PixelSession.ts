/** List of possible connection statuses for a @see PixelSession. */
export type PixelSessionConnectionStatus =
  | "connecting"
  | "connected"
  | "failedToConnect"
  | "ready"
  | "disconnecting"
  | "disconnected";

/** Data for a connection event. */
export interface PixelSessionConnectionEvent {
  pixelSystemId: string;
  connectionStatus: PixelSessionConnectionStatus;
  // TODO add reason
}

/**
 * Represents a session with a Pixel die.
 * This class is used to abstract the underlying platform used to connect to Pixels.
 */
export default abstract class PixelSession {
  protected readonly _pixelSystemId: string;
  protected _connStatusCb?: (ev: PixelSessionConnectionEvent) => void;
  private _lastConnStatus: PixelSessionConnectionStatus;

  /**
   * Instantiates a session with a Pixel.
   * No attempt is made to connect to the die at this point.
   * @param deviceSystemId The Pixel system id.
   */
  constructor(deviceSystemId: string) {
    this._pixelSystemId = deviceSystemId;
    this._lastConnStatus = "disconnected";
  }

  /** Gets the Pixel system id. */
  get pixelSystemId(): string {
    return this._pixelSystemId;
  }

  /** Gets the Pixel name. */
  abstract get pixelName(): string;

  /** Gets the last known connection status. */
  get lastConnectionStatus(): PixelSessionConnectionStatus {
    return this._lastConnStatus;
  }

  /**
   * Sets the function to be called when the Pixel connection status changes.
   * @param connectionStatusListener The function called when the Pixel connection status changes.
   */
  setConnectionEventListener(
    connectionStatusListener?: (ev: PixelSessionConnectionEvent) => void
  ) {
    this._connStatusCb = connectionStatusListener;
  }

  /** Connects to the Pixel. */
  abstract connect(): Promise<void>;

  /** Disconnects from the Pixel. */
  abstract disconnect(): Promise<void>;

  /**
   * Subscribes to the "notify" characteristic and returns unsubscribe function.
   * @param listener The function to be called when the Pixel connection status changes.
   */
  abstract subscribe(
    listener: (dataView: DataView) => void
  ): Promise<() => void>;

  /**
   * Sends data to Pixel using the "write" characteristic
   * @param data The raw data to send to the Pixel.
   * @param withoutResponse Whether or not to request the device to acknowledge having received the data.
   * @param timeoutMs The timeout in milliseconds before throwing an error when waiting for the device to acknowledgement.
   */
  abstract writeValue(
    data: ArrayBuffer,
    withoutResponse?: boolean,
    timeoutMs?: number // Default should be Constants.defaultRequestTimeout
  ): Promise<void>;

  protected _notifyConnectionEvent(
    connectionStatus: PixelSessionConnectionStatus
  ) {
    if (this._lastConnStatus !== connectionStatus) {
      this._lastConnStatus = connectionStatus;
      this._connStatusCb?.({
        pixelSystemId: this._pixelSystemId,
        connectionStatus,
      });
    }
  }
}
