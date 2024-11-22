import {
  AnimConstants,
  Color,
  Color32Utils,
  PixelColorway,
  PixelDieType,
} from "@systemic-games/pixels-core-animation";
import {
  createTypedEventEmitter,
  EventReceiver,
  Mutable,
  safeAssign,
} from "@systemic-games/pixels-core-utils";

import { deserializeChunkedMessage } from "./ChunkMessage";
import { Constants } from "./Constants";
import {
  Blink,
  MPCMessageOrType,
  MPCMessageType,
  MPCMessageTypeValues,
  IAmAMPC,
  LegacyIAmAMPC,
  RequestRssi,
  Rssi,
  serializer,
  SetName,
  VersionInfoChunk,
  SynchronizeTime,
  PlayAnimation,
  StopAnimation,
} from "./MPCMessages";
import {
  PixelConnect,
  PixelConnectMutableProps,
  PixelStatusEvent,
} from "./PixelConnect";
import { PixelInfo } from "./PixelInfo";
import { PixelMessage } from "./PixelMessage";
import { PixelRollState } from "./PixelRollState";
import { PixelSession } from "./PixelSession";
import { getDefaultPixelsDeviceName } from "./PixelsName";
import { TelemetryRequestModeValues } from "./TelemetryRequestMode";
import {
  PixelConnectError,
  PixelConnectIdMismatchError,
  PixelEmptyNameError,
  PixelIncompatibleMessageError,
} from "./errors";

/**
 * Event map for {@link MPC} class.
 * This is the list of supported events where the property name
 * is the event name and the property type the event data type.
 * Call {@link MPC.addEventListener} to subscribe to an event.
 * @category Pixels
 */
export type MPCEventMap = Readonly<{
  /** MPC status changed notification. */
  statusChanged: PixelStatusEvent;
  /** Message received notification. */
  messageReceived: MPCMessageOrType;
  /** Message send notification. */
  messageSend: MPCMessageOrType;
  /** Battery state changed notification. */
  battery: Readonly<{
    level: number; // Percentage
    isCharging: boolean;
  }>;
}>;

/**
 * The mutable properties of {@link MPC} not inherited from parent
 * class {@link PixelConnect}.
 * @category Pixels
 */
export type MPCOwnMutableProps = object;

/**
 * The mutable properties of {@link MPC}.
 * @category Pixels
 */
export type MPCMutableProps = PixelConnectMutableProps & MPCOwnMutableProps;

/**
 * Represents a Pixels Multi Purpose Controller (MPC).
 * Most of its methods require the instance to be connected to the MPC.
 * Call the {@link connect()} method to initiate a connection.
 *
 * Call {@link addEventListener} to get notified for rolls, connection and
 * disconnection events and more.
 *
 * Call {@link addPropertyListener} to get notified on property changes.
 *
 * @category Pixels
 */
