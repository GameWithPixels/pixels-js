import { PixelsConnectUuids } from "./PixelsBluetoothIds";

/**
 * List of possible connection statuses for a {@link PixelSession}.
 * @category Pixels
 */
export type PixelSessionConnectionStatus =
  | "connecting"
  | "connected"
  | "failedToConnect"
  | "ready"
  | "disconnecting"
  | "disconnected";

/**
 * Data for a connection event.
 * @category Pixels
 */
export interface PixelSessionConnectionEvent {
  systemId: string;
  connectionStatus: PixelSessionConnectionStatus;
  // TODO add reason
}

/**
 * Represents a session with a Pixel die.
 * This class is used to abstract the underlying platform used to connect to Pixels.
 * @category Pixels
 */
export abstract class PixelSession {
  protected readonly _systemId: string;
  protected _connStatusCb?: (ev: PixelSessionConnectionEvent) => void;
  private _lastConnStatus: PixelSessionConnectionStatus;
  protected readonly _bleUuids: PixelsConnectUuids;

  /**
   * Instantiates a session with a Pixel.
   * No attempt is made to connect to the die at this point.
   * @param systemId The peripheral system id (as assigned by the OS).
   */
  constructor(params: { systemId: string; uuids: PixelsConnectUuids }) {
    this._systemId = params.systemId;
    this._lastConnStatus = "disconnected";
    this._bleUuids = { ...params.uuids };
  }

  /** Gets the peripheral system id (as assigned by the OS). */
  get systemId(): string {
    return this._systemId;
  }

  /**
   * Gets the Pixel name.
   * @remarks It may be undefined until connected.
   */
  abstract get pixelName(): string | undefined;

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
        systemId: this._systemId,
        connectionStatus,
      });
    }
  }
}
