import {
  Color,
  toColor32,
  DataSet,
} from "@systemic-games/pixels-core-animation";
import {
  assert,
  byteSizeOf,
  createTypedEventEmitter,
  EventReceiver,
  safeAssign,
} from "@systemic-games/pixels-core-utils";
import { EventEmitter } from "events";

import Constants from "./Constants";
import {
  MessageTypeValues,
  MessageType,
  MessageOrType,
  isMessage,
  getMessageName,
  deserializeMessage,
  IAmADie,
  RollState,
  BatteryLevel,
  Rssi,
  Blink,
  PixelMessage,
  getMessageType,
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
  PixelDesignAndColorValues,
  PixelRollStateValues,
  PixelRollStateNames,
  PixelDesignAndColorNames,
  MessageTypeNames,
  PixelBatteryStateValues,
  RequestRssi,
  TelemetryRequestModeValues,
} from "./Messages";
import PixelSession from "./PixelSession";
import getPixelEnumName from "./getPixelEnumName";

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
  face: number;
  state: PixelRollStateNames;
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
  /** Message notification. */
  message: MessageOrType;
  /** Roll state changed notification. */
  rollState: PixelRollData;
  /** Roll result notification. */
  roll: number;
  /** Battery state changed notification. */
  battery: PixelBatteryData;
  /** RSSI change notification. */
  rssi: number;
  /** User message notification. */
  userMessage: PixelUserMessage;
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
    this._pixel = pixel;
  }
}

/**
 * Common accessible values for all Pixel implementations.
 * @category Pixel
 */
export interface IPixel {
  readonly systemId: string;
  readonly pixelId: number;
  readonly name: string;
  readonly ledCount: number;
  readonly designAndColor: PixelDesignAndColorNames;
  readonly firmwareDate: Date;
  readonly rssi: number;
  readonly batteryLevel: number; // Percentage
  readonly isCharging: boolean;
  readonly rollState: PixelRollStateNames;
  readonly currentFace: number; // Face value (not index)
}

/**
 * Represents a Pixel die.
 * Most of its methods require that the instance is connected to the Pixel device.
 * Call the {@link connect} method to initiate a connection.
 * @category Pixel
 */
export default class Pixel implements IPixel {
  // Our events emitter
  private readonly _evEmitter = createTypedEventEmitter<PixelEventMap>();
  private readonly _msgEvEmitter = new EventEmitter();

  // Log function
  private readonly _logFunc: (msg: unknown) => void;
  private readonly _logMessages: boolean;

  // Connection data
  private readonly _session: PixelSession;
  private _status: PixelStatus;

  // Pixel data
  private _info?: IAmADie = undefined;
  private _rollState: PixelRollData = { face: 0, state: "unknown" };
  private _batteryState: PixelBatteryData = {
    level: 0,
    isCharging: false,
  };
  private _rssi = 0;

  /** Gets this Pixel's last known connection status.*/
  get status(): PixelStatus {
    return this._status;
  }

  /** Shorthand for checking if Pixel status is "ready". */
  get isReady(): boolean {
    return this.status === "ready";
  }

  /** Gets the id assigned by the OS to Pixel Bluetooth peripheral. */
  get systemId(): string {
    return this._session.pixelSystemId;
  }

  /** Gets the unique Pixel id for the die, may be 0 until connected to device. */
  get pixelId(): number {
    return this._info?.pixelId ?? 0;
  }

  /** Gets the Pixel name, may be empty until connected to device. */
  get name(): string {
    return this._session.pixelName;
  }

  /** Gets the number of LEDs for this Pixel die, may be 0 until connected to device. */
  get ledCount(): number {
    return this._info?.ledCount ?? 0;
  }

  /** Gets the Pixel design and color. */
  get designAndColor(): PixelDesignAndColorNames {
    return (
      getPixelEnumName(this._info?.designAndColor, PixelDesignAndColorValues) ??
      "unknown"
    );
  }

  /** Gets the Pixel firmware build date. */
  get firmwareDate(): Date {
    return new Date(1000 * (this._info?.buildTimestamp ?? 0));
  }

  /**
   * Gets the last RSSI value notified by the Pixel.
   * @remarks Call {@link reportRssi} to automatically update the RSSI value.
   */
  get rssi(): number {
    return this._rssi;
  }

  /**
   * Gets the Pixel battery level (percentage).
   * @remarks The battery level is automatically updated when connected.
   */
  get batteryLevel(): number {
    return this._batteryState.level;
  }

