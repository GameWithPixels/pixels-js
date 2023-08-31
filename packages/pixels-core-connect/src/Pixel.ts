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
  EventReceiver,
  getValueKeyName,
  safeAssign,
} from "@systemic-games/pixels-core-utils";
import { EventEmitter } from "events";

import Constants from "./Constants";
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
  PixelDesignAndColor,
  RequestRssi,
  TelemetryRequestModeValues,
  RemoteAction,
  PixelDesignAndColorValues,
  MessageTypeValues,
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

type Mutable<T> = { -readonly [P in keyof T]: T[P] };

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

/** The different types of dice. */
export type DieType =
  | "d20"
  | "d12"
  | "d10"
  | "d8"
  | "d6"
  | "d6pipped"
  | "d6fudge"
  | "d4";

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
  private _logFunc: (msg: unknown) => void = console.log;
  private _logMessages = false;
  private _logData = false;

  // Connection data
  private readonly _session: PixelSession;
  private _status: PixelStatus;

  // Pixel data
  private _info: Mutable<PixelInfo>;

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
  get logger(): (msg: unknown) => void {
    return this._logFunc;
  }
  set logger(logger: (msg: unknown) => void) {
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
    return this._session.pixelName ?? this._info.name;
  }

  /** Gets the number of LEDs for the Pixel, may be 0 until connected to device. */
  get ledCount(): number {
    return this._info.ledCount;
  }

  /** Gets the design and color of the Pixel. */
  get designAndColor(): PixelDesignAndColor {
    return this._info.designAndColor;
  }

  /** Gets the die type of the Pixel. */
  get dieType(): DieType {
    return Pixel._getDieType(this.ledCount);
  }

  /** Gets the number of faces of the Pixel. */
  get dieFaceCount(): number {
    return Pixel.getFaceCount(this.dieType);
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
   * @param info Some optional extra info.
   */
  constructor(session: PixelSession, info?: Partial<PixelInfo>) {
    super();
    this._info = {
      systemId: session.pixelSystemId,
      pixelId: info?.pixelId ?? 0,
      name: info?.name ?? "",
      ledCount: info?.ledCount ?? 0,
      designAndColor: info?.designAndColor ?? "unknown",
      firmwareDate: info?.firmwareDate ?? new Date(),
      rssi: info?.rssi ?? 0,
      batteryLevel: info?.batteryLevel ?? 0,
      isCharging: info?.isCharging ?? false,
      rollState: info?.rollState ?? "unknown",
      currentFace: info?.currentFace ?? 0,
    };

    this._session = session;
    this._status = "disconnected"; // TODO use the getLastConnectionStatus()

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

    // Subscribe to roll messages and emit roll event
    const rollStateListener = (msgOrType: MessageOrType) => {
      const msg = msgOrType as RollState;
      const roll = {
        state: getValueKeyName(msg.state, PixelRollStateValues) ?? "unknown",
        face: msg.faceIndex + 1,
      };
      const stateChanged = this._info.rollState !== roll.state;
      const faceChanged = this._info.currentFace !== roll.face;
      if (stateChanged) {
        this._info.rollState = roll.state;
        this.emitPropertyEvent("rollState");
      }
      if (faceChanged) {
        this._info.currentFace = roll.face;
        this.emitPropertyEvent("currentFace");
      }
      // Notify all die roll events
      this._evEmitter.emit("rollState", { ...roll });
      if (roll.state === "onFace") {
        this._evEmitter.emit("roll", roll.face);
      }
    };
    this.addMessageListener("rollState", rollStateListener);

    // Subscribe to battery messages and emit battery event
    const batteryLevelListener = (msgOrType: MessageOrType) => {
      const msg = msgOrType as BatteryLevel;
      const battery = {
        level: msg.levelPercent,
        isCharging: isPixelChargingOrDone(msg.state),
      };
      const levelChanged = this._info.batteryLevel !== battery.level;
      const chargingChanged = this._info.isCharging !== battery.isCharging;
      if (levelChanged) {
        this._info.batteryLevel = battery.level;
        this.emitPropertyEvent("batteryLevel");
      }
      if (chargingChanged) {
        this._info.isCharging = battery.isCharging;
        this.emitPropertyEvent("isCharging");
      }
      if (levelChanged || chargingChanged) {
        this._evEmitter.emit("battery", battery);
      }
    };
    this.addMessageListener("batteryLevel", batteryLevelListener);

    // Subscribe to rssi messages and emit event
    const rssiListener = (msgOrType: MessageOrType) => {
      const msg = msgOrType as Rssi;
      if (msg.value !== this._info.rssi) {
        this._info.rssi = msg.value;
        this.emitPropertyEvent("rssi");
        this._evEmitter.emit("rssi", msg.value);
      }
    };
    this.addMessageListener("rssi", rssiListener);

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
      this.addMessageListener("rollState", rollStateListener);
      this.addMessageListener("batteryLevel", batteryLevelListener);
      this.addMessageListener("rssi", rssiListener);
      this.addMessageListener("notifyUser", notifyUserListener);
      this.addMessageListener("remoteAction", remoteActionListener);
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
          // Disconnect but ignore any error
          try {
            await this._session.disconnect();
          } catch {}
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

      // Check if a status change occurred during the connection process
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
    if (name.length) {
      await this.sendAndWaitForResponse(
        safeAssign(new SetName(), { name }),
        "setNameAck"
      );
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
   * Requests the Pixel to turn itself off.
   * @returns A promise that resolves once the message has been send.
   */
  async turnOff(): Promise<void> {
    await this.sendMessage(
      "sleep",
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
        this._logFunc(
          `[${_getTime()} - Pixel ${this.name}] ${JSON.stringify(msg)}`
        );
      } else {
        this._logFunc(`[${_getTime()} - Pixel ${this.name}] ${msg}`);
      }
    }
  }

  private _logArray(arr: ArrayBuffer) {
    if (this._logFunc) {
      this._logFunc(
        `[${_getTime()} - Pixel ${this.name}] ${[...new Uint8Array(arr)]
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
    let iAmADie: IAmADie | undefined = undefined;
    // Try twice
    for (let i = 1; i >= 0; --i) {
      try {
        const msg = await this.sendAndWaitForResponse(
          "whoAreYou",
          "iAmADie",
          2000
        );
        iAmADie = msg as IAmADie;
        break;
      } catch (error) {
        if (i && error instanceof WaitMsgTimeoutErr) {
          // Try again as we've seen instances on Android where the message is not received
          this._log("Resending request for identification message");
        } else {
          throw error;
        }
      }
    }

    // We should have got the response
    assert(iAmADie);
    if (this._info.pixelId && this._info.pixelId !== iAmADie.pixelId) {
      throw new PixelConnectIdMismatchError(this, iAmADie.pixelId);
    }

    // Update properties
    this._info.ledCount = iAmADie.ledCount;
    this._info.designAndColor =
      getValueKeyName(iAmADie.designAndColor, PixelDesignAndColorValues) ??
      "unknown";
    this._info.pixelId = iAmADie.pixelId;
    const firmwareDate = new Date(1000 * iAmADie.buildTimestamp);
    if (this._info.firmwareDate.getTime() !== firmwareDate.getTime()) {
      this._info.firmwareDate = firmwareDate;
      this.emitPropertyEvent("firmwareDate");
    }
    const batteryLevel = iAmADie.batteryLevelPercent;
    if (this._info.batteryLevel !== batteryLevel) {
      this._info.batteryLevel = batteryLevel;
      this.emitPropertyEvent("batteryLevel");
    }
    const isCharging = isPixelChargingOrDone(iAmADie.batteryState);
    if (this._info.isCharging !== isCharging) {
      this._info.isCharging = isCharging;
      this.emitPropertyEvent("isCharging");
    }
    const rollState =
      getValueKeyName(iAmADie.rollState, PixelRollStateValues) ?? "unknown";
    if (this._info.rollState !== rollState) {
      this._info.rollState = rollState;
      this.emitPropertyEvent("rollState");
    }
    const currentFace = iAmADie.currentFaceIndex + 1;
    if (this._info.currentFace !== currentFace) {
      this._info.currentFace = currentFace;
      this.emitPropertyEvent("currentFace");
    }
  }

  private _updateStatus(status: PixelStatus): void {
    if (this._status !== status) {
      this._status = status;
      this._log(`Status changed to ${status}`);
      this._evEmitter.emit("status", status); // TODO pass this as first argument to listener
    }
  }

  // Callback on notify characteristic value change
  private _onValueChanged(dataView: DataView) {
    try {
      const msgOrType = deserializeMessage(dataView.buffer);
      if (msgOrType) {
        const msgName = getMessageType(msgOrType);
        if (this._logMessages) {
          this._log(
            `Received message ${msgName} (${MessageTypeValues[msgName]})`
          );
          if (this._logData) {
            this._logArray(dataView.buffer);
          }
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
      this._log("CharacteristicValueChanged error: " + error);
    }
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

  private static _getDieType(ledCount: number): DieType {
    // For now we infer the die type from the number of LEDs, but eventually
    // that value will be part of identification data.
    switch (ledCount) {
      case 4:
        return "d4";
      case 6:
        return "d6";
      case 8:
        return "d8";
      case 10:
        return "d10";
      case 12:
        return "d12";
      case 0: // Defaults unknown die to D20
      case 20:
        return "d20";
      case 21:
        return "d6pipped";
      default:
        // Fudge has 6 LEDs actually, but let's use it as our default for now
        return "d6fudge";
    }
  }

  private static getFaceCount(dieType: DieType): number {
    // DieType must start by a letter followed by the number of faces
    let i = 2;
    while (i < dieType.length) {
      const c = dieType.charAt(i);
      if (c < "0" || c > "9") break;
      ++i;
    }
    return Number(dieType.substring(1, i));
  }
}
