import {
  AnimConstants,
  Color,
  Color32Utils,
  DiceUtils,
  PixelColorway,
  PixelDieType,
} from "@systemic-games/pixels-core-animation";
import {
  assert,
  createTypedEventEmitter,
  deserialize,
  EventReceiver,
  Mutable,
  safeAssign,
  unsigned32ToHex,
} from "@systemic-games/pixels-core-utils";
import { EventEmitter } from "events";

import {
  BatteryLevel,
  Blink,
  deserializeMessage,
  getMessageType,
  IAmADie,
  LegacyIAmALCC,
  MessageOrType,
  MessageType,
  MessageTypeValues,
  PixelMessage,
  PixelPowerOperationValues,
  PixelRollState,
  PlayInstantAnimation,
  PowerOperation,
  RequestRssi,
  Rssi,
  serializeMessage,
  SetName,
  TelemetryRequestModeValues,
  VersionInfoChunk,
} from "./ChargerMessages";
import { Constants } from "./Constants";
import { PixelInfo } from "./PixelInfo";
import {
  PixelInfoNotifier,
  PixelInfoNotifierMutableProps,
} from "./PixelInfoNotifier";
import { PixelSession } from "./PixelSession";
import {
  PixelConnectCancelledError,
  PixelConnectError,
  PixelConnectIdMismatchError,
  PixelConnectTimeoutError,
  PixelEmptyNameError,
  PixelIncompatibleMessageError,
  PixelWaitForMessageDisconnectError as WaitMsgDiscoErr,
  PixelWaitForMessageTimeoutError as WaitMsgTimeoutErr,
} from "./errors";
import { isPixelChargingOrDone } from "./isPixelChargingOrDone";

// Returns a string with the current time with a millisecond precision
function _getTime(): string {
  const to2 = (n: number) => n.toString().padStart(2, "0");
  const to3 = (n: number) => n.toString().padStart(3, "0");
  const d = new Date();
  return (
    to2(d.getHours()) +
    ":" +
    to2(d.getMinutes()) +
    ":" +
    to2(d.getSeconds()) +
    "." +
    to3(d.getMilliseconds())
  );
}

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

/**
 * Data structure for {@link Charger} battery events,
 * see {@link ChargerEventMap}.
 * @category Pixels
 */
export type BatteryEvent = Readonly<{
  level: number; // Percentage
  isCharging: boolean;
}>;

/**
 * Event map for {@link Charger} class.
 * This is the list of supported events where the property name
 * is the event name and the property type the event data type.
 * Call {@link Charger.addEventListener} to subscribe to an event.
 * @category Pixels
 */
export interface ChargerEventMap {
  /** Message received notification. */
  message: MessageOrType;
  /** Message send notification. */
  messageSend: MessageOrType;
  /** Battery state changed notification. */
  battery: BatteryEvent;
}

/**
 * The mutable properties of {@link Charger} not inherited from parent
 * class {@link ChargerInfoNotifier}.
 * @category Pixels
 */
export interface ChargerOwnMutableProps {
  /** Connection status. */
  status: PixelStatus;
}

/**
 * The mutable properties of {@link Charger}.
 * @category Pixels
 */
export type ChargerMutableProps = PixelInfoNotifierMutableProps &
  ChargerOwnMutableProps;

/**
 * Represents a Pixels charger.
 * Most of its methods require the instance to be connected to the charger.
 * Call the {@link connect()} method to initiate a connection.
 *
 * Call {@link addEventListener} to get notified for rolls, connection and
 * disconnection events and more.
 *
 * Call {@link addPropertyListener} to get notified on property changes.
 *
 * @category Pixels
 */