  /**
   * Gets the Pixel battery charging state.
   * @remarks The charging state is automatically updated when connected.
   */
  get isCharging(): boolean {
    return this._batteryState.isCharging;
  }

  /**
   * Gets the Pixel roll state.
   * @remarks The roll state is automatically updated when connected.
   */
  get rollState(): PixelRollStateNames {
    return this._rollState.state;
  }

  /**
   * Gets the Pixel face value that is currently up.
   * @remarks The current face is automatically updated when connected.
   */
  get currentFace(): number {
    return this._rollState.face;
  }

  /**
   * Instantiates a Pixel.
   */
  constructor(
    session: PixelSession,
    logFunc?: (msg: unknown) => void,
    logMessages = false
  ) {
    this._logFunc = logFunc ?? console.log;
    this._logMessages = logMessages;
    // TODO clean up events on release
    session.setConnectionEventListener(({ connectionStatus }) => {
      if (connectionStatus !== "connected" && connectionStatus !== "ready") {
        this._updateStatus(
          connectionStatus === "failedToConnect"
            ? "disconnected"
            : connectionStatus
        );
      }
    });
    this._session = session;
    this._status = "disconnected"; //TODO use the getLastConnectionStatus()
    // Subscribe to roll messages and emit roll event
    this.addMessageListener("rollState", (msgOrType) => {
      const msg = msgOrType as RollState;
      const roll = {
        face: msg.faceIndex + 1,
        state: getPixelEnumName(msg.state, PixelRollStateValues) ?? "unknown",
      };
      // Notify all die roll events
      this._rollState = roll;
      this._evEmitter.emit("rollState", { ...roll });
      if (roll.state === "onFace") {
        this._evEmitter.emit("roll", roll.face);
      }
    });
    // Subscribe to battery messages and emit battery event
    this.addMessageListener("batteryLevel", (msgOrType) => {
      const msg = msgOrType as BatteryLevel;
      const battery = {
        level: msg.levelPercent,
        isCharging: msg.state >= PixelBatteryStateValues.charging,
      };
      if (
        battery.level !== this._batteryState.level ||
        battery.isCharging !== this._batteryState.isCharging
      ) {
        this._batteryState = battery;
        this._evEmitter.emit("battery", { ...battery });
      }
    });
    // Subscribe to rssi messages and emit event
    this.addMessageListener("rssi", (msgOrType) => {
      const msg = msgOrType as Rssi;
      if (msg.value !== this._rssi) {
        this._rssi = msg.value;
        this._evEmitter.emit("rssi", this._rssi);
      }
    });
    // Subscribe to user message notification
    this.addMessageListener("notifyUser", (message: MessageOrType) => {
      const msg = message as NotifyUser;
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
    });
  }

  /**
   * Asynchronously tries to connect to the Pixel. Throws on connection error.
   * @returns A promise resolving to this instance.
   */
  async connect(): Promise<Pixel> {
    //TODO add timeout
    // Our connect function
    try {
      //TODO should we try to connect even if status is not disconnected?
      if (this.status !== "disconnected") {
        throw new PixelError(
          this,
          `Can only connect when in disconnected state, not in ${this.status} state`
        );
      }

      await this._session.connect();

      // @ts-expect-error status was already tested above but should have changed since
      if (this.status === "connecting") {
        // Notify connected
        this._updateStatus("identifying");

        this._log("Subscribing");
        await this._session.subscribe((dv: DataView) =>
          this._onValueChanged(dv)
        );

        // Identify Pixel
        this._log("Waiting on identification message");
        const response = await this.sendAndWaitForResponse(
          MessageTypeValues.whoAreYou,
          MessageTypeValues.iAmADie
        );

        if (this.status === "identifying") {
          this._info = response as IAmADie;

          this._batteryState = {
            level: this._info.batteryLevelPercent,
            isCharging:
              this._info.batteryState >= PixelBatteryStateValues.charging,
          };

          this._rollState = {
            face: this._info.rollFaceIndex + 1,
            state:
              getPixelEnumName(this._info.rollState, PixelRollStateValues) ??
              "unknown",
          };

          // We're ready!
          this._updateStatus("ready");
        }
      }

      //TODO also check status change counter
      // @ts-expect-error status was already tested above but should have changed since
      if (this.status !== "ready") {
        throw new PixelError(
          this,
          `Status changed while connecting, now in ${this.status} state`
        );
      }
      return this;
    } catch (error) {
      // Disconnect but ignore any error as we are in an unknown state
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      this._session.disconnect().catch(() => {});
      throw error;
    }
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
    msgType: MessageType | MessageTypeNames,
    listener: (this: Pixel, message: MessageOrType) => void
  ): void {
    this._msgEvEmitter.addListener(
      `message${
        typeof msgType === "string" ? msgType : getMessageName(msgType)
      }`,
      listener
    );
  }