export class MPC
  extends PixelConnect<
    MPCMutableProps,
    PixelConnectMutableProps & MPCOwnMutableProps,
    MPCMessageType
  >
  implements MPCOwnMutableProps
{
  // Our events emitter
  private readonly _evEmitter = createTypedEventEmitter<MPCEventMap>();

  // MPC data
  private readonly _info: Mutable<PixelInfo>;
  private readonly _versions: Omit<
    VersionInfoChunk,
    "chunkSize" | "buildTimestamp"
  >;

  // Clean-up
  private _disposeFunc: () => void;

  /** Device type is Pixels MPC. */
  readonly type = "mpc";

  /** Gets the unique id assigned by the system to the MPC Bluetooth peripheral. */
  get systemId(): string {
    return this._info.systemId;
  }

  /** Gets the unique Pixel id of the MPC, may be 0 until connected. */
  get pixelId(): number {
    return this._info.pixelId;
  }

  /** Gets the MPC name, may be empty until connected to device. */
  get name(): string {
    // The name from the session may be outdated
    return this._info.name.length
      ? this._info.name
      : (this.sessionDeviceName ?? "");
  }

  /** Gets the number of LEDs for the MPC, may be 0 until connected to device. */
  get ledCount(): number {
    return this._info.ledCount;
  }

  /** Always return "unknown". */
  get colorway(): PixelColorway {
    return "unknown";
  }

  /** Always return "unknown". */
  get dieType(): PixelDieType {
    return "unknown";
  }

  /** Gets the MPC firmware build date. */
  get firmwareDate(): Date {
    return this._info.firmwareDate;
  }

  /**
   * Gets the last RSSI value notified by the MPC.
   * @remarks Call {@link reportRssi()} to automatically update the RSSI value.
   */
  get rssi(): number {
    return this._info.rssi;
  }

  /**
   * Gets the MPC battery level (percentage).
   * @remarks This value is automatically updated when the die is connected.
   */
  get batteryLevel(): number {
    return this._info.batteryLevel;
  }

  /**
   * Gets whether the MPC battery is charging or not.
   * Returns 'true' if fully charged but still on charger.
   * @remarks This value is automatically updated when the die is connected.
   */
  get isCharging(): boolean {
    return this._info.isCharging;
  }

  /** Always return "unknown". */
  get rollState(): PixelRollState {
    return "unknown";
  }

  /** Always return "0". */
  get currentFace(): number {
    return 0;
  }

  /** Always return "0". */
  get currentFaceIndex(): number {
    return 0;
  }

  /**
   * Instantiates a MPC.
   * @param session The session used to communicate with the MPC.
   */
  constructor(
    session: PixelSession,
    // Static values
    info?: Partial<Pick<PixelInfo, "pixelId" | "ledCount" | "firmwareDate">>
  ) {
    super(serializer, session);
    this._info = {
      systemId: session.systemId,
      pixelId: info?.pixelId ?? 0,
      name: "",
      ledCount: info?.ledCount ?? 0,
      colorway: "unknown",
      dieType: "unknown",
      firmwareDate: info?.firmwareDate ?? new Date(0),
      rssi: 0,
      batteryLevel: 0,
      isCharging: false,
      rollState: "unknown",
      currentFace: 0,
      currentFaceIndex: 0,
    };
    this._versions = {
      firmwareVersion: 0,
      settingsVersion: 0,
      compatStandardApiVersion: 0,
      compatExtendedApiVersion: 0,
      compatManagementApiVersion: 0,
    };

    // Subscribe to instance status change
    const statusListener = ({ status }: MPCMutableProps) => {
      // Notify battery state
      if (status === "ready") {
        this._emitEvent("battery", {
          level: this._info.batteryLevel,
          isCharging: this._info.isCharging,
        });
        // We don't raise roll and roll state events as those should occur
        // only when the die is actually moved
      }
    };
    this.addPropertyListener("status", statusListener);

    // Subscribe to rssi messages and emit event
    const rssiListener = (msgOrType: MPCMessageOrType) => {
      this._updateRssi((msgOrType as Rssi).value);
    };
    this.addMessageListener("rssi", rssiListener);

    // Subscribe to battery messages and emit battery event
    // const batteryLevelListener = (msgOrType: MPCMessageOrType) => {
    //   const msg = msgOrType as BatteryLevel;
    //   this._updateBattery(msg.levelPercent, isPixelChargingOrDone(msg.state));
    // };
    // this.addMessageListener("batteryLevel", batteryLevelListener);

    // Reset profile hash & die name on "clear settings" and "program default" ack
    const resetListener = () => {
      // Reset name
      this._updateName(getDefaultPixelsDeviceName("mpc", this._info.pixelId));
    };
    this.addMessageListener("programDefaultParametersFinished", resetListener);

    // Unmount function
    this._disposeFunc = () => {
      this.removePropertyListener("status", statusListener);
      this.removeMessageListener("rssi", rssiListener);
      // this.removeMessageListener("batteryLevel", batteryLevelListener);
      this.removeMessageListener(
        "programDefaultParametersFinished",
        resetListener
      );
    };
  }

  protected _internalDispose(): void {
    // Unhook from events
    this._disposeFunc();
  }

  /**
   * Update MPC info from an external source such as scanning data.
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
  async connect(timeoutMs = 0): Promise<MPC> {
    await this._internalConnect(timeoutMs);
    return this;
  }

  /**
   * Immediately disconnects from the die.
   * @returns A promise that resolves once the disconnect request has been processed.
   **/
  async disconnect(): Promise<MPC> {
    await this._internalDisconnect();
    return this;
  }

  /**
   * Registers a listener function that will be called when the specified
   * event is raised.
   * See {@link MPCEventMap} for the list of events and their
   * associated data.
   * @param type A case-sensitive string representing the event type to listen for.
   * @param listener The callback function.
   */
  addEventListener<K extends keyof MPCEventMap>(
    type: K,
    listener: EventReceiver<MPCEventMap[K]>
  ): void {
    this._evEmitter.addListener(type, listener);
  }

  /**
   * Unregisters a listener from receiving events identified by
   * the given event name.
   * See {@link MPCEventMap} for the list of events and their
   * associated data.
   * @param type A case-sensitive string representing the event type.
   * @param listener The callback function to unregister.
   */
  removeEventListener<K extends keyof MPCEventMap>(
    type: K,
    listener: EventReceiver<MPCEventMap[K]>
  ): void {
    this._evEmitter.removeListener(type, listener);
  }

  /**
   * Sends a message to the MPC.
   * @param msgOrType Message with the data to send or just a message type.
   * @param withoutAck Whether to request a confirmation that the message was received.
   * @returns A promise that resolves once the message has been send.
   */
  async sendMessage(
    msgOrType: MPCMessageOrType,
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
    this._emitEvent("messageSend", msgOrType);
  }

  /**
   * Sends a message to the MPC and wait for a specific response.
   * @param msgOrTypeToSend Message with the data to send or just a message type.
   * @param responseType Expected response type.
   * @param timeoutMs Timeout in mill-seconds before aborting waiting for the response.
   * @returns A promise resolving to the response in the form of a message type or a message object.
   */
  async sendAndWaitForResponse(
    msgOrTypeToSend: MPCMessageOrType,
    responseType: MPCMessageType,
    timeoutMs: number = Constants.ackMessageTimeout
  ): Promise<MPCMessageOrType> {
    return await this._internalSendAndWaitForResponse(
      msgOrTypeToSend,
      responseType,
      timeoutMs
    );
  }

  /**
   * Sends a message to the MPC and wait for a specific response
   * which is returned casted to the expected type.
   * @param msgOrTypeToSend Message with the data to send or just a message type.
   * @param responseType Expected response class type.
   * @param responseType Expected response type.
   * @returns A promise resolving to a message object of the expected type.
   */
  async sendAndWaitForTypedResponse<T extends PixelMessage>(
    msgOrTypeToSend: MPCMessageOrType,
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
   * Requests the MPC to change its name.
   * @param name New name to assign to the MPC. Must have at least one character.
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
   * Requests the MPC to regularly send its measured RSSI value.
   * @param activate Whether to turn or turn off this feature.
   * @param minInterval The minimum time interval in milliseconds
   *                    between two RSSI updates.
   * @returns A promise that resolves once the message has been send.
   */
  async reportRssi(activate = true, minInterval = 5000): Promise<void> {
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
   * Asynchronously gets the MPC RSSI value.
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
   * Requests the MPC to blink and wait for a confirmation.
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

  async sync(targetTime: number, referenceTime: number): Promise<void> {
    await this.sendMessage(
      safeAssign(new SynchronizeTime(), {
        inThisManyMs: targetTime - Date.now(),
        itWillBeThisManyMs: referenceTime,
      })
    );
  }

  async playAnim(animIndex: number): Promise<void> {
    await this.sendMessage(
      safeAssign(new PlayAnimation(), {
        animation: animIndex,
      })
    );
  }

  async stopAnim(animIndex: number): Promise<void> {
    await this.sendMessage(
      safeAssign(new StopAnimation(), {
        animation: animIndex,
      })
    );
  }
  protected _onStatusChanged(ev: PixelStatusEvent): void {
    this._emitEvent("statusChanged", ev);
  }

  protected async _internalSetup(): Promise<void> {
    // Reset version numbers
    let verProp: keyof typeof this._versions;
    for (verProp in this._versions) {
      this._versions[verProp] = 0;
    }

    // Identify MPC
    this._log("Waiting on identification message");
    const iAmAMPC = (await this.sendAndWaitForResponse(
      "whoAreYou",
      "iAmAMPC"
    )) as IAmAMPC | LegacyIAmAMPC;

    // Check Pixel id
    const pixelId =
      (iAmAMPC as LegacyIAmAMPC).pixelId ??
      (iAmAMPC as IAmAMPC).chargerInfo?.pixelId;
    if (!pixelId) {
      const ledCount = (iAmAMPC as LegacyIAmAMPC).ledCount;
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
      info: Omit<LegacyIAmAMPC, "type" | "dataSetHash" | "availableFlashSize">
    ): void => {
      this._updateLedCount(info.ledCount);
      this._updateFirmwareDate(1000 * info.buildTimestamp);
      // this._updateBattery(
      //   info.batteryLevelPercent,
      //   isPixelChargingOrDone(info.batteryState)
      // );
    };

    if (iAmAMPC instanceof LegacyIAmAMPC) {
      // Update properties
      setProperties(iAmAMPC);

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
        ...iAmAMPC.chargerInfo,
        ...iAmAMPC.versionInfo,
        ...iAmAMPC.statusInfo,
      });

      // Store versions
      for (verProp in this._versions) {
        this._versions[verProp] = iAmAMPC.versionInfo[verProp];
      }

      // Update name
      this._updateName(iAmAMPC.dieName.name);
    }
  }

  protected _internalDeserializeMessage(dataView: DataView): MPCMessageOrType {
    let msgOrType: MPCMessageOrType;
    if (
      dataView.byteLength &&
      dataView.getUint8(0) === MPCMessageTypeValues.iAmAMPC &&
      dataView.byteLength !== LegacyIAmAMPC.expectedSize
    ) {
      const iAmAMPC = new IAmAMPC();
      deserializeChunkedMessage(
        dataView,
        // @ts-ignore Missing index signature for class 'IAmAMPC'.
        iAmAMPC,
        (msg) => this._warn(msg)
      );
      msgOrType = iAmAMPC;
    } else {
      msgOrType = this._serializer.deserializeMessage(dataView);
    }
    if (msgOrType) {
      // Notify
      this._emitEvent("messageReceived", msgOrType);
    }
    return msgOrType;
  }

  private _emitEvent<T extends keyof MPCEventMap>(
    name: T,
    ev: MPCEventMap[T]
  ): void {
    try {
      this._evEmitter.emit(name, ev);
    } catch (e) {
      console.error(
        this._tagLogString(`Uncaught error in "${name}" event listener: ${e}`)
      );
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
      this._emitEvent("battery", {
        level: level ?? this.batteryLevel,
        isCharging: isCharging ?? this.isCharging,
      });
    }
  }
}
