import {
  Color,
  Color32Utils,
  DataSet,
  Constants as AnimConstants,
} from "@systemic-games/pixels-core-animation";
import {
  assert,
  byteSizeOf,
  createTypedEventEmitter,
  deserialize,
  EventReceiver,
  getValueKeyName,
  Mutable,
  safeAssign,
} from "@systemic-games/pixels-core-utils";
import { EventEmitter } from "events";

import { Constants } from "./Constants";
import { DiceUtils } from "./DiceUtils";
import {
  MessageType,
  MessageOrType,
  getMessageType,
  deserializeMessage,
  IAmADie,
  RollState,
  BatteryLevel,
  Rssi,
  Blink,
  PixelMessage,
  TransferAnimationSet,
  TransferAnimationSetAck,
  TransferTestAnimationSet,
  TransferTestAnimationSetAck,
  TransferInstantAnimationsSetAckTypeValues,
  TransferInstantAnimationSet,
  TransferInstantAnimationSetAck,
  BulkSetup,
  BulkData,
  PlayInstantAnimation,
  NotifyUser,
  NotifyUserAck,
  serializeMessage,
  SetName,
  PixelRollStateValues,
  PixelRollState,
  PixelColorway,
  RequestRssi,
  TelemetryRequestModeValues,
  RemoteAction,
  PixelColorwayValues,
  MessageTypeValues,
  PowerOperation,
  PixelPowerOperationValues,
  PixelDieType,
  PixelDieTypeValues,
  LegacyIAmADie,
} from "./Messages";
import { PixelInfo } from "./PixelInfo";
import { PixelInfoNotifier } from "./PixelInfoNotifier";
import { PixelSession } from "./PixelSession";
import {
  PixelConnectCancelledError,
  PixelConnectError,
  PixelConnectIdMismatchError,
  PixelConnectTimeoutError,
  PixelError,
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
 * Data structure for {@link Pixel} roll state events,
 * see {@link PixelEventMap}.
 * @category Pixels
 */
export interface RollEvent {
  state: PixelRollState;
  face: number;
}

/**
 * Data structure for {@link Pixel} battery events,
 * see {@link PixelEventMap}.
 * @category Pixels
 */
export interface BatteryEvent {
  level: number; // Percentage
  isCharging: boolean;
}

/**
 * Data structure for {@link Pixel} user message events,
 * see {@link PixelEventMap}.
 * @category Pixels
 */
export interface UserMessageEvent {
  message: string;
  withCancel: boolean;
  response: (okCancel: boolean) => Promise<void>;
}

/**
 * Event map for {@link Pixel} class.
 * This is the list of supported events where the property name
 * is the event name and the property type the event data type.
 * Call {@link Pixel.addEventListener} to subscribe to an event.
 * @category Pixels
 */
export interface PixelEventMap {
  /** Connection status update. */
  status: PixelStatus;
  /** Message received notification. */
  message: MessageOrType;
  /** Message send notification. */
  messageSend: MessageOrType;
  /** Roll state changed notification. */
  rollState: RollEvent;
  /** Roll result notification. */
  roll: number;
  /** Battery state changed notification. */
  battery: BatteryEvent;
  /** RSSI change notification. */
  rssi: number;
  /** User message request. */
  userMessage: UserMessageEvent;
  /** Remote action request. */
  remoteAction: number; // Remote action id
}

/**
 * Represents a Pixels die.
 * Most of its methods require the instance to be connected to the Pixel device.
 * Call the {@link connect()} method to initiate a connection.
 *
 * Call {@link addEventListener} to get notified for rolls, connection and
 * disconnection events and more.
 *
 * Call {@link addPropertyListener} to get notified on property changes.
 *
 * @category Pixels
 */
export class Pixel extends PixelInfoNotifier {
  // Our events emitter
  private readonly _evEmitter = createTypedEventEmitter<PixelEventMap>();
  private readonly _msgEvEmitter = new EventEmitter();

  // Log function
  private _logFunc: (msg: string) => void = console.log;
  private _logMessages = false;
  private _logData = false;

  // Connection data
  private readonly _session: PixelSession;
  private _status: PixelStatus;

  // Pixel data
  private readonly _info: Mutable<PixelInfo>;

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
  get logger(): (msg: string) => void {
    return this._logFunc;
  }
  set logger(logger: (msg: string) => void) {
    this._logFunc = logger;
  }

  /** Get the Pixel last known connection status. */
  get status(): PixelStatus {
    return this._status;
  }

  /** Shorthand property that indicates if the Pixel status is "ready". */
  get isReady(): boolean {
    return this.status === "ready";
  }

  /** Gets the unique id assigned by the system to the Pixel Bluetooth peripheral. */
  get systemId(): string {
    return this._info.systemId;
  }

  /** Gets the unique Pixel id of the device, may be 0 until connected. */
  get pixelId(): number {
    return this._info.pixelId;
  }

  /** Get the Pixel name, may be empty until connected to device. */
  get name(): string {
    // The name from the session may be outdated
    return this._info.name.length
      ? this._info.name
      : this._session.pixelName ?? "";
  }

  /** Gets the number of LEDs for the Pixel, may be 0 until connected to device. */
  get ledCount(): number {
    return this._info.ledCount;
  }

  /** Gets the design and color of the Pixel. */
  get colorway(): PixelColorway {
    return this._info.colorway;
  }

  /** Gets the die type of the Pixel. */
  get dieType(): PixelDieType {
    return this._info.dieType;
  }

  /** Gets the number of faces of the Pixel. */
  get dieFaceCount(): number {
    return DiceUtils.getFaceCount(this.dieType);
  }

  /** Get the Pixel firmware build date. */
  get firmwareDate(): Date {
    return this._info.firmwareDate;
  }

  /**
   * Gets the last RSSI value notified by the Pixel.
   * @remarks Call {@link reportRssi()} to automatically update the RSSI value.
   */
  get rssi(): number {
    return this._info.rssi;
  }

  /**
   * Get the Pixel battery level (percentage).
   * @remarks The battery level is automatically updated when connected.
   */
  get batteryLevel(): number {
    return this._info.batteryLevel;
  }

  /**
   * Gets whether the Pixel battery is charging or not.
   * Returns 'true' if fully charged but still on charger.
   * @remarks The charging state is automatically updated when connected.
   */
  get isCharging(): boolean {
    return this._info.isCharging;
  }

  /**
   * Get the Pixel roll state.
   * @remarks The roll state is automatically updated when connected.
   */
  get rollState(): PixelRollState {
    return this._info.rollState;
  }

  /**
   * Get the Pixel face value that is currently facing up.
   * @remarks The current face is automatically updated when connected.
   */
  get currentFace(): number {
    return this._info.currentFace;
  }

  /**
   * Instantiates a Pixel.
   * @param session The session used to communicate with the Pixel.
   */
  constructor(session: PixelSession) {
    super();
    this._session = session;
    this._status = "disconnected"; // TODO use the getLastConnectionStatus()
    this._info = {
      systemId: session.pixelSystemId,
      pixelId: 0,
      name: "",
      ledCount: 0,
      colorway: "unknown",
      dieType: "unknown",
      firmwareDate: new Date(),
      rssi: 0,
      batteryLevel: 0,
      isCharging: false,
      rollState: "unknown",
      currentFace: 0,
    };

    // Listen to session connection status changes
    session.setConnectionEventListener(({ connectionStatus }) => {
      if (connectionStatus !== "connected" && connectionStatus !== "ready") {
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
      this._updateBatteryInfo({
        level: msg.levelPercent,
        isCharging: isPixelChargingOrDone(msg.state),
      });
    };
    this.addMessageListener("batteryLevel", batteryLevelListener);

    // Subscribe to roll messages and emit roll event
    const rollStateListener = (msgOrType: MessageOrType) => {
      const msg = msgOrType as RollState;
      this._updateRollInfo({
        state: getValueKeyName(msg.state, PixelRollStateValues) ?? "unknown",
        face: msg.faceIndex + (this.ledCount === 10 ? 0 : 1),
      });
    };
    this.addMessageListener("rollState", rollStateListener);

    // Subscribe to user message requests
    const notifyUserListener = (msgOrType: MessageOrType) => {
      const msg = msgOrType as NotifyUser;
      this._evEmitter.emit("userMessage", {
        message: msg.message,
        withCancel: msg.cancel,
        response: (okCancel: boolean) => {
          return this.sendMessage(
            safeAssign(new NotifyUserAck(), {
              okCancel,
            })
          );
        },
      });
    };
    this.addMessageListener("notifyUser", notifyUserListener);

    // Subscribe to remote action requests
    const remoteActionListener = (msgOrType: MessageOrType) => {
      const msg = msgOrType as RemoteAction;
      this._evEmitter.emit("remoteAction", msg.actionId);
    };
    this.addMessageListener("remoteAction", remoteActionListener);

    // Unmount function
    this._disposeFunc = () => {
      session.setConnectionEventListener(undefined);
      this.removeMessageListener("rssi", rssiListener);
      this.removeMessageListener("batteryLevel", batteryLevelListener);
      this.removeMessageListener("rollState", rollStateListener);
      this.removeMessageListener("notifyUser", notifyUserListener);
      this.removeMessageListener("remoteAction", remoteActionListener);
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
   * Update Pixel info from an external source such as scanning data.
   * @param info The updated info.
   * @remarks The info will be updated only when disconnected.
   */
  updateInfo(info: Partial<PixelInfo>): void {
    if (this.status === "disconnected" && this.pixelId === info.pixelId) {
      // Name
      if (info.name) {
        this._updateName(info.name);
      }
      // Colorway
      if (info.colorway) {
        this._updateColorway(info.colorway);
      }
      // Firmware data
      if (info.firmwareDate) {
        this._updateFirmwareDate(info.firmwareDate);
      }
      // RSSI
      if (info.rssi !== undefined) {
        this._updateRssi(info.rssi);
      }
      // Battery
      this._updateBatteryInfo({
        level: info.batteryLevel,
        isCharging: info.isCharging,
      });
      // Roll
      this._updateRollInfo({
        state: info.rollState,
        face: info.currentFace,
      });
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
  async connect(timeoutMs = 0): Promise<Pixel> {
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

      // And prepare our instance for communications with the Pixels dies die
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
          const onStatusChange = (status: PixelStatus) => {
            if (status !== "identifying") {
              this.removeEventListener("status", onStatusChange);
              resolve();
            }
          };
          this.addEventListener("status", onStatusChange);
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
  async disconnect(): Promise<Pixel> {
    await this._session.disconnect();
    return this;
  }

  /**
   * Adds the given listener function to the end of the listeners array
   * for the event with the given name.
   * See {@link PixelEventMap} for the list of events and their
   * associated data.
   * @param eventName The name of the event.
   * @param listener The callback function.
   */
  addEventListener<K extends keyof PixelEventMap>(
    eventName: K,
    listener: EventReceiver<PixelEventMap[K]>
  ): void {
    this._evEmitter.addListener(eventName, listener);
  }

  /**
   * Removes the specified listener function from the listener array
   * for the event with the given name.
   * See {@link PixelEventMap} for the list of events and their
   * associated data.
   * @param eventName The name of the event.
   * @param listener The callback function to unregister.
   */
  removeEventListener<K extends keyof PixelEventMap>(
    eventName: K,
    listener: EventReceiver<PixelEventMap[K]>
  ): void {
    this._evEmitter.removeListener(eventName, listener);
  }

  /**
   * Register a listener to be invoked on receiving raw messages of a given type.
   * @param msgType The type of message to watch for.
   * @param listener The callback function.
   */
  addMessageListener(
    msgType: MessageType,
    listener: (this: Pixel, message: MessageOrType) => void
  ): void {
    this._msgEvEmitter.addListener(`${msgType}Message`, listener);
  }

  /**
   * Unregister a listener invoked on receiving raw messages of a given type.
   * @param msgType The type of message to watch for.
   * @param listener The callback function to unregister.
   */
  removeMessageListener(
    msgType: MessageType,
    listener: (this: Pixel, msg: MessageOrType) => void
  ): void {
    this._msgEvEmitter.removeListener(`${msgType}Message`, listener);
  }

  /**
   * Waits for a message from the Pixel.
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
      const statusListener = (status: PixelStatus) => {
        if (status === "disconnecting" || status === "disconnected") {
          // We got disconnected, stop waiting for message
          cleanup();
          reject(new WaitMsgDiscoErr(this, expectedMsgType));
        }
      };
      this.addEventListener("status", statusListener);
      // 3. Setup timeout
      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new WaitMsgTimeoutErr(this, timeoutMs, expectedMsgType));
      }, timeoutMs);
      cleanup = () => {
        // Cancel timeout and unhook listeners
        clearTimeout(timeoutId);
        this.removeMessageListener(expectedMsgType, messageListener);
        this.removeEventListener("status", statusListener);
      };
    });
  }

  /**
   * Sends a message to the Pixel.
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
    const data = serializeMessage(msgOrType);
    if (this._logData) {
      this._logArray(data);
    }
    await this._session.writeValue(data, withoutAck);
    this._evEmitter.emit("messageSend", msgOrType);
  }

  /**
   * Sends a message to the Pixel and wait for a specific response.
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
    // Get the session object, throws an error if invalid
    const result = await Promise.all([
      this.waitForMessage(responseType, timeoutMs),
      this.sendMessage(msgOrTypeToSend),
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
  async sendAndWaitForTypedResponse<T extends PixelMessage>(
    msgOrTypeToSend: MessageOrType,
    responseType: { new (): T },
    timeoutMs: number = Constants.ackMessageTimeout
  ): Promise<T> {
    // Get the session object, throws an error if invalid
    return (await this.sendAndWaitForResponse(
      msgOrTypeToSend,
      getMessageType(new responseType().type),
      timeoutMs
    )) as T;
  }

  /**
   * Requests the Pixel to change its name.
   * @param name New name to assign to the Pixel.
   * @returns A promise that resolves once the die has confirmed being renamed.
   */
  async rename(name: string): Promise<void> {
    if (name.length && name !== this.name) {
      await this.sendAndWaitForResponse(
        safeAssign(new SetName(), { name }),
        "setNameAck"
      );
      this._updateName(name);
    }
  }

  /**
   * Requests the Pixel to start faces calibration sequence.
   * @returns A promise that resolves once the message has been send.
   */
  async startCalibration(): Promise<void> {
    await this.sendMessage("calibrate");
  }

  /**
   * Requests the Pixel to regularly send its measured RSSI value.
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
   * Requests the Pixel to completely turn off.
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
   * Requests the Pixel to blink and wait for a confirmation.
   * @param color Blink color.
   * @param opt.count Number of blinks.
   * @param opt.duration Total duration of the animation in milliseconds.
   * @param opt.fade Amount of in and out fading, 0: sharp transition, 1: maximum fading.
   * @param opt.faceMask Select which faces to light up.
   * @param opt.loop Whether to indefinitely loop the animation.
   * @returns A promise that resolves once the die has confirmed receiving the message.
   */
  async blink(
    color: Color,
    opt?: {
      count?: number;
      duration?: number;
      fade?: number;
      faceMask?: number;
      loop?: boolean;
    }
  ): Promise<void> {
    const blinkMsg = safeAssign(new Blink(), {
      color: Color32Utils.toColor32(color),
      count: opt?.count ?? 1,
      duration: opt?.duration ?? 1000,
      fade: 255 * (opt?.fade ?? 0),
      faceMask: opt?.faceMask ?? AnimConstants.faceMaskAll,
      loop: opt?.loop ?? false,
    });
    await this.sendAndWaitForResponse(blinkMsg, "blinkAck");
  }

  /**
   * Uploads the given data set of animations to the Pixel flash memory.
   * @param dataSet The data set to upload.
   * @param progressCallback An optional callback that is called as the operation progresses
   *                         with the progress in percent..
   * @returns A promise that resolves once the transfer has completed.
   */
  async transferDataSet(
    dataSet: DataSet,
    progressCallback?: (progress: number) => void
  ): Promise<void> {
    // Notify that we're starting
    progressCallback?.(0);

    const transferMsg = safeAssign(new TransferAnimationSet(), {
      paletteSize: dataSet.animationBits.getPaletteSize(),
      rgbKeyFrameCount: dataSet.animationBits.getRgbKeyframeCount(),
      rgbTrackCount: dataSet.animationBits.getRgbTrackCount(),
      keyFrameCount: dataSet.animationBits.getKeyframeCount(),
      trackCount: dataSet.animationBits.getTrackCount(),
      animationCount: dataSet.animations.length,
      animationSize: dataSet.animations.reduce(
        (acc, anim) => acc + byteSizeOf(anim),
        0
      ),
      conditionCount: dataSet.conditions.length,
      conditionSize: dataSet.conditions.reduce(
        (acc, cond) => acc + byteSizeOf(cond),
        0
      ),
      actionCount: dataSet.actions.length,
      actionSize: dataSet.actions.reduce(
        (acc, action) => acc + byteSizeOf(action),
        0
      ),
      ruleCount: dataSet.rules.length,
    });

    const transferAck = await this.sendAndWaitForTypedResponse(
      transferMsg,
      TransferAnimationSetAck
    );
    if (transferAck.result) {
      // Upload data
      const data = dataSet.toByteArray();
      assert(
        data.length === dataSet.computeDataSetByteSize(),
        "Incorrect computation of computeDataSetByteSize()"
      );
      const hash = DataSet.computeHash(data);
      const hashStr = (hash >>> 0).toString(16).toUpperCase();
      this._log(
        "Ready to receive dataset, " +
          `byte array should be ${data.length} bytes ` +
          `and hash 0x${hashStr}`
      );

      await this.uploadBulkDataWithAck(
        "transferAnimationSetFinished",
        data,
        progressCallback
      );
    } else {
      const dataSize = dataSet.computeDataSetByteSize();
      throw new PixelError(
        this,
        `Not enough memory to transfer ${dataSize} bytes`
      );
    }
  }

  /**
   * Plays the (single) LEDs animation included in the given data set.
   * @param dataSet The data set containing just one animation to play.
   * @param progressCallback An optional callback that is called as the operation progresses
   *                         with the progress in percent..
   * @returns A promise that resolves once the transfer has completed.
   */
  async playTestAnimation(
    dataSet: DataSet,
    progressCallback?: (progress: number) => void
  ): Promise<void> {
    assert(dataSet.animations.length >= 1, "No animation in DataSet");

    // Notify that we're starting
    progressCallback?.(0);

    // Prepare the Pixel
    const data = dataSet.toSingleAnimationByteArray();
    const hash = DataSet.computeHash(data);
    const prepareDie = safeAssign(new TransferTestAnimationSet(), {
      paletteSize: dataSet.animationBits.getPaletteSize(),
      rgbKeyFrameCount: dataSet.animationBits.getRgbKeyframeCount(),
      rgbTrackCount: dataSet.animationBits.getRgbTrackCount(),
      keyFrameCount: dataSet.animationBits.getKeyframeCount(),
      trackCount: dataSet.animationBits.getTrackCount(),
      animationSize: byteSizeOf(dataSet.animations[0]),
      hash,
    });

    const ack = await this.sendAndWaitForTypedResponse(
      prepareDie,
      TransferTestAnimationSetAck
    );

    switch (ack.ackType) {
      case TransferInstantAnimationsSetAckTypeValues.download:
        {
          // Upload data
          const hashStr = (hash >>> 0).toString(16).toUpperCase();
          this._log(
            "Ready to receive test dataset, " +
              `byte array should be: ${data.length} bytes ` +
              `and hash 0x${hashStr}`
          );
          await this.uploadBulkDataWithAck(
            "transferTestAnimationSetFinished",
            data,
            progressCallback
          );
        }
        break;

      case TransferInstantAnimationsSetAckTypeValues.upToDate:
        // Nothing to do
        this._log("Test animation is already up-to-date");
        break;

      default:
        throw new PixelError(this, `Got unknown ackType: ${ack.ackType}`);
    }
  }

  /**
   * Uploads the given data set of animations to the Pixel RAM memory.
   * Those animations are lost when the Pixel goes to sleep, is turned off or is restarted.
   * @param dataSet The data set to upload.
   * @param progressCallback An optional callback that is called as the operation progresses
   *                         with the progress in percent..
   * @returns A promise that resolves once the transfer has completed.
   */
  async transferInstantAnimations(
    dataSet: DataSet,
    progressCallback?: (progress: number) => void
  ): Promise<void> {
    assert(dataSet.animations.length >= 1, "No animation in DataSet");

    // Notify that we're starting
    progressCallback?.(0);

    // Prepare the Pixel
    const data = dataSet.toAnimationsByteArray();
    const hash = DataSet.computeHash(data);
    const prepareDie = safeAssign(new TransferInstantAnimationSet(), {
      paletteSize: dataSet.animationBits.getPaletteSize(),
      rgbKeyFrameCount: dataSet.animationBits.getRgbKeyframeCount(),
      rgbTrackCount: dataSet.animationBits.getRgbTrackCount(),
      keyFrameCount: dataSet.animationBits.getKeyframeCount(),
      trackCount: dataSet.animationBits.getTrackCount(),
      animationCount: dataSet.animations.length,
      animationSize: dataSet.animations.reduce(
        (acc, anim) => acc + byteSizeOf(anim),
        0
      ),
      hash,
    });

    const ack = await this.sendAndWaitForTypedResponse(
      prepareDie,
      TransferInstantAnimationSetAck
    );

    switch (ack.ackType) {
      case TransferInstantAnimationsSetAckTypeValues.download:
        {
          // Upload data
          const hashStr = (hash >>> 0).toString(16).toUpperCase();
          this._log(
            "Ready to receive instant animations, " +
              `byte array should be: ${data.length} bytes ` +
              `and hash 0x${hashStr}`
          );
          await this.uploadBulkDataWithAck(
            "transferInstantAnimationSetFinished",
            data,
            progressCallback
          );
        }
        break;

      case TransferInstantAnimationsSetAckTypeValues.upToDate:
        // Nothing to do
        this._log("Instant animations are already up-to-date");
        break;

      default:
        throw new PixelError(this, `Got unknown ackType: ${ack.ackType}`);
    }
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

  // Log the given message prepended with a timestamp and the Pixel name
  private _log(msg: unknown): void {
    if (this._logFunc) {
      if ((msg as PixelMessage)?.type) {
        this._logFunc(`[${_getTime()} - ${this.name}] ${JSON.stringify(msg)}`);
      } else {
        this._logFunc(`[${_getTime()} - ${this.name}] ${msg}`);
      }
    }
  }

  private _logArray(arr: ArrayBuffer) {
    if (this._logFunc) {
      this._logFunc(
        `[${_getTime()} - ${this.name}] ${[...new Uint8Array(arr)]
          .map((b) => (b <= 0xf ? "0" + b.toString(16) : b.toString(16)))
          .join(":")}`
      );
    }
  }

  private async _internalSetup(): Promise<void> {
    // Subscribe to get messages from die
    await this._session.subscribe((dv: DataView) => this._onValueChanged(dv));

    // Identify Pixel
    this._log("Waiting on identification message");
    const iAmADie = (await this.sendAndWaitForResponse(
      "whoAreYou",
      "iAmADie"
    )) as IAmADie | LegacyIAmADie;

    if (iAmADie instanceof LegacyIAmADie) {
      // We should have got the response
      if (this._info.pixelId && this._info.pixelId !== iAmADie.pixelId) {
        throw new PixelConnectIdMismatchError(this, iAmADie.pixelId);
      }

      // Update properties
      this._info.ledCount = iAmADie.ledCount;
      this._info.colorway =
        getValueKeyName(iAmADie.colorway, PixelColorwayValues) ?? "unknown";
      this._info.dieType =
        getValueKeyName(iAmADie.dieType, PixelDieTypeValues) ?? "unknown";
      this._info.pixelId = iAmADie.pixelId;
      this._updateFirmwareDate(new Date(1000 * iAmADie.buildTimestamp));
      this._updateBatteryInfo({
        level: iAmADie.batteryLevelPercent,
        isCharging: isPixelChargingOrDone(iAmADie.batteryState),
      });
      this._updateRollInfo({
        state:
          getValueKeyName(iAmADie.rollState, PixelRollStateValues) ?? "unknown",
        face: iAmADie.currentFaceIndex + (this.ledCount === 10 ? 0 : 1),
      });
    } else {
      // We should have got the response
      if (
        this._info.pixelId &&
        this._info.pixelId !== iAmADie.dieInfo.pixelId
      ) {
        throw new PixelConnectIdMismatchError(this, iAmADie.dieInfo.pixelId);
      }

      // Update properties
      this._info.ledCount = iAmADie.dieInfo.ledCount;
      this._info.colorway =
        getValueKeyName(iAmADie.dieInfo.colorway, PixelColorwayValues) ??
        "unknown";
      this._info.dieType =
        getValueKeyName(iAmADie.dieInfo.dieType, PixelDieTypeValues) ??
        "unknown";
      this._info.pixelId = iAmADie.dieInfo.pixelId;
      this._updateFirmwareDate(
        new Date(1000 * iAmADie.firmwareInfo.buildTimestamp)
      );
      this._updateBatteryInfo({
        level: iAmADie.statusInfo.batteryLevelPercent,
        isCharging: isPixelChargingOrDone(iAmADie.statusInfo.batteryState),
      });
      this._updateRollInfo({
        state:
          getValueKeyName(iAmADie.statusInfo.rollState, PixelRollStateValues) ??
          "unknown",
        face:
          iAmADie.statusInfo.currentFaceIndex + (this.ledCount === 10 ? 0 : 1),
      });
    }
  }

  private _updateStatus(status: PixelStatus): void {
    if (this._status !== status) {
      this._status = status;
      this._log(`Status changed to ${status}`);
      this._evEmitter.emit("status", status); // TODO pass this as first argument to listener
    }
  }

  private _updateName(name: string) {
    if (this._info.name !== name) {
      this._info.name = name;
      this.emitPropertyEvent("name");
    }
  }

  private _updateColorway(colorway: PixelColorway) {
    if (this._info.colorway !== colorway) {
      this._info.colorway = colorway;
      this.emitPropertyEvent("colorway");
    }
  }

  private _updateFirmwareDate(firmwareDate: Date) {
    if (this._info.firmwareDate.getTime() !== firmwareDate.getTime()) {
      this._info.firmwareDate = firmwareDate;
      this.emitPropertyEvent("firmwareDate");
    }
  }

  private _updateRssi(rssi: number) {
    if (this._info.rssi !== rssi) {
      this._info.rssi = rssi;
      this.emitPropertyEvent("rssi");
      this._evEmitter.emit("rssi", rssi);
    }
  }

  private _updateBatteryInfo(
    info: Partial<{
      level: number;
      isCharging: boolean;
    }>
  ) {
    const levelChanged =
      info.level !== undefined && this._info.batteryLevel !== info.level;
    const chargingChanged =
      info.isCharging !== undefined &&
      this._info.isCharging !== info.isCharging;
    if (levelChanged) {
      this._info.batteryLevel = info.level!;
      this.emitPropertyEvent("batteryLevel");
    }
    if (chargingChanged) {
      this._info.isCharging = info.isCharging!;
      this.emitPropertyEvent("isCharging");
    }
    if (levelChanged || chargingChanged) {
      this._evEmitter.emit("battery", { ...info } as BatteryEvent);
    }
  }

  private _updateRollInfo(
    info: Partial<{ state: PixelRollState; face: number }>
  ) {
    if (info.face !== undefined) {
      info.face = this._fixDieFace(info.face);
      if (info.face === undefined) {
        console.log(
          `[${_getTime()} - ${this.name}] /!\\ Dropping ${
            this.dieType
          } roll event for face ${info.face}`
        );
        return;
      }
    }
    const stateChanged =
      info.state !== undefined && this._info.rollState !== info.state;
    const faceChanged =
      info.face !== undefined && this._info.currentFace !== info.face;
    if (stateChanged) {
      this._info.rollState = info.state!;
      this.emitPropertyEvent("rollState");
    }
    if (faceChanged) {
      this._info.currentFace = info.face!;
      this.emitPropertyEvent("currentFace");
    }
    if (info.state !== undefined) {
      // Notify all die roll events
      this._evEmitter.emit("rollState", { ...info } as RollEvent);
      if (info.state === "onFace" && info.face !== undefined) {
        this._evEmitter.emit("roll", info.face);
      }
    }
  }

  // TODO Temporary - Fix face value for d4 and d00
  private _fixDieFace(face: number): number | undefined {
    switch (this.dieType) {
      case "d4":
        if (face === 1) return 1;
        if (face === 3 || face === 4) return face - 1;
        if (face === 6) return 4;
        return undefined;
      case "d00":
        return face * 10;
    }
    return face;
  }

  // Callback on notify characteristic value change
  private _onValueChanged(dataView: DataView) {
    try {
      if (this._logData) {
        this._logArray(dataView.buffer);
      }
      const msgOrType =
        dataView.byteLength &&
        dataView.getUint8(0) === MessageTypeValues.iAmADie &&
        dataView.byteLength !== LegacyIAmADie.expectedSize
          ? this._deserializeImADie(dataView)
          : deserializeMessage(dataView);
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
    }
  }

  private _deserializeImADie(dataView: DataView): IAmADie {
    assert(dataView.getUint8(0) === MessageTypeValues.iAmADie);
    const msg = new IAmADie();
    let offset = 1;
    let typeSize = 1;
    for (const [key, value] of Object.entries(msg)) {
      if (key !== ("type" as keyof IAmADie)) {
        assert(typeof value === "object" && "chunkSize" in value);
        typeSize += value.chunkSize;
        const dataSize = dataView.getUint8(offset);
        if (dataSize !== value.chunkSize) {
          console.log(
            `Received IAmADie '${key}' chunk of size ${dataSize} but expected ${value.chunkSize} bytes`
          );
        }
        deserialize(
          value,
          new DataView(
            dataView.buffer,
            dataView.byteOffset + offset,
            Math.min(dataSize, value.chunkSize)
          ),
          { allowSkipLastProps: true }
        );
        offset += dataSize;
      }
    }
    if (typeSize !== dataView.byteLength) {
      console.log(
        `Received IAmADie of size ${dataView.byteLength} but expected ${typeSize} bytes`
      );
    }
    return msg;
  }

  /**
   * Upload the given data to the Pixel.
   * @param ackType The expected confirmation message type.
   * @param data The data to send.
   * @param progressCallback An optional callback that is called as the operation progresses
   *                         with the progress in percent..
   * @param progressMode Whether to notify progress in percent or bytes.
   * @returns A promise that resolves once the transfer has completed.
   */
  async uploadBulkDataWithAck(
    ackType: MessageType,
    data: ArrayBuffer,
    progressCallback?: (progress: number) => void,
    progressMode: "percent" | "bytes" = "percent"
  ): Promise<void> {
    let programmingFinished = false;
    let stopWaiting: (() => void) | undefined;
    const onFinished = () => {
      programmingFinished = true;
      if (stopWaiting) {
        stopWaiting();
        stopWaiting = undefined;
      }
    };
    this.addMessageListener(ackType, onFinished);
    try {
      await this._uploadBulkData(data, progressCallback, progressMode);
      this._log(
        "Done sending dataset, waiting for Pixel to finish programming"
      );

      const promise = new Promise<void>((resolve, reject) => {
        if (programmingFinished) {
          // Programming may already be finished
          resolve();
        } else {
          const timeoutId = setTimeout(() => {
            reject(
              new PixelError(
                this,
                "Timeout waiting on device to confirm programming"
              )
            );
          }, Constants.ackMessageTimeout);
          stopWaiting = () => {
            clearTimeout(timeoutId);
            resolve();
          };
        }
      });
      await promise;
      this._log("Programming done");
    } finally {
      this.removeMessageListener(ackType, onFinished);
    }
  }

  // Upload the given data to the Pixel
  private async _uploadBulkData(
    data: ArrayBuffer,
    progressCallback?: (progress: number) => void,
    progressMode: "percent" | "bytes" = "percent"
  ): Promise<void> {
    let remainingSize = data.byteLength;
    this._log(`Sending ${remainingSize} bytes of bulk data`);

    // Send setup message
    const setupMsg = new BulkSetup();
    setupMsg.size = remainingSize;
    await this.sendAndWaitForResponse(setupMsg, "bulkSetupAck");
    this._log("Ready for receiving data");

    // TODO update upload state => progressCallback?.("starting");

    // Then transfer data
    let lastProgress = 0;
    let offset = 0;
    const dataMsg = new BulkData();
    while (remainingSize > 0) {
      dataMsg.offset = offset;
      dataMsg.size = Math.min(remainingSize, Constants.maxMessageSize);
      dataMsg.data = data.slice(offset, offset + dataMsg.size);

      await this.sendAndWaitForResponse(dataMsg, "bulkDataAck");

      remainingSize -= dataMsg.size;
      offset += dataMsg.size;
      if (progressCallback) {
        const progress =
          progressMode === "percent"
            ? Math.round((100 * offset) / data.byteLength)
            : offset;
        if (progress > lastProgress) {
          progressCallback(progress);
          lastProgress = progress;
        }
      }
    }

    this._log("Finished sending bulk data");
  }
}
