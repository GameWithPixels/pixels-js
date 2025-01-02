import { unsigned32ToHex } from "@systemic-games/pixels-core-utils";
import { EventEmitter } from "events";

import { Constants } from "./Constants";
import { MessageSerializer } from "./MessageSerializer";
import { PixelInfo } from "./PixelInfo";
import {
  PixelInfoNotifierMutableProps,
  PixelInfoNotifier,
} from "./PixelInfoNotifier";
import { PixelMessage } from "./PixelMessage";
import {
  PixelSession,
  PixelSessionConnectionEventReason,
} from "./PixelSession";
import {
  PixelConnectCancelledError,
  PixelConnectTimeoutError,
  PixelConnectError,
  PixelWaitForMessageDisconnectError as WaitMsgDiscoErr,
  PixelWaitForMessageTimeoutError as WaitMsgTimeoutErr,
} from "./errors";

/**
 * The different possible connection statuses of a Pixel.
 * @category Pixels
 */
export type PixelStatus =
  | "disconnected"
  | "connecting"
  | "identifying"
  | "ready"
  | "disconnecting";

export type PixelStatusEvent = Readonly<{
  status: PixelStatus;
  lastStatus: PixelStatus;
  reason?: PixelSessionConnectionEventReason;
}>;

/**
 * The mutable properties of {@link PixelConnect} not inherited from parent
 * class {@link PixelInfoNotifier}.
 * @category Pixels
 */
export type PixelConnectOwnMutableProps = {
  /** Connection status. */
  status: PixelStatus;
};

/**
 * The mutable properties of {@link PixelConnect}.
 * @category Pixels
 */
export type PixelConnectMutableProps = PixelInfoNotifierMutableProps &
  PixelConnectOwnMutableProps;

/**
 *  {@link PixelInfo} type extend with PixelConnect props.
 * @category Pixels
 */
export type PixelInfoWithStatus = PixelInfo & PixelConnectOwnMutableProps;

/**
 * Abstract class that represents a connection to a Pixel device (die, charger, etc.).
 * @category Pixels
 */
export abstract class PixelConnect<
  MutableProps extends PixelConnectMutableProps = PixelConnectMutableProps,
  Type extends PixelInfoWithStatus = PixelInfoWithStatus,
  MessageType extends string = string,
