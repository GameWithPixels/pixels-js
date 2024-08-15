import {
  AnimConstants,
  Color,
  Color32Utils,
  DataSet,
  DiceUtils,
  PixelColorway,
  PixelColorwayValues,
  PixelDieType,
  PixelDieTypeValues,
} from "@systemic-games/pixels-core-animation";
import {
  byteSizeOf,
  createTypedEventEmitter,
  EventReceiver,
  getValueKeyName,
  Mutable,
  safeAssign,
} from "@systemic-games/pixels-core-utils";

import { deserializeChunkedMessage } from "./ChunkMessage";
import { Constants } from "./Constants";
import {
  BatteryLevel,
  Blink,
  BulkData,
  BulkSetup,
  IAmADie,
  LegacyIAmADie,
  MessageOrType,
  MessageType,
  MessageTypeValues,
  NotifyUser,
  NotifyUserAck,
  PixelPowerOperationValues,
  PlayInstantAnimation,
  PowerOperation,
  RemoteAction,
  RequestRssi,
  RollState,
  Rssi,
  serializer,
  SetName,
  TransferAnimationSet,
  TransferAnimationSetAck,
  TransferInstantAnimationSet,
  TransferInstantAnimationSetAck,
  TransferInstantAnimationsSetAckTypeValues,
  TransferTestAnimationSet,
  TransferTestAnimationSetAck,
  VersionInfoChunk,
} from "./DieMessages";
import { PixelConnect, PixelConnectMutableProps } from "./PixelConnect";
import { PixelInfo } from "./PixelInfo";
import { PixelMessage } from "./PixelMessage";
import { PixelRollState, PixelRollStateValues } from "./PixelRollState";
import { PixelSession } from "./PixelSession";
import { TelemetryRequestModeValues } from "./TelemetryRequestMode";
import { getDefaultPixelName } from "./advertisedNames";
import {
  PixelConnectError,
  PixelConnectIdMismatchError,
  PixelEmptyNameError,
  PixelIncompatibleMessageError,
  PixelTransferCompletedTimeoutError,
  PixelTransferError,
  PixelTransferInProgressError,
  PixelTransferInvalidDataError,
  PixelTransferOutOfMemoryError,
} from "./errors";
import { isPixelChargingOrDone } from "./isPixelChargingOrDone";

/**
 * Data structure for {@link Pixel} roll state events,
 * see {@link PixelEventMap}.
 * @category Pixels
 */
export type RollEvent = Readonly<{
  /** The roll state of the Pixel when this event was raised. */
  state: PixelRollState;
  /**
   * The value of the die face that is currently facing up.
   * @remarks Fudge die will return -1, 0 or 1.
   **/
  face: number;
  /**
   * The 0-based index of the die face that is currently facing up.
   * @see {@link PixelInfo.currentFaceIndex} for more details.
   **/
  faceIndex: number;
}>;

/**
 * Data structure for {@link Pixel} battery events,
 * see {@link PixelEventMap}.
 * @category Pixels
 */
export type BatteryEvent = Readonly<{
  level: number; // Percentage
  isCharging: boolean;
}>;

/**
 * Data structure for {@link Pixel} data transfer events,
 * and for {@link Pixel.dataTransferProgress}.
 * see {@link PixelEventMap}.
 * @category Pixels
 */
export type UserMessageEvent = Readonly<{
  message: string;
  withCancel: boolean;
  response: (okCancel: boolean) => Promise<void>;
}>;

/**
 * Data structure for {@link Pixel} user message events,
 * see {@link PixelEventMap}.
 * @category Pixels
 */
export type DataTransferProgress = Readonly<{
  progressPercent: number; // Integer between 0 and 100
  transferredBytes: number;
  totalBytes: number;
}>;

/**
 * Event map for {@link Pixel} class.
 * This is the list of supported events where the property name
 * is the event name and the property type the event data type.
 * Call {@link Pixel.addEventListener} to subscribe to an event.
 * @category Pixels
 */
