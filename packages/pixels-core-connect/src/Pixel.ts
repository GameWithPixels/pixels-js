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
  PixelDesignAndColor,
  PixelDesignAndColorValues,
  PixelRollStateValues,
  PixelRollStateNames,
} from "./Messages";
import PixelSession from "./PixelSession";
import getPixelEnumName from "./getPixelEnumName";

// Returns a string with the current time with a millisecond precision
function getTime(): string {
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
export interface RollStateEventData {
  face: number;
  state: PixelRollStateNames;
}

/**
 * Data for the "userMessage" event.
 * @category Pixel
 */
export interface UserMessageEventData {
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
  rollState: RollStateEventData;
  /** Roll value notification. */
  roll: number;
  /** User message notification. */
  userMessage: UserMessageEventData;
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
  readonly designAndColor: PixelDesignAndColor;
  readonly buildTimestamp: number;
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

  // Connection data
  private readonly _session: PixelSession;
  private _status: PixelStatus;

  // Pixel data
  private _info?: IAmADie = undefined;
  private _rollState: {
    face: number;
    state: PixelRollStateNames;
  };

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
  get designAndColor(): PixelDesignAndColor {
    return this._info?.designAndColor ?? PixelDesignAndColorValues.unknown;
  }

  /** Gets the Pixel firmware build timestamp (Unix epoch). */
  get buildTimestamp(): number {
    return this._info?.buildTimestamp ?? 0;
  }

  /** Gets the Pixel last know roll state. */
  get rollState(): {
    face: number;
    state: PixelRollStateNames;
  } {
    return { ...this._rollState };
  }

  /**
   * Instantiates a Pixel.
   */
  constructor(session: PixelSession, logFunc?: (msg: unknown) => void) {
    this._logFunc = logFunc ?? console.log;
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
    this._rollState = { face: 0, state: "unknown" };
    // Subscribe to roll messages and emit roll event
    this.addMessageListener("rollState", (msgOrType) => {
      const msg = msgOrType as RollState;
      this._rollState = {
        face: msg.faceIndex + 1,
        state: getPixelEnumName(msg.state, PixelRollStateValues) ?? "unknown",
      };
      this._evEmitter.emit("rollState", this.rollState);
      if (msg.state === PixelRollStateValues.onFace) {
        this._evEmitter.emit("roll", msg.faceIndex + 1);
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

          // Query roll state
          await this.sendAndWaitForResponse(
            MessageTypeValues.requestRollState,
            MessageTypeValues.rollState
          );

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
    msgType: MessageType | keyof typeof MessageTypeValues,
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
    msgType: MessageType | keyof typeof MessageTypeValues,
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
    this._log(
      `Sending message ${msgName} (${getMessageType(
        msgOrType
      )}) at ${getTime()}`
    );
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
   * Asynchronously gets the battery state.
   * @returns A promise revolving to an object with the batter level in
   *          percentage and flag indicating whether it is charging or not.
   */
  async queryBatteryState(): Promise<{ level: number; isCharging: boolean }> {
    const response = await this.sendAndWaitForResponse(
      MessageTypeValues.requestBatteryLevel,
      MessageTypeValues.batteryLevel
    );
    const msg = response as BatteryLevel;
    return {
      level: 100 * msg.level,
      isCharging: msg.charging,
    };
  }

  /**
   * Asynchronously gets the RSSI value.
   * @returns A promise revolving to the RSSI value, between 0 and 65535.
   */
  async queryRssi(): Promise<number> {
    const response = await this.sendAndWaitForResponse(
      MessageTypeValues.requestRssi,
      MessageTypeValues.rssi
    );
    return (response as Rssi).value;
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
   *                         with the progress value being between 0 an 1.
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
   *                         with the progress value being between 0 an 1.
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
   *                         with the progress value being between 0 an 1.
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
    const play = new PlayInstantAnimation();
    play.animation = animIndex;
    await this.sendMessage(play);
  }

  // Log the given message prepended with a timestamp and the Pixel name
  private _log(msg: unknown): void {
    if (isMessage(msg)) {
      this._logFunc(msg);
    } else {
      this._logFunc(`[Pixel ${this.name}] ${msg}`);
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
        this._log(
          `Received message ${msgName} (${getMessageType(
            msgOrType
          )}) at ${getTime()}`
        );
        if (typeof msgOrType !== "number") {
          // Log message contents
          this._log(msgOrType);
        }
        // Dispatch generic message event
        this._evEmitter.emit("message", msgOrType);
        // Dispatch specific message event
        this._msgEvEmitter.emit(`message${msgName}`, msgOrType);
      } else {
        this._log(`Received invalid message at ${getTime()}`);
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
      progressCallback?.(offset / data.byteLength);
    }

    this._log("Finished sending bulk data");
  }
}