> extends PixelInfoNotifier<MutableProps, Type> {
  // Message event emitter
  protected readonly _msgEvEmitter = new EventEmitter();

  // Message serializer
  protected readonly _serializer: MessageSerializer<MessageType>;

  // Log function
  private _logFunc: ((msg: string) => void) | undefined | null;
  private _logMessages = false;
  private _logData = false;

  // Connection data
  private readonly _session: PixelSession;
  private _status: PixelStatus;

  /** Toggle logging information about each send and received message. */
  get logMessages(): boolean {
    return this._logMessages;
  }
  set logMessages(enabled: boolean) {
    this._logMessages = enabled;
  }

  /** Toggle logging the serialized (binary) data for each send and received message. */
  get logMessagesSerializedData(): boolean {
    return this._logData;
  }
  set logMessagesSerializedData(enabled: boolean) {
    this._logData = enabled;
  }

  /** Set logger to use by this instance. */
  get logger(): ((msg: string) => void) | undefined | null {
    return this._logFunc;
  }
  set logger(logger: ((msg: string) => void) | undefined | null) {
    this._logFunc = logger;
  }

  /** Gets the Pixel last known connection status. */
  get status(): PixelStatus {
    return this._status;
  }

  protected get sessionDeviceName(): string | undefined {
    return this._session.pixelName;
  }

  protected constructor(
    serializer: MessageSerializer<MessageType>,
    session: PixelSession
  ) {
    super();
    this._serializer = serializer;
    this._session = session;
    this._status = "disconnected"; // TODO use the getLastConnectionStatus()

    // Listen to session connection status changes
    session.setConnectionEventListener(({ status, reason }) => {
      if (status === "connected" || status === "ready") {
        // It's possible that we skip some steps and get a "ready" without
        // getting first a "connecting" if the device was already connected
        this._updateStatus("connecting");
      } else {
        this._updateStatus(
          status === "failedToConnect" ? "disconnected" : status,
          reason
        );
      }
    });
  }
  /**
   * /!\ Internal, don't call this function ;)
   */
  private _dispose() {
    this._internalDispose();
    this._session.dispose();
  }

  /**
   * Registers a listener function that will be called on receiving
   * raw messages of a given type from the Pixel.
   * @param msgType The type of message to watch for.
   * @param listener The callback function.
   */
  addMessageListener(
    msgType: MessageType,
    listener: (this: PixelConnect, message: PixelMessage | MessageType) => void
  ): void {
    this._msgEvEmitter.addListener(`${msgType}Message`, listener);
  }

  /**
   * Unregisters a listener from receiving raw messages of a given type.
   * @param msgType The type of message to watch for.
   * @param listener The callback function to unregister.
   */
  removeMessageListener(
    msgType: MessageType,
    listener: (this: PixelConnect, msg: PixelMessage | MessageType) => void
  ): void {
    this._msgEvEmitter.removeListener(`${msgType}Message`, listener);
  }

  protected abstract _internalDispose(): void;
  protected abstract _onStatusChanged(ev: PixelStatusEvent): void;
  protected abstract _internalSetup(): Promise<void>;
  protected abstract _internalDeserializeMessage(
    dataView: DataView
  ): PixelMessage | MessageType;

  protected async _internalConnect(timeoutMs = 0): Promise<void> {
    try {
      // Connect to the peripheral
      await this._session.connect(timeoutMs);

      // And prepare our instance for communications with the device
      if (this.status === "connecting") {
        // Notify we're connected and proceeding with die identification
        this._updateStatus("identifying");

        try {
          // Subscribe to get messages from die (will unsubscribe on disconnect)
          await this._session.subscribe((dv: DataView) =>
            this._onValueChanged(dv)
          );

          // Setup our instance
          await this._internalSetup();

          // We're ready!
          // @ts-expect-error the status could have changed during the above async call
          if (this.status === "identifying") {
            this._updateStatus("ready");
          }
        } catch (error) {
          // Note: the error may be cause by a call to disconnect
          try {
            this._warn(`Disconnecting after getting error: ${error}`);
            await this._session.disconnect();
          } catch {}
          // Ignore any disconnection error and throw the error
          // that got us there in the first place
          throw error;
        }
      } else if (this.status === "identifying") {
        // Another call to connect has put us in identifying state,
        // just wait for status change (in this case we ignore the timeout)
        // since the connection process is driven from another call to connect)
        await new Promise<void>((resolve) => {
          const onStatusChange = ({ status }: PixelConnectMutableProps) => {
            if (status !== "identifying") {
              this.removePropertyListener("status", onStatusChange);
              resolve();
            }
          };
          this.addPropertyListener("status", onStatusChange);
        });
      }

      // Check if a status changed occurred during the connection process
      if (this.status !== "ready") {
        throw new PixelConnectCancelledError(this);
      }
    } catch (error) {
      const message = (error as any)?.message;
      if (
        typeof message === "string" &&
        message.startsWith("Connection timeout")
      ) {
        throw new PixelConnectTimeoutError(this, timeoutMs);
      } else if (error instanceof PixelConnectError) {
        // Forward other connection errors
        throw error;
      } else {
        // Wrap any other type of error in a connection error
        throw new PixelConnectError(this, error);
      }
    }
  }

  /**
   * Immediately disconnects from the die.
   * @returns A promise that resolves once the disconnect request has been processed.
   **/
  protected async _internalDisconnect(): Promise<void> {
    await this._session.disconnect();
  }

  // Callback on notify characteristic value change
  private _onValueChanged(dataView: DataView) {
    try {
      if (this._logData) {
        this._logArray(dataView.buffer);
      }
      const msgOrType = this._internalDeserializeMessage(dataView);
      const msgName = this._serializer.getMessageType(msgOrType);
      if (this._logMessages) {
        if (msgName !== "rssi" && msgName !== "batteryLevel") {
          this._log(
            `Received message ${msgName} (${this._serializer.getMessageTypeValue(msgName)})`
          );
          if (typeof msgOrType === "object") {
            // Log message contents
            this._log(msgOrType);
          }
        }
      }
      // Dispatch specific message event
      this._msgEvEmitter.emit(`${msgName}Message`, msgOrType);
    } catch (error) {
      const msg = `Message deserialization error: ${error}`;
      console.error(this._tagLogString(msg));
      this._warn(msg);
      // TODO propagate error to listeners
    }
  }

  /**
   * Waits for a message from the Pixel.
   * @param expectedMsgType Type of the message to expect.
   * @param timeoutMs Timeout before aborting the wait.
   * @returns A promise with the received message of the expected type.
   */
  protected _internalWaitForMessage(
    expectedMsgType: MessageType,
    timeoutMs: number = Constants.ackMessageTimeout
  ): Promise<PixelMessage | MessageType> {
    return new Promise((resolve, reject) => {
      let cleanup: () => void;
      // 1. Hook message listener
      const messageListener = (msg: PixelMessage | MessageType) => {
        cleanup();
        resolve(msg);
      };
      this.addMessageListener(expectedMsgType, messageListener);
      // 2. Hook connection status listener
      // Note: We don't check for the initial status so this method
      // may be called before completing the connection sequence.
      const statusListener = ({ status }: PixelConnectMutableProps) => {
        if (status === "disconnecting" || status === "disconnected") {
          // We got disconnected, stop waiting for message
          cleanup();
          reject(new WaitMsgDiscoErr(this, expectedMsgType));
        }
      };
      this.addPropertyListener("status", statusListener);
      // 3. Setup timeout
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      timeoutId = setTimeout(() => {
        timeoutId = undefined;
        cleanup();
        reject(new WaitMsgTimeoutErr(this, timeoutMs, expectedMsgType));
      }, timeoutMs);
      cleanup = () => {
        // Cancel timeout and unhook listeners
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        this.removeMessageListener(expectedMsgType, messageListener);
        this.removePropertyListener("status", statusListener);
      };
    });
  }

  /**
   * Sends a message to the Pixel.
   * @param msgOrType Message with the data to send or just a message type.
   * @param withoutAck Whether to request a confirmation that the message was received.
   * @returns A promise that resolves once the message has been send.
   */
  protected async _internalSendMessage(
    msgOrType: PixelMessage | MessageType,
    withoutAck = false
  ): Promise<void> {
    // Serialize message
    const data = this._serializer.serialize(msgOrType);
    // Log about it
    if (this._logMessages) {
      const msgName = this._serializer.getMessageType(msgOrType);
      this._log(
        `Sending message ${msgName} (${this._serializer.getMessageTypeValue(msgName)})`
      );
    }
    if (this._logData) {
      this._logArray(data);
    }
    // And send it
    await this._session.writeValue(data, withoutAck);
  }

  /**
   * Sends a message to the Pixel and wait for a specific response.
   * @param msgOrTypeToSend Message with the data to send or just a message type.
   * @param responseType Expected response type.
   * @param timeoutMs Timeout in mill-seconds before aborting waiting for the response.
   * @returns A promise resolving to the response in the form of a message type or a message object.
   */
  protected async _internalSendAndWaitForResponse(
    msgOrTypeToSend: PixelMessage | MessageType,
    responseType: MessageType,
    timeoutMs: number = Constants.ackMessageTimeout
  ): Promise<PixelMessage | MessageType> {
    // Gets the session object, throws an error if invalid
    const result = await Promise.all([
      this._internalWaitForMessage(responseType, timeoutMs),
      this._internalSendMessage(msgOrTypeToSend),
    ]);
    return result[0];
  }

  /**
   * Sends a message to the Pixel and wait for a specific response
   * which is returned casted to the expected type.
   * @param msgOrTypeToSend Message with the data to send or just a message type.
   * @param responseType Expected response class type.
   * @param responseType Expected response type.
   * @returns A promise resolving to a message object of the expected type.
   */
  protected async _internalSendAndWaitForTypedResponse<T extends PixelMessage>(
    msgOrTypeToSend: PixelMessage | MessageType,
    responseType: { new (): T },
    timeoutMs: number = Constants.ackMessageTimeout
  ): Promise<T> {
    // Gets the session object, throws an error if invalid
    return (await this._internalSendAndWaitForResponse(
      msgOrTypeToSend,
      this._serializer.getMessageType(new responseType().type),
      timeoutMs
    )) as T;
  }

  private _updateStatus(
    status: PixelStatus,
    reason?: PixelSessionConnectionEventReason
  ): void {
    if (status !== this._status) {
      const lastStatus = this._status;
      this._status = status;
      this._log(`Status changed to ${status} with reason: ${reason}`);
      this._onStatusChanged({ status, lastStatus, reason });
      this.emitPropertyEvent("status");
    }
  }

  protected _tagLogString(str: string): string {
    const id = unsigned32ToHex(this.pixelId);
    return `[${this.name} (${id})] ${str}`;
  }

  // Log the given message prepended with a timestamp and the Pixel name
  protected _log(msg: unknown): void {
    this._logFunc?.(
      this._tagLogString(
        (msg as PixelMessage)?.type ? JSON.stringify(msg) : String(msg)
      )
    );
  }

  protected _warn(msg: unknown): void {
    this._logFunc?.(
      this._tagLogString(
        "WARN: " +
          ((msg as PixelMessage)?.type ? JSON.stringify(msg) : String(msg))
      )
    );
  }

  protected _logArray(arr: ArrayBuffer) {
    if (this._logFunc) {
      this._logFunc(
        this._tagLogString(
          `${[...new Uint8Array(arr)]
            .map((b) => (b >>> 0).toString(16).padStart(2, "0"))
            .join(":")}`
        )
      );
    }
  }
}