  /**
   * Unregister a listener invoked on receiving raw messages of a given type.
   * @param msgType The type of message to watch for.
   * @param listener The callback function to unregister.
   */
  removeMessageListener(
    msgType: MessageType | MessageTypeNames,
    listener: (this: Pixel, msg: MessageOrType) => void
  ): void {
    this._msgEvEmitter.removeListener(
      `message${
        typeof msgType === "string" ? msgType : getMessageName(msgType)
      }`,
      listener
    );
  }

  /**
   * Send a message to the Pixel.
   * @param msgOrType
   * @param withoutResponse
   */
  async sendMessage(
    msgOrType: MessageOrType,
    withoutResponse = false
  ): Promise<void> {
    const msgName = getMessageName(msgOrType);
    if (this._logMessages) {
      this._log(`Sending message ${msgName} (${getMessageType(msgOrType)})`);
    }
    const data = serializeMessage(msgOrType);
    await this._session.writeValue(data, withoutResponse);
  }

  /**
   * Send a message to the Pixel and wait for a specific reply.
   * @param msgOrTypeToSend
   * @param expectedMsgType
   * @param timeoutMs
   * @returns
   */
  async sendAndWaitForResponse(
    msgOrTypeToSend: MessageOrType,
    expectedMsgType: MessageType,
    timeoutMs = Constants.ackMessageTimeout
  ): Promise<MessageOrType> {
    // Get the session object, throws an error if invalid
    const result = await Promise.all([
      this._waitForMsg(expectedMsgType, timeoutMs),
      this.sendMessage(msgOrTypeToSend),
    ]);
    return result[0];
  }

  /**
   * Send a message and wait for a specific reply.
   * @param msgOrType
   * @param responseMsgClass
   * @returns
   */
  async sendAndWaitForResponseObj<T extends PixelMessage>(
    msgOrType: MessageOrType,
    responseMsgClass: new () => T
  ): Promise<T> {
    const msg = await this.sendAndWaitForResponse(
      msgOrType,
      getMessageType(responseMsgClass)
    );
    return msg as T;
  }

  /**
   * Request Pixel to change its name.
   */
  async rename(name: string): Promise<void> {
    if (name.length) {
      await this.sendAndWaitForResponse(
        safeAssign(new SetName(), { name }),
        MessageTypeValues.setNameAck
      );
    }
  }

  /**
   * Request Pixel to start faces calibration sequence.
   */
  async startCalibration(): Promise<void> {
    await this.sendMessage(MessageTypeValues.calibrate);
  }

  /**
   * Request Pixel to regularly send its measured RSSI value.
   * @param activate Whether to turn or turn off this feature.
   * @param minInterval The minimum time interval in milliseconds
   *                    between two RSSI updates.
   */
  async reportRssi(activate: boolean, minInterval = 5000): Promise<void> {
    await this.sendMessage(
      safeAssign(new RequestRssi(), {
        requestMode: activate
          ? TelemetryRequestModeValues.repeat
          : TelemetryRequestModeValues.off,
        minInterval,
      })
    );
  }

  /**
   * Request Pixel die to turn off.
   */
  async turnOff(): Promise<void> {
    await this.sendMessage(
      MessageTypeValues.sleep,
      true // withoutResponse
    );
  }

  /**
   * Requests the Pixel to blink and wait for a confirmation.
   * @param color Blink color.
   * @param options.count Number of blinks.
   * @param options.duration Total duration in milliseconds.
   * @param options.fade Amount of in and out fading, 0: sharp transition, 1: max fading.
   * @param options.faceMask Select which faces to light up.
   * @returns A promise.
   */
  async blink(
    color: Color,
    options?: {
      count?: number;
      duration?: number;
      fade?: number;
      faceMask?: number;
    }
  ): Promise<void> {
    const blinkMsg = safeAssign(new Blink(), {
      color: toColor32(color),
      count: options?.count ?? 1,
      duration: options?.duration ?? 1000,
      fade: 255 * (options?.fade ?? 0),
      faceMask: options?.faceMask ?? -1,
    });
    await this.sendAndWaitForResponse(
      blinkMsg,
      MessageTypeValues.blinkFinished
    );
  }

