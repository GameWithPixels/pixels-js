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
 * List of possible Pixel statuses.
 * @category Pixel
 */
export type PixelStatus =
  | "disconnected"
  | "connecting"
  | "identifying"
  | "ready"
  | "disconnecting";

/**
 * Data for the "rollState" event.
 * @category Pixel
 */
export interface PixelRollData {
  state: PixelRollState;
  face: number;
}

/**
 * Data for the "rollState" event.
 * @category Pixel
 */
export interface PixelBatteryData {
  level: number; // Percentage
  isCharging: boolean;
}

/**
 * Data for the "userMessage" event.
 * @category Pixel
 */
export interface PixelUserMessage {
  message: string;
  withCancel: boolean;
  response: (okCancel: boolean) => Promise<void>;
}

/**
 * Event map for {@link Pixel} class.
 * @category Pixel
 */
export interface PixelEventMap {
  /** Connection status update. */
  status: PixelStatus;
  /** Message received notification. */
  message: MessageOrType;
  /** Message send notification. */
  messageSend: MessageOrType;
  /** Roll state changed notification. */
  rollState: PixelRollData;
  /** Roll result notification. */
  roll: number;
  /** Battery state changed notification. */
  battery: PixelBatteryData;
  /** RSSI change notification. */
  rssi: number;
  /** User message request. */
  userMessage: PixelUserMessage;
  /** Remote action request. */
  remoteAction: number; // Remote action id
}

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
 * Class used by {@link Pixel} to throw errors caused by a timeout.
 * @category Pixel
 */
export class PixelErrorTimeout extends PixelError {}

/**
 * Represents a Pixels die.
 * Most of its methods require the instance to be connected to the Pixel device.
 * Call the {@link connect()} method to initiate a connection.
 * @category Pixel
 */
export class Pixel extends PixelInfoNotifier {
  // Our events emitter
  private readonly _evEmitter = createTypedEventEmitter<PixelEventMap>();
  private readonly _msgEvEmitter = new EventEmitter();

  // Log function
  private _logFunc: (msg: unknown) => void = console.log;
  private _logMessages = false;

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

  /** Set logger to use by this instance. */
  get logger(): (msg: unknown) => void {
    return this._logFunc;
  }
  set logger(logger: (msg: unknown) => void) {
    this._logFunc = logger;
  }

  /** Gets the Pixel last known connection status. */
  get status(): PixelStatus {
    return this._status;
  }

  /** Shorthand property that indicates if the Pixel status is "ready". */
  get isReady(): boolean {
    return this.status === "ready";
  }

  /** Gets the unique id assigned by the OS to Pixel Bluetooth peripheral. */
  get systemId(): string {
    return this._info.systemId;
  }

  /** Gets the unique Pixel id for the die, may be 0 until connected to device. */
  get pixelId(): number {
    return this._info.pixelId;
  }

  /** Gets the Pixel name, may be empty until connected to device. */
  get name(): string {
    return this._session.pixelName;
  }

  /** Gets the number of LEDs for this Pixels die, may be 0 until connected to device. */
  get ledCount(): number {
    return this._info.ledCount;
  }

  /** Gets the Pixel design and color. */
  get designAndColor(): PixelDesignAndColor {
    return this._info.designAndColor;
  }

  /** Gets the Pixel firmware build date. */
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
   * Gets the Pixel battery level (percentage).
   * @remarks The battery level is automatically updated when connected.
   */
  get batteryLevel(): number {
    return this._info.batteryLevel;
  }

  /**
   * Gets whether the Pixel battery is charging or not.
   * Also 'true' if fully charged but still on charger.
   * @remarks The charging state is automatically updated when connected.
   */
  get isCharging(): boolean {
    return this._info.isCharging;
  }

  /**
   * Gets the Pixel roll state.
   * @remarks The roll state is automatically updated when connected.
   */
  get rollState(): PixelRollState {
    return this._info.rollState;
  }

  /**
   * Gets the Pixel face value that is currently up.
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
    this._status = "disconnected"; //TODO use the getLastConnectionStatus()

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
    const batterLevelListener = (msgOrType: MessageOrType) => {
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
    this.addMessageListener("batteryLevel", batterLevelListener);

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
      this.addMessageListener("batteryLevel", batterLevelListener);
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
   * Asynchronously tries to connect to the Pixel. Throws on connection error.
   * @param timeoutMs Delay before giving up (may be ignored when having concurrent
   *                  calls to connect()). It may take longer than the given timeout
   *                  for the function to return.
   * @returns A promise resolving to this instance.
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

      // And prepare our instance for communications with the Pixels die
      if (this.status === "connecting") {
        // Notify we're connected and proceeding with die identification
        this._updateStatus("identifying");

        try {
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
        throw new PixelError(
          this,
          `Connection cancelled (current state is ${this.status})`
        );
      }
    } catch (e) {
      // Check if error was (likely) caused by the connection timeout
      if (hasTimedOut) {
        throw new PixelErrorTimeout(
          this,
          `Connection timeout after ${timeoutMs} ms`
        );
      } else {
        throw e;
      }
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }

    return this;
  }

  /**
   * Immediately disconnects the Pixel.
   **/
  async disconnect(): Promise<Pixel> {
    //TODO prevent automatically reconnecting
    //TODO forceDisconnect param => counter!
    await this._session.disconnect();
    return this;
  }

