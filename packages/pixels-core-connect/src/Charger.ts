import {
  AnimConstants,
  Color,
  Color32Utils,
  DiceUtils,
  PixelColorway,
  PixelDieType,
} from "@systemic-games/pixels-core-animation";
import {
  createTypedEventEmitter,
  EventReceiver,
  Mutable,
  safeAssign,
  unsigned32ToHex,
} from "@systemic-games/pixels-core-utils";

import {
  BatteryLevel,
  Blink,
  ChargerMessageOrType,
  ChargerMessageType,
  ChargerMessageTypeValues,
  IAmALCC,
  LegacyIAmALCC,
  RequestRssi,
  Rssi,
  serializer,
  SetName,
  VersionInfoChunk,
} from "./ChargerMessages";
import { Constants } from "./Constants";
import { PixelConnect, PixelConnectMutableProps } from "./PixelConnect";
import { PixelInfo } from "./PixelInfo";
import { PixelMessage } from "./PixelMessage";
import { PixelRollState } from "./PixelRollState";
import { PixelSession } from "./PixelSession";
import { TelemetryRequestModeValues } from "./TelemetryRequestMode";
import {
  PixelConnectError,
  PixelConnectIdMismatchError,
  PixelEmptyNameError,
  PixelIncompatibleMessageError,
} from "./errors";
import { isPixelChargingOrDone } from "./isPixelChargingOrDone";

/**
 * Event map for {@link Charger} class.
 * This is the list of supported events where the property name
 * is the event name and the property type the event data type.
 * Call {@link Charger.addEventListener} to subscribe to an event.
 * @category Pixels
 */
export interface ChargerEventMap {
  /** Message received notification. */
  messageReceived: ChargerMessageOrType;
  /** Message send notification. */
  messageSend: ChargerMessageOrType;
  /** Battery state changed notification. */
  battery: Readonly<{
    level: number; // Percentage
    isCharging: boolean;
  }>;
}

/**
 * The mutable properties of {@link Charger} not inherited from parent
 * class {@link PixelConnect}.
 * @category Pixels
 */
export interface ChargerOwnMutableProps {}

/**
 * The mutable properties of {@link Charger}.
 * @category Pixels
 */
export type ChargerMutableProps = PixelConnectMutableProps &
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
  extends PixelConnect<
    ChargerMutableProps,
    PixelConnectMutableProps & ChargerOwnMutableProps,
    ChargerMessageType
  >
  implements ChargerOwnMutableProps
{
  // Our events emitter
  private readonly _evEmitter = createTypedEventEmitter<ChargerEventMap>();

  // Charger data
  private readonly _info: Mutable<PixelInfo>;
  private readonly _versions: Omit<
    VersionInfoChunk,
    "chunkSize" | "buildTimestamp"
  >;

  // Clean-up
  private _disposeFunc: () => void;

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
      : this.sessionDeviceName ?? "";
  }

  /** Gets the number of LEDs for the Charger, may be 0 until connected to device. */
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
   * Instantiates a Charger.
   * @param session The session used to communicate with the Charger.
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
    const statusListener = ({ status }: ChargerMutableProps) => {
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
    const rssiListener = (msgOrType: ChargerMessageOrType) => {
      this._updateRssi((msgOrType as Rssi).value);
    };
    this.addMessageListener("rssi", rssiListener);

    // Subscribe to battery messages and emit battery event
    const batteryLevelListener = (msgOrType: ChargerMessageOrType) => {
      const msg = msgOrType as BatteryLevel;
      this._updateBattery(msg.levelPercent, isPixelChargingOrDone(msg.state));
    };
    this.addMessageListener("batteryLevel", batteryLevelListener);

    // Reset profile hash & die name on "clear settings" and "program default" ack
    const resetListener = () => {
      // Reset name
      this._updateName("PxlLcc" + unsigned32ToHex(this._info.pixelId));
    };
    this.addMessageListener("programDefaultParametersFinished", resetListener);

    // Unmount function
    this._disposeFunc = () => {
      session.setConnectionEventListener(undefined);
      this.removePropertyListener("status", statusListener);
      this.removeMessageListener("rssi", rssiListener);
      this.removeMessageListener("batteryLevel", batteryLevelListener);
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
    await this._internalConnect(timeoutMs);
    return this;
  }

  /**
   * Immediately disconnects from the die.
   * @returns A promise that resolves once the disconnect request has been processed.
   **/
  async disconnect(): Promise<Charger> {
    await this._internalDisconnect();
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
   * Sends a message to the Charger.
   * @param msgOrType Message with the data to send or just a message type.
   * @param withoutAck Whether to request a confirmation that the message was received.
   * @returns A promise that resolves once the message has been send.
   */
  async sendMessage(
    msgOrType: ChargerMessageOrType,
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
   * Sends a message to the Charger and wait for a specific response.
   * @param msgOrTypeToSend Message with the data to send or just a message type.
   * @param responseType Expected response type.
   * @param timeoutMs Timeout in mill-seconds before aborting waiting for the response.
   * @returns A promise resolving to the response in the form of a message type or a message object.
   */
  async sendAndWaitForResponse(
    msgOrTypeToSend: ChargerMessageOrType,
    responseType: ChargerMessageType,
    timeoutMs: number = Constants.ackMessageTimeout
  ): Promise<ChargerMessageOrType> {
    return await this._internalSendAndWaitForResponse(
      msgOrTypeToSend,
      responseType,
      timeoutMs
    );
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
    msgOrTypeToSend: ChargerMessageOrType,
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
   * Asynchronously gets the Charger RSSI value.
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

  protected async _internalSetup(): Promise<void> {
    // Reset version numbers
    let verProp: keyof typeof this._versions;
    for (verProp in this._versions) {
      this._versions[verProp] = 0;
    }

    // Identify Charger
    this._log("Waiting on identification message");
    const iAmALCC = (await this.sendAndWaitForResponse(
      "whoAreYou",
      "iAmALCC"
    )) as IAmALCC | LegacyIAmALCC;

    // Check Pixel id
    const pixelId =
      (iAmALCC as LegacyIAmALCC).pixelId ??
      (iAmALCC as IAmALCC).chargerInfo?.pixelId;
    if (!pixelId) {
      const ledCount = (iAmALCC as LegacyIAmALCC).ledCount;
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

    if (iAmALCC instanceof LegacyIAmALCC) {
      // Update properties
      setProperties(iAmALCC);

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
        ...iAmALCC.chargerInfo,
        ...iAmALCC.versionInfo,
        ...iAmALCC.statusInfo,
      });

      // Store versions
      for (verProp in this._versions) {
        this._versions[verProp] = iAmALCC.versionInfo[verProp];
      }

      // Update name
      this._updateName(iAmALCC.dieName.name);
    }
  }

  protected _internalDeserializeMessage(
    dataView: DataView
  ): ChargerMessageOrType {
    let msgOrType: ChargerMessageOrType;
    if (
      dataView.byteLength &&
      dataView.getUint8(0) === ChargerMessageTypeValues.iAmALCC &&
      dataView.byteLength !== LegacyIAmALCC.expectedSize
    ) {
      const iAmALCC = new IAmALCC();
      this._deserializeChunkedMessage(
        dataView,
        // @ts-ignore Missing index signature for class 'IAmALCC'.
        iAmALCC
      );
      msgOrType = iAmALCC;
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
}