  /**
   * Requests the Pixel to stop all animations currently playing.
   */
  async stopAllAnimations(): Promise<void> {
    await this.sendMessage(MessageTypeValues.stopAllAnimations);
  }

  /**
   * Uploads the given data set of animations to the Pixel flash memory.
   * @param dataSet The data set to upload.
   * @param progressCallback An optional callback that is called as the operation progresses
   *                         with the progress in percent..
   */
  async transferDataSet(
    dataSet: DataSet,
    progressCallback?: (progress: number) => void
  ): Promise<void> {
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

    const transferAck = await this.sendAndWaitForResponseObj(
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

      await this._uploadBulkDataWithAck(
        MessageTypeValues.transferAnimationSetFinished,
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
   */
  async playTestAnimation(
    dataSet: DataSet,
    progressCallback?: (progress: number) => void
  ): Promise<void> {
    assert(dataSet.animations.length >= 1, "No animation in DataSet");

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

    const ack = await this.sendAndWaitForResponseObj(
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
          await this._uploadBulkDataWithAck(
            MessageTypeValues.transferTestAnimationSetFinished,
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
   */
  async transferInstantAnimations(
    dataSet: DataSet,
    progressCallback?: (progress: number) => void
  ): Promise<void> {
    assert(dataSet.animations.length >= 1, "No animation in DataSet");

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

    const ack = await this.sendAndWaitForResponseObj(
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
          await this._uploadBulkDataWithAck(
            MessageTypeValues.transferInstantAnimationSetFinished,
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
   */
  async playInstantAnimation(animIndex: number): Promise<void> {
    await this.sendMessage(
      safeAssign(new PlayInstantAnimation(), { animation: animIndex })
    );
  }

  // Log the given message prepended with a timestamp and the Pixel name
  private _log(msg: unknown): void {
    if (isMessage(msg)) {
      this._logFunc(msg);
    } else {
      this._logFunc(`[${_getTime()} - Pixel ${this.name}] ${msg}`);
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
      const msgName = getMessageName(msgOrType);
      if (msgOrType) {
        if (this._logMessages) {
          this._log(
            `Received message ${msgName} (${getMessageType(msgOrType)})}`
          );
          if (typeof msgOrType !== "number") {
            // Log message contents
            this._log(msgOrType);
          }
        }
        // Dispatch generic message event
        this._evEmitter.emit("message", msgOrType);
        // Dispatch specific message event
        this._msgEvEmitter.emit(`message${msgName}`, msgOrType);
      } else {
        this._log("Received invalid message");
      }
    } catch (error) {
      this._log("CharacteristicValueChanged error: " + error);
    }
  }

  // Helper method that waits for a message from Pixel
  private _waitForMsg(
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
              `Timeout of ${timeoutMs}ms waiting on message ` +
                getMessageName(expectedMsgType)
            )
          );
        }
      }, timeoutMs);
      this.addMessageListener(expectedMsgType, onMessage);
    });
  }

  // Upload the given data to the Pixel
  private async _uploadBulkDataWithAck(
    ackType: MessageType,
    data: ArrayBuffer,
    progressCallback?: (progress: number) => void
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
      await this._uploadBulkData(data, progressCallback);
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
    progressCallback?: (progress: number) => void
  ): Promise<void> {
    let remainingSize = data.byteLength;
    this._log(`Sending ${remainingSize} bytes of bulk data`);
    progressCallback?.(0);

    // Send setup message
    const setupMsg = new BulkSetup();
    setupMsg.size = remainingSize;
    await this.sendAndWaitForResponse(setupMsg, MessageTypeValues.bulkSetupAck);
    this._log("Ready for receiving data");

    // Then transfer data
    let lastProgress = 0;
    let offset = 0;
    while (remainingSize > 0) {
      const dataMsg = new BulkData();
      dataMsg.offset = offset;
      dataMsg.size = Math.min(remainingSize, Constants.maxMessageSize);
      dataMsg.data = data.slice(offset, offset + dataMsg.size);

      //TODO test disconnecting die in middle of transfer
      await this.sendAndWaitForResponse(dataMsg, MessageTypeValues.bulkDataAck);

      remainingSize -= dataMsg.size;
      offset += dataMsg.size;
      if (progressCallback) {
        const progress = Math.round((100 * offset) / data.byteLength);
        if (progress > lastProgress) {
          progressCallback(progress);
          lastProgress = progress;
        }
      }
    }

    this._log("Finished sending bulk data");
  }
}