  /**
   * Adds the given listener function to the end of the listeners array
   * for the event with the given name.
   * See {@link PixelEventMap} for the list of events and their associated
   * data.
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
   * See {@link PixelEventMap} for the list of events and their associated
   * data.
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
    timeoutMs = Constants.ackMessageTimeout
  ): Promise<MessageOrType> {
    return new Promise((resolve, reject) => {
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      const onMessage = (msg: MessageOrType) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = undefined;
          this.removeMessageListener(expectedMsgType, onMessage);
          resolve(msg);
        }
      };
      timeoutId = setTimeout(() => {
        if (timeoutId) {
          timeoutId = undefined;
          this.removeMessageListener(expectedMsgType, onMessage);
          reject(
            new Error(
              `Timeout of ${timeoutMs}ms waiting on message ${expectedMsgType}`
            )
          );
        }
      }, timeoutMs);
      this.addMessageListener(expectedMsgType, onMessage);
    });
  }

  /**
   * Sends a message to the Pixel.
   * @param msgOrType Message with the data to send or just a message type.
   * @param withoutAck Whether to request a confirmation that the message was received.
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
    await this._session.writeValue(data, withoutAck);
    this._evEmitter.emit("messageSend", msgOrType);
  }

  /**
   * Sends a message to the Pixel and wait for a specific response.
   * @param msgOrTypeToSend Message with the data to send or just a message type.
   * @param responseType Expected response type.
   * @param timeoutMs Timeout in mill-seconds before aborting waiting for the response.
   * @returns A promise resolving to a message type or a message object.
   */
  async sendAndWaitForResponse(
    msgOrTypeToSend: MessageOrType,
    responseType: MessageType,
    timeoutMs = Constants.ackMessageTimeout
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
    timeoutMs = Constants.ackMessageTimeout
  ): Promise<T> {
    // Get the session object, throws an error if invalid
    return (await this.sendAndWaitForResponse(
      msgOrTypeToSend,
      getMessageType(new responseType().type),
      timeoutMs
    )) as T;
  }

  /**
   * Requests Pixel to change its name.
   * @param name New name to assign to the Pixel.
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
   * Requests Pixel to start faces calibration sequence.
   */
  async startCalibration(): Promise<void> {
    await this.sendMessage("calibrate");
  }

  /**
   * Requests Pixel to regularly send its measured RSSI value.
   * @param activate Whether to turn or turn off this feature.
   * @param minInterval The minimum time interval in milliseconds
   *                    between two RSSI updates.
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
   * Requests Pixel to turn itself off.
   */
  async turnOff(): Promise<void> {
    await this.sendMessage(
      "sleep",
      true // withoutAck
    );
  }

  /**
   * Requests Pixel to blink and wait for a confirmation.
   * @param color Blink color.
   * @param opt.count Number of blinks.
   * @param opt.duration Total duration of the animation in milliseconds.
   * @param opt.fade Amount of in and out fading, 0: sharp transition, 1: maximum fading.
   * @param opt.faceMask Select which faces to light up.
   * @param opt.loop Whether to indefinitely loop the animation.
   * @returns A promise.
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
   * Requests the Pixel to stop all animations currently playing.
   * @returns A promise.
   */
  async stopAllAnimations(): Promise<void> {
    await this.sendMessage("stopAllAnimations");
  }

  /**
   * Uploads the given data set of animations to the Pixel flash memory.
   * @param dataSet The data set to upload.
   * @param progressCallback An optional callback that is called as the operation progresses
   *                         with the progress in percent..
   * @returns A promise.
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
   * @returns A promise.
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
   * @returns A promise.
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
   * @returns A promise.
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
        this._logFunc(msg);
      } else {
        this._logFunc(`[${_getTime()} - Pixel ${this.name}] ${msg}`);
      }
    }
  }

  private async _internalSetup(): Promise<void> {
    this._log("Subscribing");
    await this._session.subscribe((dv: DataView) => this._onValueChanged(dv));

    // Identify Pixel
    this._log("Waiting on identification message");
    const resp = await this.sendAndWaitForResponse("whoAreYou", "iAmADie");
    const iAmADie = resp as IAmADie;

    if (this._info.pixelId !== iAmADie.pixelId) {
      throw new PixelError(
        this,
        `Pixel mismatch from identification: ${iAmADie.pixelId}`
      );
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
      this._evEmitter.emit("status", status); //TODO pass this as first argument to listener
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

  // Upload the given data to the Pixel
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

    //TODO
    //TODO
    //TODO
    progressCallback?.(0);

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