export class Charger
  extends PixelInfoNotifier<
    ChargerMutableProps,
    PixelInfo & ChargerOwnMutableProps
  >
  implements ChargerOwnMutableProps
{
  // Our events emitter
  private readonly _evEmitter = createTypedEventEmitter<ChargerEventMap>();
  private readonly _msgEvEmitter = new EventEmitter();

  // Log function
  private _logFunc: ((msg: string) => void) | undefined | null;
  private _logMessages = false;
  private _logData = false;

  // Connection data
  private readonly _session: PixelSession;
  private _status: PixelStatus;

  // Charger data
  private readonly _info: Mutable<PixelInfo>;
  private readonly _versions: Omit<
    VersionInfoChunk,
    "chunkSize" | "buildTimestamp"
  >;

  // Clean-up
  private _disposeFunc: () => void;

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

  /** Gets the Charger last known connection status. */
  get status(): PixelStatus {
    return this._status;
  }

  /** Shorthand property that indicates if the Charger status is "ready". */
  get isReady(): boolean {
    return this._status === "ready";
  }

  /** Gets the unique id assigned by the system to the Charger Bluetooth peripheral. */
  get systemId(): string {
    return this._info.systemId;
  }

  /** Gets the unique Pixel id of the charger, may be 0 until connected. */
  get pixelId(): number {
    return this._info.pixelId;
  }

  /** Gets the Charger name, may be empty until connected to device. */
  get name(): string {
    // The name from the session may be outdated
    return this._info.name.length
      ? this._info.name
      : this._session.pixelName ?? "";
  }

  /** Gets the number of LEDs for the Charger, may be 0 until connected to device. */
  get ledCount(): number {
    return this._info.ledCount;
  }

  get colorway(): PixelColorway {
    return "unknown";
  }

  get dieType(): PixelDieType {
    return "unknown";
  }

  /** Gets the Charger firmware build date. */
  get firmwareDate(): Date {
    return this._info.firmwareDate;
  }

  /**
   * Gets the last RSSI value notified by the Charger.
   * @remarks Call {@link reportRssi()} to automatically update the RSSI value.
   */
  get rssi(): number {
    return this._info.rssi;
  }

  /**
   * Gets the Charger battery level (percentage).
   * @remarks This value is automatically updated when the die is connected.
   */
  get batteryLevel(): number {
    return this._info.batteryLevel;
  }

  /**
   * Gets whether the Charger battery is charging or not.
   * Returns 'true' if fully charged but still on charger.
   * @remarks This value is automatically updated when the die is connected.
   */
  get isCharging(): boolean {
    return this._info.isCharging;
  }

  get rollState(): PixelRollState {
    return "unknown";
  }

  get currentFace(): number {
    return 0;
  }

  get currentFaceIndex(): number {
    return 0;
  }

  /**
   * Instantiates a Charger.
   * @param session The session used to communicate with the Charger.
   */
  constructor(
    session: PixelSession,
    // Static values
    info?: Partial<
      Pick<
        PixelInfo,
        "pixelId" | "ledCount" | "dieType" | "colorway" | "firmwareDate"
      >
    >
  ) {
    super();
    this._session = session;
    this._status = "disconnected"; // TODO use the getLastConnectionStatus()
    this._info = {
      systemId: session.systemId,
      pixelId: info?.pixelId ?? 0,
      name: "",
      ledCount: info?.ledCount ?? 0,
      colorway: info?.colorway ?? "unknown",
      dieType: info?.dieType ?? "unknown",
      firmwareDate: info?.firmwareDate ?? new Date(0),
      rssi: 0,
      batteryLevel: 0,
      isCharging: false,
      rollState: "unknown",
      currentFace: 0,
      currentFaceIndex: 0,
    };
    if (this._info.ledCount && this._info.dieType === "unknown") {
      // Try to guess the die type if we got "unknown" from the info
      this._info.dieType = DiceUtils.estimateDieType(this._info.ledCount);
    }
    this._versions = {
      firmwareVersion: 0,
      settingsVersion: 0,
      compatStandardApiVersion: 0,
      compatExtendedApiVersion: 0,
      compatManagementApiVersion: 0,
    };

    // Listen to session connection status changes
    session.setConnectionEventListener(({ connectionStatus }) => {
      if (connectionStatus === "connected" || connectionStatus === "ready") {
        // It's possible that we skip some steps and get a "ready" without
        // getting first a "connecting" if the device was already connected
        this._updateStatus("connecting");
      } else {
        this._updateStatus(
          connectionStatus === "failedToConnect"
            ? "disconnected"
            : connectionStatus
        );
      }
    });

    // Subscribe to rssi messages and emit event
    const rssiListener = (msgOrType: MessageOrType) => {
      this._updateRssi((msgOrType as Rssi).value);
    };
    this.addMessageListener("rssi", rssiListener);

    // Subscribe to battery messages and emit battery event
    const batteryLevelListener = (msgOrType: MessageOrType) => {
      const msg = msgOrType as BatteryLevel;
      this._updateBattery(msg.levelPercent, isPixelChargingOrDone(msg.state));
    };
    this.addMessageListener("batteryLevel", batteryLevelListener);

    // Reset profile hash & die name on "clear settings" and "program default" ack
    const resetListener = () => {
      // Reset name
      this._updateName("PxlLcc" + unsigned32ToHex(this._info.pixelId));
    };
    this.addMessageListener("clearSettingsAck", resetListener);
    this.addMessageListener("programDefaultParametersFinished", resetListener);

    // Unmount function
    this._disposeFunc = () => {
      session.setConnectionEventListener(undefined);
      this.removeMessageListener("rssi", rssiListener);
      this.removeMessageListener("batteryLevel", batteryLevelListener);
      this.removeMessageListener("clearSettingsAck", resetListener);
      this.removeMessageListener(
        "programDefaultParametersFinished",
        resetListener
      );
    };
  }

  /**
   * /!\ Internal, don't call this function ;)
   */
  private _dispose() {
    // TODO unused at the moment!
    // Unhook from events
    this._disposeFunc();
  }

  /**
   * Update Charger info from an external source such as scanning data.
   * @param info The updated info.
   * @remarks
   * The info will be updated only if the die is disconnected.
   * Roll state and face index are updated only if both are provided.
   */
  updateInfo(
    info: Partial<
      Omit<
        PixelInfo,
        | "systemId"
        | "colorway"
        | "dieType"
        | "rollState"
        | "currentFaceIndex"
        | "currentFace"
      >
    >
  ): void {
    if (this.status === "disconnected" && this.pixelId === info.pixelId) {
      // Name
      if (info.name) {
        this._updateName(info.name);
      }
      // LED count
      if (info.ledCount && info.ledCount > 0 && !this.ledCount) {
        this._updateLedCount(info.ledCount);
      }
      // Firmware data
      if (info.firmwareDate && info.firmwareDate.getTime() > 0) {
        this._updateFirmwareDate(info.firmwareDate.getTime());
      }
      // RSSI
      if (info.rssi !== undefined && info.rssi < 0) {
        this._updateRssi(info.rssi);
      }
      // Battery
      if (
        info.batteryLevel === undefined ||
        (info.batteryLevel >= 0 && info.batteryLevel <= 100)
      ) {
        this._updateBattery(info.batteryLevel, info.isCharging);
      }
    }
  }

  /**
   * Asynchronously tries to connect to the die. Throws on connection error.
   * @param timeoutMs Delay before giving up (may be ignored when having concurrent
   *                  calls to connect()). It may take longer than the given timeout
   *                  for the function to return.
   * @returns A promise that resoles to this instance once the connection process
   *          has completed (whether successfully or not).
   * @throws Will throw a {@link PixelConnectError} if it fails to connect in time.
   */
  async connect(timeoutMs = 0): Promise<Charger> {
    // Timeout
    let hasTimedOut = false;
    const timeoutId =
      timeoutMs > 0 &&
      setTimeout(() => {
        // Disconnect on timeout
        hasTimedOut = true;
        this._session.disconnect().catch(() => {});
      }, timeoutMs);

    try {
      // Connect to the peripheral
      await this._session.connect();

      // And prepare our instance for communications with the device
      if (this.status === "connecting") {
        // Notify we're connected and proceeding with die identification
        this._updateStatus("identifying");

        try {
          // Setup our instance
          await this._internalSetup();

          // We're ready!
          //@ts-expect-error the status could have changed during the above async call
          if (this.status === "identifying") {
            this._updateStatus("ready");

            // Notify battery state
            this._evEmitter.emit("battery", {
              level: this._info.batteryLevel,
              isCharging: this._info.isCharging,
            });

            // We don't raise roll and roll state events as those should occur
            // only when the die is actually moved
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
          const onStatusChange = ({ status }: ChargerOwnMutableProps) => {
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
      // Check if the error was caused by the connection timeout
      if (hasTimedOut) {
        throw new PixelConnectTimeoutError(this, timeoutMs);
      } else if (error instanceof PixelConnectError) {
        // Forward other connection errors
        throw error;
      } else {
        // Wrap any other type of error in a connection error
        throw new PixelConnectError(this, error);
      }
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }

    return this;
  }

  /**
   * Immediately disconnects from the die.
   * @returns A promise that resolves once the disconnect request has been processed.
   **/
  async disconnect(): Promise<Charger> {
    await this._session.disconnect();
    return this;
  }

  /**
   * Registers a listener function that will be called when the specified
   * event is raised.
   * See {@link ChargerEventMap} for the list of events and their
   * associated data.
   * @param type A case-sensitive string representing the event type to listen for.
   * @param listener The callback function.
   */
  addEventListener<K extends keyof ChargerEventMap>(
    type: K,
    listener: EventReceiver<ChargerEventMap[K]>
  ): void {
    this._evEmitter.addListener(type, listener);
  }

  /**
   * Unregisters a listener from receiving events identified by
   * the given event name.
   * See {@link ChargerEventMap} for the list of events and their
   * associated data.
   * @param type A case-sensitive string representing the event type.
   * @param listener The callback function to unregister.
   */
  removeEventListener<K extends keyof ChargerEventMap>(
    type: K,
    listener: EventReceiver<ChargerEventMap[K]>
  ): void {
    this._evEmitter.removeListener(type, listener);
  }

  /**
   * Registers a listener function that will be called on receiving
   * raw messages of a given type from the Charger.
   * @param msgType The type of message to watch for.
   * @param listener The callback function.
   */
  addMessageListener(
    msgType: MessageType,
    listener: (this: Charger, message: MessageOrType) => void
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
    listener: (this: Charger, msg: MessageOrType) => void
  ): void {
    this._msgEvEmitter.removeListener(`${msgType}Message`, listener);
  }

  /**
   * Waits for a message from the Charger.
   * @param expectedMsgType Type of the message to expect.
   * @param timeoutMs Timeout before aborting the wait.
   * @returns A promise with the received message of the expected type.
   */
  private waitForMessage(
    expectedMsgType: MessageType,
    timeoutMs: number = Constants.ackMessageTimeout
  ): Promise<MessageOrType> {
    return new Promise((resolve, reject) => {
      let cleanup: () => void;
      // 1. Hook message listener
      const messageListener = (msg: MessageOrType) => {
        cleanup();
        resolve(msg);
      };
      this.addMessageListener(expectedMsgType, messageListener);
      // 2. Hook connection status listener
      // Note: We don't check for the initial status so this method
      // may be called before completing the connection sequence.
      const statusListener = ({ status }: ChargerOwnMutableProps) => {
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
   * Sends a message to the Charger.
   * @param msgOrType Message with the data to send or just a message type.
   * @param withoutAck Whether to request a confirmation that the message was received.
   * @returns A promise that resolves once the message has been send.
   */
  async sendMessage(
    msgOrType: MessageOrType,
    withoutAck = false
  ): Promise<void> {
    if (this._logMessages) {
      const msgName = getMessageType(msgOrType);
      this._log(`Sending message ${msgName} (${MessageTypeValues[msgName]})`);
    }
    // Check API version
    const fwVer = this._versions.firmwareVersion;
    if (fwVer > 0 && Constants.compatApiVersion > fwVer) {
      throw new PixelIncompatibleMessageError(
        this,
        getMessageType(msgOrType),
        Constants.compatApiVersion,
        fwVer,
        "library"
      );
    }
    const fwCompatVer = this._versions.compatStandardApiVersion;
    if (fwCompatVer > 0 && Constants.apiVersion < fwCompatVer) {
      throw new PixelIncompatibleMessageError(
        this,
        getMessageType(msgOrType),
        Constants.apiVersion,
        fwCompatVer,
        "firmware"
      );
    }
    // Serialize message
    const data = serializeMessage(msgOrType);
    if (this._logData) {
      this._logArray(data);
    }
    // And send it
    await this._session.writeValue(data, withoutAck);
    this._evEmitter.emit("messageSend", msgOrType);
  }

  /**
   * Sends a message to the Charger and wait for a specific response.
   * @param msgOrTypeToSend Message with the data to send or just a message type.
   * @param responseType Expected response type.
   * @param timeoutMs Timeout in mill-seconds before aborting waiting for the response.
   * @returns A promise resolving to the response in the form of a message type or a message object.
   */
  async sendAndWaitForResponse(
    msgOrTypeToSend: MessageOrType,
    responseType: MessageType,
    timeoutMs: number = Constants.ackMessageTimeout
  ): Promise<MessageOrType> {
    // Gets the session object, throws an error if invalid
    const result = await Promise.all([
      this.waitForMessage(responseType, timeoutMs),
      this.sendMessage(msgOrTypeToSend),
    ]);
    return result[0];
  }

  /**
   * Sends a message to the Charger and wait for a specific response
   * which is returned casted to the expected type.
   * @param msgOrTypeToSend Message with the data to send or just a message type.
   * @param responseType Expected response class type.
   * @param responseType Expected response type.
   * @returns A promise resolving to a message object of the expected type.
   */
  async sendAndWaitForTypedResponse<T extends PixelMessage>(
    msgOrTypeToSend: MessageOrType,
    responseType: { new (): T },
    timeoutMs: number = Constants.ackMessageTimeout
  ): Promise<T> {
    // Gets the session object, throws an error if invalid
    return (await this.sendAndWaitForResponse(
      msgOrTypeToSend,
      getMessageType(new responseType().type),
      timeoutMs
    )) as T;
  }

  /**
   * Requests the Charger to change its name.
   * @param name New name to assign to the Charger. Must have at least one character.
   * @returns A promise that resolves once the die has confirmed being renamed.
   */
  async rename(name: string): Promise<void> {
    // Skip sending message if name is empty
    if (!name.length) {
      throw new PixelEmptyNameError(this);
    }
    // Note: we reprogram the name even if its the same as the one kept
    // in cache in case it is out of date
    await this.sendAndWaitForResponse(
      safeAssign(new SetName(), { name }),
      "setNameAck"
    );
    // And notify name was successfully updated
    this._updateName(name);
  }

  /**
   * Requests the Charger to start faces calibration sequence.
   * @returns A promise that resolves once the message has been send.
   */
  async startCalibration(): Promise<void> {
    await this.sendMessage("calibrate");
  }

  /**
   * Requests the Charger to regularly send its measured RSSI value.
   * @param activate Whether to turn or turn off this feature.
   * @param minInterval The minimum time interval in milliseconds
   *                    between two RSSI updates.
   * @returns A promise that resolves once the message has been send.
   */
  async reportRssi(activate: boolean, minInterval = 5000): Promise<void> {
    await this.sendMessage(
      safeAssign(new RequestRssi(), {
        requestMode: activate
          ? TelemetryRequestModeValues.automatic
          : TelemetryRequestModeValues.off,
        minInterval,
      })
    );
  }

  /**
   * Asynchronously gets the battery state.
   * @returns A promise revolving to an object with the batter level in
   *          percentage and flag indicating whether it is charging or not.
   */
  async queryRssi(): Promise<number> {
    const rssi = (await this.sendAndWaitForResponse(
      safeAssign(new RequestRssi(), {
        requestMode: TelemetryRequestModeValues.once,
      }),
      "rssi"
    )) as Rssi;
    return rssi.value;
  }

  /**
   * Requests the Charger to completely turn off.
   * @returns A promise that resolves once the message has been send.
   */
  async turnOff(): Promise<void> {
    await this.sendMessage(
      safeAssign(new PowerOperation(), {
        operation: PixelPowerOperationValues.turnOff,
      }),
      true // withoutAck
    );
  }

  /**
   * Requests the Charger to blink and wait for a confirmation.
   * @param color Blink color.
   * @param opt.count Number of blinks.
   * @param opt.duration Total duration of the animation in milliseconds.
   * @param opt.fade Amount of in and out fading, 0: sharp transition, 1: maximum fading.
   * @param opt.faceMask Select which faces to light up.
   * @param opt.loopCount How many times to loop the animation.
   * @returns A promise that resolves once the die has confirmed receiving the message.
   */
  async blink(
    color: Color,
    opt?: {
      count?: number;
      duration?: number;
      fade?: number;
      faceMask?: number;
      loopCount?: number;
    }
  ): Promise<void> {
    const blinkMsg = safeAssign(new Blink(), {
      color: Color32Utils.toColor32(color),
      count: opt?.count ?? 1,
      duration: opt?.duration ?? 1000,
      fade: 255 * (opt?.fade ?? 0),
      faceMask: opt?.faceMask ?? AnimConstants.faceMaskAll,
      loopCount: opt?.loopCount ?? 1,
    });
    await this.sendAndWaitForResponse(blinkMsg, "blinkAck");
  }

  /**
   * Plays the instant animation at the given index.
   * See @see transferInstantAnimations().
   * @param animIndex The index of the instant animation to play.
   * @returns A promise that resolves once the message has been send.
   */
  async playInstantAnimation(animIndex: number): Promise<void> {
    await this.sendMessage(
      safeAssign(new PlayInstantAnimation(), { animation: animIndex })
    );
  }

  private _tagLogString(str: string): string {
    return `[${_getTime()} - ${this.name}] ${str}`;
  }

  // Log the given message prepended with a timestamp and the Charger name
  private _log(msg: unknown): void {
    this._logFunc?.(
      this._tagLogString(
        (msg as PixelMessage)?.type ? JSON.stringify(msg) : String(msg)
      )
    );
  }

  private _warn(msg: unknown): void {
    this._logFunc?.(
      this._tagLogString(
        "WARN: " +
          ((msg as PixelMessage)?.type ? JSON.stringify(msg) : String(msg))
      )
    );
  }

  private _logArray(arr: ArrayBuffer) {
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

  private async _internalSetup(): Promise<void> {
    // Reset version numbers
    let verProp: keyof typeof this._versions;
    for (verProp in this._versions) {
      this._versions[verProp] = 0;
    }

    // Subscribe to get messages from die
    await this._session.subscribe((dv: DataView) => this._onValueChanged(dv));

    // Identify Charger
    this._log("Waiting on identification message");
    const iAmADie = (await this.sendAndWaitForResponse(
      "whoAreYou",
      "iAmADie"
    )) as IAmADie | LegacyIAmALCC;
    console.log(JSON.stringify(iAmADie));

    // Check Pixel id
    const pixelId =
      (iAmADie as LegacyIAmADie).pixelId ??
      (iAmADie as IAmADie).dieInfo?.pixelId;
    if (!pixelId) {
      const ledCount = (iAmADie as LegacyIAmALCC).ledCount;
      console.log("ledCount=" + ledCount);
      // This should never happen
      throw new PixelConnectError(this, "Got an empty Pixel id");
    }
    if (!this._info.pixelId) {
      this._info.pixelId = pixelId;
      this.emitPropertyEvent("pixelId");
    } else if (this._info.pixelId !== pixelId) {
      throw new PixelConnectIdMismatchError(this, pixelId);
    }

    const setProperties = (
      info: Omit<LegacyIAmALCC, "type" | "dataSetHash" | "availableFlashSize">
    ): void => {
      this._updateLedCount(info.ledCount);
      this._updateFirmwareDate(1000 * info.buildTimestamp);
      this._updateBattery(
        info.batteryLevelPercent,
        isPixelChargingOrDone(info.batteryState)
      );
    };

    if (iAmADie instanceof LegacyIAmALCC) {
      // Update properties
      setProperties(iAmADie);

      // Set versions
      const legacyVersion = 0x100;
      this._versions.firmwareVersion = legacyVersion;
      this._versions.settingsVersion = legacyVersion;
      this._versions.compatStandardApiVersion = legacyVersion;
      this._versions.compatExtendedApiVersion = legacyVersion;
      this._versions.compatManagementApiVersion = legacyVersion;
    } else {
      // Update properties
      setProperties({
        ...iAmADie.dieInfo,
        ...iAmADie.versionInfo,
        ...iAmADie.statusInfo,
      });

      // Store versions
      for (verProp in this._versions) {
        this._versions[verProp] = iAmADie.versionInfo[verProp];
      }

      // Update name
      this._updateName(iAmADie.dieName.name);
    }
  }

  private _updateStatus(status: PixelStatus): void {
    if (status !== this._status) {
      this._status = status;
      this._log(`Status changed to ${status}`);
      this.emitPropertyEvent("status");
    }
  }

  private _updateName(name: string) {
    if (name.length && name !== this._info.name) {
      this._info.name = name;
      this.emitPropertyEvent("name");
    }
  }

  private _updateLedCount(ledCount: number) {
    if (this._info.ledCount !== ledCount) {
      this._info.ledCount = ledCount;
      this.emitPropertyEvent("ledCount");
    }
  }

  private _updateFirmwareDate(firmwareTime: number) {
    if (firmwareTime && firmwareTime !== this._info.firmwareDate.getTime()) {
      this._info.firmwareDate = new Date(firmwareTime);
      this.emitPropertyEvent("firmwareDate");
    }
  }

  private _updateRssi(rssi: number) {
    if (rssi && rssi !== this._info.rssi) {
      this._info.rssi = rssi;
      this.emitPropertyEvent("rssi");
    }
  }

  private _updateBattery(level?: number, isCharging?: boolean) {
    const levelChanged =
      level !== undefined && this._info.batteryLevel !== level;
    const chargingChanged =
      isCharging !== undefined && this._info.isCharging !== isCharging;
    if (levelChanged) {
      this._info.batteryLevel = level;
      this.emitPropertyEvent("batteryLevel");
    }
    if (chargingChanged) {
      this._info.isCharging = isCharging;
      this.emitPropertyEvent("isCharging");
    }
    if (levelChanged || chargingChanged) {
      this._evEmitter.emit("battery", {
        level: level ?? this.batteryLevel,
        isCharging: isCharging ?? this.isCharging,
      });
    }
  }

  // Callback on notify characteristic value change
  private _onValueChanged(dataView: DataView) {
    try {
      if (this._logData) {
        this._logArray(dataView.buffer);
      }
      const msgOrType =
        dataView.byteLength &&
        dataView.getUint8(0) === MessageTypeValues.iAmALCC &&
        dataView.byteLength === LegacyIAmALCC.expectedSize
          ? deserializeMessage(dataView)
          : this._deserializeImADie(dataView);
      if (msgOrType) {
        const msgName = getMessageType(msgOrType);
        if (this._logMessages) {
          this._log(
            `Received message ${msgName} (${MessageTypeValues[msgName]})`
          );
          if (typeof msgOrType === "object") {
            // Log message contents
            this._log(msgOrType);
          }
        }
        // Dispatch generic message event
        this._evEmitter.emit("message", msgOrType);
        // Dispatch specific message event
        this._msgEvEmitter.emit(`${msgName}Message`, msgOrType);
      } else {
        this._log("Received invalid message");
      }
    } catch (error) {
      this._log(`Message deserialization error: ${error}`);
      // TODO the error should be propagated to listeners of that message
    }
  }

  private _deserializeImADie(dataView: DataView): IAmADie {
    assert(dataView.getUint8(0) === MessageTypeValues.iAmALCC);
    const msg = new IAmADie();
    let offset = 1;
    for (const [key, value] of Object.entries(msg)) {
      if (key !== ("type" as keyof IAmADie)) {
        assert(typeof value === "object" && "chunkSize" in value);
        const dataSize = dataView.getUint8(offset);
        if (value.chunkSize > 0 && dataSize !== value.chunkSize) {
          this._warn(
            `Received IAmADie '${key}' chunk of size ${dataSize} but expected ${value.chunkSize} bytes`
          );
        }
        deserialize(
          value,
          new DataView(
            dataView.buffer,
            dataView.byteOffset + offset,
            value.chunkSize === 0
              ? dataSize
              : Math.min(dataSize, value.chunkSize)
          ),
          { allowSkipLastProps: true }
        );
        offset += dataSize;
      }
    }
    return msg;
  }
}