export type PixelEventMap = Readonly<{
  /** Message received notification. */
  messageReceived: MessageOrType;
  /** Message send notification. */
  messageSend: MessageOrType;
  /** Roll state changed notification. */
  rollState: RollEvent;
  /** Roll result notification. */
  roll: number;
  /** Battery state changed notification. */
  battery: BatteryEvent;
  /** User message request. */
  userMessage: UserMessageEvent;
  /** Remote action request. */
  remoteAction: number; // Remote action id
  /** Data transfer. */
  dataTransfer: Readonly<
    | {
        type: "preparing" | "starting" | "completed";
        totalBytes: number;
      }
    | {
        type: "failed";
        error: "timeout" | "outOfMemory" | "disconnected" | "unknown";
      }
    | ({
        type: "progress";
      } & DataTransferProgress)
  >;
}>;

/**
 * The mutable properties of {@link Pixel} not inherited from parent
 * class {@link PixelConnect}.
 * @category Pixels
 */
export type PixelOwnMutableProps = {
  /** On-die profile hash value. */
  profileHash: number;
  /** Ongoing data transfer progress (such as programming a profile). */
  transferProgress: DataTransferProgress | undefined;
};

/**
 * The mutable properties of {@link Pixel}.
 * @category Pixels
 */
export type PixelMutableProps = PixelConnectMutableProps & PixelOwnMutableProps;

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
export class Pixel
  extends PixelConnect<
    PixelMutableProps,
    PixelConnectMutableProps & PixelOwnMutableProps,
    MessageType
  >
  implements PixelOwnMutableProps
{
  // Event emitter
  private readonly _evEmitter = createTypedEventEmitter<PixelEventMap>();

  // Pixel data
  private readonly _info: Mutable<PixelInfo>;
  private readonly _versions: Omit<
    VersionInfoChunk,
    "chunkSize" | "buildTimestamp"
  >;

  // Profile
  private _profileHash = 0;
  private _transferProgress?: DataTransferProgress;

  // Clean-up
  private _disposeFunc: () => void;

  /** Device type is Pixels die. */
  readonly type = "pixel";

  /** Gets the unique id assigned by the system to the Pixel Bluetooth peripheral. */
  get systemId(): string {
    return this._info.systemId;
  }

  /** Gets the unique Pixel id of the device, may be 0 until connected. */
  get pixelId(): number {
    return this._info.pixelId;
  }

  /** Gets the Pixel name, may be empty until connected to device. */
  get name(): string {
    // The name from the session may be outdated
    return this._info.name.length
      ? this._info.name
      : this.sessionDeviceName ?? "";
  }

  /** Gets the number of LEDs for the Pixel, may be 0 until connected to device. */
  get ledCount(): number {
    return this._info.ledCount;
  }

  /** Gets the color of the Pixel. */
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
   * @remarks This value is automatically updated when the die is connected.
   */
  get batteryLevel(): number {
    return this._info.batteryLevel;
  }

  /**
   * Gets whether the Pixel battery is charging or not.
   * Returns 'true' if fully charged but still on charger.
   * @remarks This value is automatically updated when the die is connected.
   */
  get isCharging(): boolean {
    return this._info.isCharging;
  }

  /**
   * Gets the Pixel roll state.
   * @remarks This value is automatically updated when the die is connected.
   */
  get rollState(): PixelRollState {
    return this._info.rollState;
  }

  /**
   * Gets the die face value that is currently facing up.
   * @remarks
   * Fudge die returns +1, 0 and -1.
   * This value is automatically updated when the die is connected.
   */
  get currentFace(): number {
    return this._info.currentFace;
  }

  /**
   * Gets the 0-based index of the die face that is currently facing up.
   * @remarks
   * This value is automatically updated when the die is connected.
   * @see {@link PixelInfo.currentFaceIndex} for more details.
   */
  get currentFaceIndex(): number {
    return this._info.currentFaceIndex;
  }

  /**
   * Gets the on-die profile hash value.
   * This can be used as an identifier for the current profile.
   */
  get profileHash(): number {
    return this._profileHash;
  }

  /**
   * Gets an ongoing data transfer progress (such as programming a profile).
   */
  get transferProgress(): DataTransferProgress | undefined {
    return this._transferProgress;
  }

  /**
   * Instantiates a Pixel.
   * @param session The session used to communicate with the Pixel.
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
    super(serializer, session);
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

    // Subscribe to instance status change
    const statusListener = ({ status }: PixelMutableProps) => {
      // Reset transfer progress on disconnect
      if (
        this._transferProgress &&
        status !== "identifying" &&
        status !== "ready"
      ) {
        this._updateTransferProgress({
          type: "failed",
          error: "disconnected",
        });
      }
      // Notify battery state
      if (status === "ready") {
        this._evEmitter.emit("battery", {
          level: this._info.batteryLevel,
          isCharging: this._info.isCharging,
        });
        // We don't raise roll and roll state events as those should occur
        // only when the die is actually moved
      }
    };
    this.addPropertyListener("status", statusListener);

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

    // Subscribe to roll messages and emit roll event
    const rollStateListener = (msgOrType: MessageOrType) => {
      const msg = msgOrType as RollState;
      this._updateRoll(
        getValueKeyName(msg.state, PixelRollStateValues) ?? "unknown",
        msg.faceIndex
      );
    };
    this.addMessageListener("rollState", rollStateListener);

    // Reset profile hash & die name on "clear settings" and "program default" ack
    const resetListener = () => {
      // Reset profile hash
      this._updateHash(Constants.factoryProfileHashes[this.dieType] ?? 0);
      // Reset name
      this._updateName(getDefaultPixelName(this._info.pixelId));
    };
    this.addMessageListener("clearSettingsAck", resetListener);
    this.addMessageListener("programDefaultParametersFinished", resetListener);

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
      this.removePropertyListener("status", statusListener);
      this.removeMessageListener("rssi", rssiListener);
      this.removeMessageListener("batteryLevel", batteryLevelListener);
      this.removeMessageListener("rollState", rollStateListener);
      this.removeMessageListener("notifyUser", notifyUserListener);
      this.removeMessageListener("remoteAction", remoteActionListener);
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
   * Update Pixel info from an external source such as scanning data.
   * @param info The updated info.
   * @remarks
   * The info will be updated only if the die is disconnected.
   * Roll state and face index are updated only if both are provided.
   */
  updateInfo(info: Partial<Omit<PixelInfo, "systemId" | "currentFace">>): void {
    if (this.status === "disconnected" && this.pixelId === info.pixelId) {
      // Name
      if (info.name) {
        this._updateName(info.name);
      }
      // LED count
      if (info.ledCount && info.ledCount > 0 && !this.ledCount) {
        this._updateLedCount(info.ledCount);
      }
      // Colorway
      if (
        info.colorway &&
        info.colorway !== "unknown" &&
        this.colorway === "unknown"
      ) {
        this._updateColorway(info.colorway);
      }
      // Die type
      if (
        info.dieType &&
        info.dieType !== "unknown" &&
        this.dieType === "unknown"
      ) {
        this._updateDieType(info.dieType);
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
      // Roll
      if (
        info.rollState !== undefined &&
        info.currentFaceIndex !== undefined &&
        info.currentFaceIndex >= 0 &&
        info.currentFaceIndex < this.dieFaceCount
      ) {
        this._updateRoll(info.rollState, info.currentFaceIndex);
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
  async connect(timeoutMs = 0): Promise<Pixel> {
    await this._internalConnect(timeoutMs);
    return this;
  }

  /**
   * Immediately disconnects from the die.
   * @returns A promise that resolves once the disconnect request has been processed.
   **/
  async disconnect(): Promise<Pixel> {
    await this._internalDisconnect();
    return this;
  }

  /**
   * Registers a listener function that will be called when the specified
   * event is raised.
   * See {@link PixelEventMap} for the list of events and their
   * associated data.
   * @param type A case-sensitive string representing the event type to listen for.
   * @param listener The callback function.
   */
  addEventListener<K extends keyof PixelEventMap>(
    type: K,
    listener: EventReceiver<PixelEventMap[K]>
  ): void {
    this._evEmitter.addListener(type, listener);
  }

  /**
   * Unregisters a listener from receiving events identified by
   * the given event name.
   * See {@link PixelEventMap} for the list of events and their
   * associated data.
   * @param type A case-sensitive string representing the event type.
   * @param listener The callback function to unregister.
   */
  removeEventListener<K extends keyof PixelEventMap>(
    type: K,
    listener: EventReceiver<PixelEventMap[K]>
  ): void {
    this._evEmitter.removeListener(type, listener);
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
    // Check API version
    const fwVer = this._versions.firmwareVersion;
    if (fwVer > 0 && Constants.compatApiVersion > fwVer) {
      throw new PixelIncompatibleMessageError(
        this,
        this._serializer.getMessageType(msgOrType),
        Constants.compatApiVersion,
        fwVer,
        "library"
      );
    }
    const fwCompatVer = this._versions.compatStandardApiVersion;
    if (fwCompatVer > 0 && Constants.apiVersion < fwCompatVer) {
      throw new PixelIncompatibleMessageError(
        this,
        this._serializer.getMessageType(msgOrType),
        Constants.apiVersion,
        fwCompatVer,
        "firmware"
      );
    }
    await this._internalSendMessage(msgOrType, withoutAck);
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
    return await this._internalSendAndWaitForResponse(
      msgOrTypeToSend,
      responseType,
      timeoutMs
    );
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
    return await this._internalSendAndWaitForTypedResponse(
      msgOrTypeToSend,
      responseType,
      timeoutMs
    );
  }

  /**
   * Requests the Pixel to change its name.
   * @param name New name to assign to the Pixel. Must have at least one character.
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
    // Reset profile hash
    this._updateHash(Constants.factoryProfileHashes[this.dieType] ?? 0);
    // And notify name was successfully updated
    this._updateName(name);
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
   * Asynchronously gets the Pixel RSSI value.
   * @returns A promise revolving to a negative number representing the RSSI value.
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
   * Requests the Pixel to stop all currently playing animations.
   * @returns A promise.
   */
  async stopAllAnimations(): Promise<void> {
    await this.sendMessage("stopAllAnimations");
  }

  /**
   * Uploads the given data set of animations to the Pixel flash memory.
   * @param dataSet The data set to upload.
   * @returns A promise that resolves once the transfer has completed.
   */
  async transferDataSet(dataSet: Readonly<DataSet>): Promise<void> {
    if (this._transferProgress) {
      throw new PixelTransferInProgressError(this);
    }

    const data = dataSet.toByteArray();
    const hash = DataSet.computeHash(data);

    const prepareMsg = safeAssign(new TransferAnimationSet(), {
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
      brightness: dataSet.brightness,
    });

    // Transfer animations
    await this._programDataSet(
      async () => {
        const ack = await this.sendAndWaitForTypedResponse(
          prepareMsg,
          TransferAnimationSetAck
        );
        return ack.result
          ? TransferInstantAnimationsSetAckTypeValues.download
          : TransferInstantAnimationsSetAckTypeValues.noMemory;
      },
      "transferAnimationSetFinished",
      data
    );

    // Notify profile hash
    this._updateHash(hash);
  }

  /**
   * Plays the (single) LEDs animation included in the given data set.
   * @param dataSet The data set containing just one animation to play.
   * @returns A promise that resolves once the transfer has completed.
   */
  async playTestAnimation(dataSet: Readonly<DataSet>): Promise<void> {
    if (this._transferProgress) {
      throw new PixelTransferInProgressError(this);
    }
    if (!dataSet.animations.length) {
      throw new PixelTransferInvalidDataError(this);
    }

    // Gets the bytes to send
    const data = dataSet.toAnimationsByteArray();
    const hash = DataSet.computeHash(data);

    // Prepare the Pixel
    const prepareMsg = safeAssign(new TransferTestAnimationSet(), {
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

    // Transfer animations
    await this._programDataSet(
      async () => {
        const ack = await this.sendAndWaitForTypedResponse(
          prepareMsg,
          TransferTestAnimationSetAck
        );
        return ack.ackType;
      },
      "transferTestAnimationSetFinished",
      data
    );
  }

  /**
   * Uploads the given data set of animations to the Pixel RAM memory.
   * Those animations are lost when the Pixel goes to sleep, is turned off or is restarted.
   * @param dataSet The data set to upload.
   * @returns A promise that resolves once the transfer has completed.
   */
  async transferInstantAnimations(dataSet: Readonly<DataSet>): Promise<void> {
    if (this._transferProgress) {
      throw new PixelTransferInProgressError(this);
    }
    if (!dataSet.animations.length) {
      throw new PixelTransferInvalidDataError(this);
    }

    const data = dataSet.toAnimationsByteArray();
    const hash = DataSet.computeHash(data);

    // Preparation message
    const prepareMsg = safeAssign(new TransferInstantAnimationSet(), {
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

    // Transfer animations
    await this._programDataSet(
      async () => {
        const ack = await this.sendAndWaitForTypedResponse(
          prepareMsg,
          TransferInstantAnimationSetAck
        );
        return ack.ackType;
      },
      "transferInstantAnimationSetFinished",
      data
    );
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

  protected async _internalSetup(): Promise<void> {
    // Reset version numbers
    let verProp: keyof typeof this._versions;
    for (verProp in this._versions) {
      this._versions[verProp] = 0;
    }

    // Identify Pixel
    this._log("Waiting on identification message");
    const iAmADie = (await this.sendAndWaitForResponse(
      "whoAreYou",
      "iAmADie"
    )) as IAmADie | LegacyIAmADie;

    // Check Pixel id
    const pixelId =
      (iAmADie as LegacyIAmADie).pixelId ??
      (iAmADie as IAmADie).dieInfo?.pixelId;
    if (!pixelId) {
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
      info: Omit<LegacyIAmADie, "type" | "dataSetHash" | "availableFlashSize">
    ): void => {
      this._updateLedCount(info.ledCount);
      this._updateColorway(
        getValueKeyName(info.colorway, PixelColorwayValues) ?? "unknown"
      );
      const dieType =
        getValueKeyName(info.dieType, PixelDieTypeValues) ?? "unknown";
      this._updateDieType(
        dieType !== "unknown"
          ? dieType
          : // Try to guess the die type if we got "unknown" from the message
            DiceUtils.estimateDieType(this.ledCount)
      );
      this._updateFirmwareDate(1000 * info.buildTimestamp);
      this._updateBattery(
        info.batteryLevelPercent,
        isPixelChargingOrDone(info.batteryState)
      );
      this._updateRoll(
        getValueKeyName(info.rollState, PixelRollStateValues) ?? "unknown",
        info.currentFaceIndex,
        { skipEvents: true }
      );
    };

    if (iAmADie instanceof LegacyIAmADie) {
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

    // Notify profile hash
    const profileDataHash =
      (iAmADie as LegacyIAmADie).dataSetHash ??
      (iAmADie as IAmADie).settingsInfo.profileDataHash;
    this._updateHash(profileDataHash);
  }

  protected _internalDeserializeMessage(dataView: DataView): MessageOrType {
    let msgOrType: MessageOrType;
    if (
      dataView.byteLength &&
      dataView.getUint8(0) === MessageTypeValues.iAmADie &&
      dataView.byteLength !== LegacyIAmADie.expectedSize
    ) {
      const iAmADie = new IAmADie();
      deserializeChunkedMessage(
        dataView,
        // @ts-ignore Missing index signature for class 'IAmADie'.
        iAmADie,
        (msg) => this._warn(msg)
      );
      msgOrType = iAmADie;
    } else {
      msgOrType = this._serializer.deserializeMessage(dataView);
    }
    if (msgOrType) {
      // Notify
      this._evEmitter.emit("messageReceived", msgOrType);
    }
    return msgOrType;
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

  private _updateColorway(colorway: PixelColorway) {
    if (this._info.colorway !== colorway) {
      this._info.colorway = colorway;
      this.emitPropertyEvent("colorway");
    }
  }

  private _updateDieType(dieType: PixelDieType) {
    if (this._info.dieType !== dieType) {
      this._info.dieType = dieType;
      this.emitPropertyEvent("dieType");
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

  private _createRollEvent(
    state: PixelRollState,
    faceIndex: number
  ): RollEvent {
    if (this.dieType === "d4") {
      // TODO fix for D4 rolling as D6
      if (faceIndex === 1 || faceIndex === 4) {
        // Those faces are not valid for a D4, reuse last valid face instead
        faceIndex = DiceUtils.indexFromFace(
          this.currentFace > 0 ? this.currentFace : 1,
          "d4"
        );
        if (state === "onFace") {
          state = "crooked";
        }
      }
    }
    // Convert face index to face value
    const face = DiceUtils.faceFromIndex(faceIndex, this.dieType);
    return { state, face, faceIndex };
  }

  private _updateRoll(
    state: PixelRollState,
    faceIndex: number,
    opt?: { skipEvents?: boolean }
  ) {
    const ev = this._createRollEvent(state, faceIndex);
    const stateChanged = this._info.rollState !== ev.state;
    const indexChanged = this._info.currentFaceIndex !== ev.faceIndex;
    const faceChanged = this._info.currentFace !== ev.face;

    this._info.rollState = ev.state;
    this._info.currentFaceIndex = ev.faceIndex;
    this._info.currentFace = ev.face;

    if (stateChanged) {
      this.emitPropertyEvent("rollState");
    }
    if (indexChanged) {
      this.emitPropertyEvent("currentFaceIndex");
    }
    if (faceChanged) {
      this.emitPropertyEvent("currentFace");
    }

    // Notify all die roll events
    if (!opt?.skipEvents) {
      const emitRoll = ev.state === "onFace" ? ev.face : undefined;
      this._evEmitter.emit("rollState", ev);
      if (emitRoll !== undefined) {
        this._evEmitter.emit("roll", emitRoll);
      }
    }
  }

  private _updateHash(profileHash: number) {
    if (profileHash !== this._profileHash) {
      this._profileHash = profileHash;
      this.emitPropertyEvent("profileHash");
    }
  }

  private _updateTransferProgress(ev: PixelEventMap["dataTransfer"]) {
    // Update progress
    const progress =
      ev.type === "completed" || ev.type === "failed"
        ? undefined
        : ev.type === "progress"
          ? {
              progressPercent: ev.progressPercent,
              transferredBytes: ev.transferredBytes,
              totalBytes: ev.totalBytes,
            }
          : {
              progressPercent: 0,
              transferredBytes: 0,
              totalBytes: ev.totalBytes,
            };
    const progressChanged = this._transferProgress !== progress;
    this._transferProgress = progress;

    // Send events
    this._evEmitter.emit("dataTransfer", ev);
    if (progressChanged) {
      this.emitPropertyEvent("transferProgress");
    }
  }

  private async _programDataSet(
    prepareDie: () => Promise<number>,
    ackType: MessageType,
    data: Uint8Array
  ): Promise<void> {
    // Notify that we're starting
    this._updateTransferProgress({
      type: "preparing",
      totalBytes: data.byteLength,
    });

    let ackResult: number | undefined;
    try {
      ackResult = await prepareDie();
    } catch (error) {
      // Notify failed transfer
      this._updateTransferProgress({
        type: "failed",
        error: "timeout",
      });
      throw error;
    }

    // Handle the setup result
    switch (ackResult) {
      case TransferInstantAnimationsSetAckTypeValues.download:
        // Upload data
        this._log("Ready to receive animations of size " + data.byteLength);
        await this._uploadBulkDataWithAck(ackType, data);
        break;

      case TransferInstantAnimationsSetAckTypeValues.upToDate:
        // Nothing to do
        this._log("Animations are already up-to-date");
        // Notify no transfer
        this._updateTransferProgress({
          type: "completed",
          totalBytes: 0,
        });
        break;

      case TransferInstantAnimationsSetAckTypeValues.noMemory:
        // Not enough memory
        this._log(
          "Not enough memory to store animations of size " + data.byteLength
        );
        // Notify no transfer
        this._updateTransferProgress({
          type: "failed",
          error: "outOfMemory",
        });
        throw new PixelTransferOutOfMemoryError(this, data.byteLength);

      default: {
        const error = new PixelTransferError(
          this,
          `Got unknown transfer result: ${ackResult}`
        );
        // Notify failed transfer
        this._updateTransferProgress({
          type: "failed",
          error: "unknown",
        });
        throw error;
      }
    }
  }

  /**
   * Upload the given data to the Pixel.
   * @param ackType The expected confirmation message type.
   * @param data The data to send.
   * @returns A promise that resolves once the transfer has completed.
   */
  private async _uploadBulkDataWithAck(
    ackType: MessageType,
    data: ArrayBuffer
  ): Promise<void> {
    this._updateTransferProgress({
      type: "starting",
      totalBytes: data.byteLength,
    });

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
      await this._uploadBulkData(data);
      this._log(
        "Done sending dataset, waiting for Pixel to finish programming"
      );

      const promise = new Promise<void>((resolve, reject) => {
        if (programmingFinished) {
          // Programming may already be finished
          resolve();
        } else {
          const timeoutId = setTimeout(() => {
            reject(new PixelTransferCompletedTimeoutError(this, ackType));
          }, Constants.ackMessageTimeout);
          stopWaiting = () => {
            clearTimeout(timeoutId);
            resolve();
          };
        }
      });
      await promise;
      this._log("Programming done");

      this._updateTransferProgress({
        type: "completed",
        totalBytes: data.byteLength,
      });
    } catch (error) {
      // Notify failed transfer
      this._updateTransferProgress({
        type: "failed",
        error: "timeout",
      });
      throw error;
    } finally {
      this.removeMessageListener(ackType, onFinished);
    }
  }

  // Upload the given data to the Pixel
  private async _uploadBulkData(data: ArrayBuffer): Promise<void> {
    let remainingSize = data.byteLength;
    this._log(`Sending ${remainingSize} bytes of bulk data`);

    // Send setup message
    const setupMsg = new BulkSetup();
    setupMsg.size = remainingSize;
    await this.sendAndWaitForResponse(setupMsg, "bulkSetupAck");
    this._log("Ready for receiving data");

    this._updateTransferProgress({
      type: "progress",
      progressPercent: 0,
      transferredBytes: 0,
      totalBytes: data.byteLength,
    });

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
      const progress = Math.round((100 * offset) / data.byteLength);
      if (progress > lastProgress) {
        // Notify that we're starting
        this._updateTransferProgress({
          type: "progress",
          progressPercent: progress,
          transferredBytes: offset,
          totalBytes: data.byteLength,
        });
        lastProgress = progress;
      }
    }

    this._log("Finished sending bulk data");
  }
}
