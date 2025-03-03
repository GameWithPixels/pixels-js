import {
  createTypedEventEmitter,
  delay,
  EventReceiver,
  TypedEventEmitter,
} from "@systemic-games/pixels-core-utils";
import { NativeEventEmitter, EmitterSubscription } from "react-native";

import {
  AdvertisementData,
  BluetoothLE,
  BluetoothState,
  ConnectionEventReason,
  ConnectionStatus,
  Device,
} from "./BluetoothLE";
import { Constants } from "./Constants";
import * as Errors from "./errors";
import { BleEventMap } from "./events";
import { getNativeErrorCode } from "./getNativeErrorCode";
import { requestPermissions } from "./requestPermissions";

function toArray(strList?: string): string[] {
  return strList?.split(",") ?? [];
}

function getCharacteristicKey(
  serviceUuid: string,
  characteristicUuid: string,
  instanceIndex: number
): "valueChanged" {
  // We force the key to be of type "valueChanged" to simplify typing
  return `${serviceUuid}:${characteristicUuid}:${instanceIndex}` as "valueChanged";
}

function errToStr(error: unknown): string {
  if (!error) {
    return "No error";
  }
  const e = error as Error;
  const code = getNativeErrorCode(e);
  if (code) {
    return `${e.message ?? error} (${code})`;
  } else {
    return e.message ?? String(error);
  }
}

function toScanStartError(error: string): ScanStartErrorCode {
  switch (error) {
    case "ALREADY_STARTED":
      return "alreadyStarted";
    case "APPLICATION_REGISTRATION_FAILED":
      return "registrationFailed";
    case "FEATURE_UNSUPPORTED":
      return "unsupported";
    case "OUT_OF_HARDWARE_RESOURCES":
      return "outOfHardwareResources";
    default:
      return "internalError";
  }
}

/**
 * The possible statuses of the scanner.
 */
export type ScanStatus = "stopped" | "starting" | "scanning";

/**
 * Reason why the scan was stopped.
 */
export type ScanStopReason =
  | Exclude<BluetoothState, "ready">
  | "failedToStart"
  | "success"; // Scan was stopped by a call to stopScan() or shutdown()

/**
 * Possible errors that prevented the scan to start (Android only).
 */
export type ScanStartErrorCode =
  | "alreadyStarted"
  | "registrationFailed"
  | "internalError"
  | "unsupported"
  | "outOfHardwareResources";

/**
 * A scanned peripheral is BLE device and its advertisement data.
 */
export type ScannedPeripheral = Device &
  Readonly<{
    advertisementData: AdvertisementData;
  }>;

/**
 * Event map for {@link Central} class.
 * This is the list of supported events where the property name
 * is the event name and the property type the event data type.
 */
export type CentralEventMap = Readonly<{
  bluetoothState: { readonly state: BluetoothState };
  scanStatus: Readonly<{
    status: ScanStatus;
    stopReason?: ScanStopReason;
    startError?: ScanStartErrorCode; // Android only, for `failedToStart` stop reason
    context?: unknown;
  }>;
  scannedPeripheral: Readonly<{
    peripheral: ScannedPeripheral;
    context?: unknown;
  }>;
  peripheralConnectionStatus: Readonly<{
    peripheral: ScannedPeripheral;
    connectionStatus: ConnectionStatus;
    reason: ConnectionEventReason;
  }>;
}>;

/**
 * Event emitted when a peripheral characteristic value has changed.
 */
export type PeripheralCharacteristicValueChangedEvent = Readonly<{
  peripheral: ScannedPeripheral;
  service: string;
  characteristic: string;
  characteristicIndex: number;
  value: readonly number[]; // Array of bytes
}>;

export type PeripheralOrSystemId = ScannedPeripheral | string;

type PeripheralEventMap = Readonly<{
  connectionStatus: CentralEventMap["peripheralConnectionStatus"];
}>;

// Internal data about a peripheral
interface PeripheralInfo {
  scannedPeripheral: ScannedPeripheral;
  state: "disconnected" | "connecting" | "ready" | "disconnecting";
  requiredServices: string; // Comma separated list of required services
  evEmitter: TypedEventEmitter<PeripheralEventMap>;
  valueChangedCallbacks: Map<
    string,
    (ev: PeripheralCharacteristicValueChangedEvent) => void
  >;
}

// Our native event emitter and subscriptions
let _nativeEmitter: NativeEventEmitter | undefined;
let _bleStateSubs: EmitterSubscription | undefined;
let _connStatusSubs: EmitterSubscription | undefined;
let _valueChangedSubs: EmitterSubscription | undefined;
let _scanResultSubs: EmitterSubscription | undefined;

// Our event emitter
const _evEmitter = createTypedEventEmitter<CentralEventMap>();
_evEmitter.setMaxListeners(100); // We expect a lot of listeners

// Bluetooth state
let _bluetoothState: BluetoothState = "unknown";

// Scan status
let _scanStatus: ScanStatus = "stopped";

// Scan token to uniquely identify the current scan
let _scanToken: { context?: unknown } | undefined;

// Our list of discovered peripherals
const _peripherals = new Map<string, PeripheralInfo>();

function _getSystemId(peripheral: PeripheralOrSystemId): string {
  return typeof peripheral === "string" ? peripheral : peripheral.systemId;
}

function _getPeripheralInfo(peripheral: PeripheralOrSystemId): PeripheralInfo {
  const pInf = _peripherals.get(_getSystemId(peripheral));
  if (!pInf) {
    throw new Errors.UnknownPeripheralError(_getSystemId(peripheral));
  }
  return pInf;
}

function _addNativeListener<T extends keyof BleEventMap>(
  type: T,
  listener: (ev: BleEventMap[T]) => void
): EmitterSubscription {
  if (!_nativeEmitter) {
    throw new Errors.CentralNotInitializedError();
  }
  return _nativeEmitter.addListener(type, listener);
}

function _emitEvent(
  type: keyof CentralEventMap,
  ev: CentralEventMap[keyof CentralEventMap]
): void {
  try {
    _evEmitter.emit(type, ev);
  } catch (e) {
    console.error(
      `[BLE] Uncaught error in "${type}" event listener: ${errToStr(e)}`
    );
  }
}

function _emitPeripheralEvent(
  pInf: PeripheralInfo,
  type: keyof PeripheralEventMap,
  ev: PeripheralEventMap[keyof PeripheralEventMap]
): void {
  const name = pInf.scannedPeripheral.name;
  try {
    pInf.evEmitter.emit(type, ev);
  } catch (e) {
    console.error(
      `[BLE ${name}] Uncaught error in "${type}" event listener: ${errToStr(e)}`
    );
  }
}

function _updateBluetoothState(state: BluetoothState): void {
  if (_bluetoothState !== state) {
    console.log(`[BLE] Bluetooth state ${state} (was ${_bluetoothState})`);
    _bluetoothState = state;
    _emitEvent("bluetoothState", { state });
  }
  if (state !== "ready") {
    _updateScanStatus("stopped", state);
  }
}

function _updateScanStatus(
  status: ScanStatus,
  reason?: ScanStopReason,
  startError?: ScanStartErrorCode
): void {
  const context = _scanToken?.context;

  // Clear token and remove callback if scan is not running
  if (status === "stopped") {
    _scanToken = undefined;
    _scanResultSubs?.remove();
    _scanResultSubs = undefined;
  }

  // Update and notify
  if (_scanStatus !== status) {
    console.log(
      `[BLE] Scan status ${status}${reason ? `, reason ${reason}` : ""} (status was ${_scanStatus})`
    );

    _scanStatus = status;
    const stopReason = status !== "stopped" ? undefined : (reason ?? "success");
    _emitEvent("scanStatus", { status, stopReason, startError, context });
  }
}

function _updateConnectionStatus(
  pInf: PeripheralInfo,
  connectionStatus: ConnectionStatus,
  reason: ConnectionEventReason = "success"
): void {
  const prevState = pInf.state;
  if (connectionStatus === "connected") {
    // Connection status is "ready" once the MTU has been set
    pInf.state = "connecting";
  } else if (connectionStatus === "failedToConnect") {
    // We're not connected
    pInf.state = "disconnected";
  } else {
    pInf.state = connectionStatus;
  }
  if (prevState !== pInf.state) {
    const ev = {
      peripheral: pInf.scannedPeripheral,
      connectionStatus,
      reason,
    } as const;
    _emitEvent("peripheralConnectionStatus", ev);
    _emitPeripheralEvent(pInf, "connectionStatus", ev);
  }
}

async function _logServicesAndCharacteristicsAsync(
  peripheral: ScannedPeripheral
): Promise<void> {
  const { systemId, name } = peripheral;
  const services = await BluetoothLE.getDiscoveredServices(systemId);
  const logs: string[][] = [];
  await Promise.all(
    services.split(",").map(async (serviceUuid) => {
      const log = [` * service ${serviceUuid}:`];
      logs.push(log);
      // Get characteristics for the service
      const characteristics = await BluetoothLE.getServiceCharacteristics(
        systemId,
        serviceUuid
      );
      // And get characteristics properties
      await Promise.all(
        characteristics.split(",").map(async (uuid) => {
          const props = await BluetoothLE.getCharacteristicProperties(
            systemId,
            serviceUuid,
            uuid,
            0
          );
          log.push(`    - characteristic ${uuid} has properties = ${props}`);
        })
      );
    })
  );
  if (logs.length) {
    console.log(
      `[BLE ${name}] Enumerating services:\n${logs
        .map((l) => l.join("\n"))
        .join("\n")}`
    );
  } else {
    console.log(`[BLE ${name}] No service discovered`);
  }
}

export const Central = {
  // May be called multiple times
  initialize(): void {
    if (!_bleStateSubs) {
      if (!_nativeEmitter) {
        _nativeEmitter = new NativeEventEmitter(BluetoothLE);
      }

      // Listen to native Bluetooth state events
      _bleStateSubs = _addNativeListener("bluetoothState", ({ state }) =>
        _updateBluetoothState(state)
      );

      // Listen to native connection events
      _connStatusSubs = _addNativeListener(
        "connectionEvent",
        ({ device, connectionStatus, reason }) => {
          // Forward event
          const pInf = _peripherals.get(device.systemId);
          const name = device.name;
          if (pInf) {
            if (reason !== "success") {
              // Log reason for unexpected disconnection
              console.warn(
                `[BLE ${name}] Got connection status ${connectionStatus}` +
                  ` with reason ${reason} (state was ${pInf.state})`
              );
            }
            // The ready status is notified once the MTU has been set
            if (connectionStatus === "ready") {
              connectionStatus = "connected";
            }
            _updateConnectionStatus(pInf, connectionStatus, reason);
          } else {
            console.warn(
              `[BLE ${name}] Got connection status ${connectionStatus}` +
                " for unknown scanned peripheral"
            );
          }
        }
      );

      // Listen to native characteristic value changed events
      _valueChangedSubs = _addNativeListener(
        "characteristicValueChanged",
        ({ device, characteristic, data }) => {
          // Forward event
          const name = device.name;
          try {
            const pInf = _peripherals.get(device.systemId);
            if (pInf) {
              const onValueChanged = pInf.valueChangedCallbacks.get(
                getCharacteristicKey(
                  characteristic.serviceUuid,
                  characteristic.uuid,
                  characteristic.instanceIndex
                )
              );
              onValueChanged?.({
                peripheral: pInf.scannedPeripheral,
                service: characteristic.serviceUuid,
                characteristic: characteristic.uuid,
                characteristicIndex: characteristic.instanceIndex,
                value: data,
              });
            } else {
              console.warn(
                `[BLE ${name}] Got characteristic value changed for unknown scanned peripheral`
              );
            }
          } catch (error) {
            const e = errToStr(error);
            console.error(
              `[BLE ${name}] Uncaught error in Characteristic Value Changed event listener: ${e}`
            );
          }
        }
      );
      console.log("[BLE] Central has initialized");
    }
  },

  shutdown(): void {
    _bleStateSubs?.remove();
    _bleStateSubs = undefined;
    _connStatusSubs?.remove();
    _connStatusSubs = undefined;
    _valueChangedSubs?.remove();
    _valueChangedSubs = undefined;
    // Keep Bluetooth state unchanged
    _updateScanStatus("stopped"); // This will unsubscribes from native scan result
    BluetoothLE.stopScan().catch(() => {}); // Ignore any error
    _peripherals.clear();
    console.log("[BLE] Central has shutdown");
    // TODO _bleInit = false; BluetoothLE.bleShutdown();
  },

  isInitialized(): boolean {
    return !!_connStatusSubs;
  },

  // Last known Bluetooth state
  getBluetoothState(): BluetoothState {
    return _bluetoothState;
  },

  getScanStatus(): ScanStatus {
    return _scanStatus;
  },

  addListener<K extends keyof CentralEventMap>(
    type: K,
    listener: EventReceiver<CentralEventMap[K]>
  ): void {
    _evEmitter.addListener(type, listener);
  },

  removeListener<T extends keyof CentralEventMap>(
    type: T,
    listener: (ev: CentralEventMap[T]) => void
  ): void {
    _evEmitter.removeListener(type, listener);
  },

  addPeripheralConnectionListener(
    peripheral: PeripheralOrSystemId,
    listener: (ev: CentralEventMap["peripheralConnectionStatus"]) => void
  ): void {
    const pInf = _getPeripheralInfo(peripheral);
    if (pInf) {
      pInf.evEmitter.addListener("connectionStatus", listener);
    }
  },

  removePeripheralConnectionListener(
    peripheral: PeripheralOrSystemId,
    listener: (ev: CentralEventMap["peripheralConnectionStatus"]) => void
  ): void {
    const pInf = _getPeripheralInfo(peripheral);
    if (pInf) {
      pInf.evEmitter.removeListener("connectionStatus", listener);
    }
  },

  // Only one scan can be active at a time, and it must be stopped
  // before starting a new one.
  // ScanStartFailed error is thrown if the scan failed to start
  // after switching to "starting" scan status (meaning it will
  // switch back to "stopped" status and give a stop reason).
  // On Android, BLE scanning will fail without error when started
  // more than 5 times over the last 30 seconds.
  // Peripheral advertising at least one of the services will be reported.
  // Notify for all peripherals if the list is undefined or empty.
  async startScan(
    services?: string | readonly string[],
    context?: unknown
  ): Promise<void> {
    if (!_nativeEmitter) {
      throw new Errors.CentralNotInitializedError();
    }

    // Only one scan at a time
    if (_scanStatus !== "stopped") {
      throw new Errors.ScanAlreadyInProgressError();
    }

    // Generate token to uniquely identify this scan
    const token = { context };
    _scanToken = token;

    // Throw if this scan was stopped
    const checkActive = () => {
      if (token !== _scanToken) {
        throw _bluetoothState === "ready"
          ? // In rare edge case where several Bluetooth state changes occurred
            // before we had chance to run this code or if the scan failed to start
            // for some other reason
            new Errors.ScanStartError(_bluetoothState)
          : _bluetoothState === "unauthorized"
            ? new Errors.BluetoothNotAuthorizedError()
            : new Errors.BluetoothUnavailableError(_bluetoothState);
      }
    };

    // Notify scan is starting
    _updateScanStatus("starting");

    // TODO move this to Android native implementation of bleInitialize()
    // Ask for permissions (on iOS this is done implicitly on starting Bluetooth)
    if (!(await requestPermissions())) {
      _updateBluetoothState("unauthorized");
      throw new Errors.BluetoothNotAuthorizedError();
    }

    // Check if Bluetooth is ready
    if (_bluetoothState === "unknown") {
      // Bluetooth native has not yet been initialized
      // Note: the native initialization asks permission to the user on iOS
      //       => we don't initialize before the first scan so to not
      //          prematurely ask for permission
      console.log("[BLE] Waiting on Bluetooth to initialize...");
      await new Promise<void>((resolve, reject) => {
        const subs = _addNativeListener("bluetoothState", () => {
          subs?.remove();
          resolve();
        });
        // This call will update the Bluetooth state which cancels the scan
        // if Bluetooth is not ready.
        // The Bluetooth state is left to "unknown" so we get an error
        BluetoothLE.bleInitialize().catch(reject);
      });
    } else if (_bluetoothState !== "ready" && token === _scanToken) {
      // Update scan status if Bluetooth is not ready
      _updateScanStatus("stopped", _bluetoothState);
    }

    // Make sure we are still the active scan
    checkActive();

    // Requested services
    const servicesArray = !services?.length
      ? []
      : typeof services === "string"
        ? [services]
        : [...services];
    const servicesStr = servicesArray.join(",");

    // Listen to native scan events
    _scanResultSubs?.remove();
    _scanResultSubs = _addNativeListener("scanResult", (ev) => {
      if ("error" in ev) {
        // Scan failed to start, Android only
        console.warn(`[BLE] Scan failed to start with error ${ev.error}`);
        _updateScanStatus(
          "stopped",
          "failedToStart",
          toScanStartError(ev.error)
        );
      } else if (_scanStatus !== "stopped") {
        // Forward event
        const peripheral = {
          ...ev.device,
          advertisementData: ev.advertisementData,
        };
        const name = ev.device.name;
        const pInf = _peripherals.get(ev.device.systemId);
        const requiredServices = servicesArray
          .filter((s) => ev.advertisementData.services?.includes(s))
          ?.join(",");
        if (servicesArray.length && !requiredServices.length) {
          console.warn(
            `[BLE ${name}] Reported services ${ev.advertisementData.services?.join(",") ?? ""} do not include any of the requested services`
          );
        }
        if (pInf) {
          pInf.scannedPeripheral = peripheral;
          pInf.requiredServices = requiredServices;
          // Note: don't change state as the peripheral might be in the process of being connected
        } else {
          _peripherals.set(ev.device.systemId, {
            scannedPeripheral: peripheral,
            state: "disconnected",
            requiredServices,
            evEmitter: createTypedEventEmitter(),
            valueChangedCallbacks: new Map(),
          });
        }
        _emitEvent("scannedPeripheral", { peripheral, context });
      } else {
        console.warn(
          `[BLE] Dropping scan result for device ${ev.device.name} because scan status is ${_scanStatus}`
        );
      }
    });

    // Start scan
    try {
      await BluetoothLE.startScan(servicesStr);
    } catch (e) {
      // Failed to start scan
      const message = (e as Error)?.message;
      console.log(`[BLE] Error starting scan: ${message ?? String(e)}`);
      // iOS error thrown by the native code
      const notPoweredOn = message === "Bluetooth not in powered on state";
      // Check what error we got from Android, they are not documented...
      const unavailable =
        message === "BT le scanner not available" ||
        message === "BT Adapter is not turned ON";
      const unauthorized = message.startsWith("Need android.permission");
      // Infer state from error
      const bleState: BluetoothState = notPoweredOn
        ? _bluetoothState // State is already updated on iOS
        : unavailable
          ? "off"
          : unauthorized
            ? "unauthorized"
            : "resetting"; // Fallback state, we don't really know whats going on
      _updateBluetoothState(bleState);
    }

    // Make sure we are still the active scan
    checkActive();

    console.log(
      `[BLE] Started scan for BLE peripherals with ${
        servicesStr.length ? `service(s) ${servicesStr}` : "no specific service"
      }`
    );

    // Notify scan started
    _updateScanStatus("scanning");
  },

  async stopScan(): Promise<void> {
    // Remove native subscription right away so we don't process
    // any incoming scan results
    _scanResultSubs?.remove();
    _scanResultSubs = undefined;
    // Stop scan
    _updateScanStatus("stopped");
    await BluetoothLE.stopScan();
  },

  // Not by default Android times out at 30s
  async connectPeripheral(
    peripheral: PeripheralOrSystemId,
    timeoutMs = 0 // In ms
  ): Promise<void> {
    const pInf = _getPeripheralInfo(peripheral);
    const name = pInf.scannedPeripheral.name;

    console.log(
      `[BLE ${name}] Connecting with ${timeoutMs ? `${timeoutMs}ms timeout` : "no timeout"}` +
        `, (state was ${pInf.state})`
    );

    // Update connection status if not already connecting/connected
    if (pInf.state === "disconnected") {
      _updateConnectionStatus(pInf, "connecting");
    }

    try {
      // Create peripheral
      // TODO move this into the native implementation of connectPeripheral
      const sysId = _getSystemId(peripheral);
      if (!(await BluetoothLE.createPeripheral(sysId))) {
        // Update connection status if we were still in connecting state
        // TODO another connection request might have been made in the meantime
        //      in which case we shouldn't change the status
        if (pInf.state === "connecting") {
          _updateConnectionStatus(pInf, "disconnected");
        }
        throw new Errors.ConnectError(name, "createFailed");
      }

      // Connect to peripheral
      await BluetoothLE.connectPeripheral(
        sysId,
        pInf.requiredServices,
        timeoutMs
      );

      // Set MTU
      console.log(`[BLE ${name}] Connected, updating MTU`);
      let mtuError: unknown;
      try {
        const mtu = await BluetoothLE.requestPeripheralMtu(
          sysId,
          Constants.maxMtu
        );
        console.log(`[BLE ${name}] MTU set to ${mtu}`);
      } catch (error) {
        // Could not set MTU, try to read the value
        if (getNativeErrorCode(error) === "ERROR_GATT_INVALID_PDU") {
          // MTU has already been set in this session
          try {
            const mtu = await BluetoothLE.getPeripheralMtu(sysId);
            console.warn(`[BLE ${name}] MTU previously set to ${mtu}`);
          } catch (e) {
            mtuError = e;
          }
        } else {
          mtuError = error;
        }
        if (mtuError) {
          // Give a chance to pending native events for being processed
          // so the connection status is updated
          await delay(0);
        }
      }

      // Continue if there wasn't any state change since we got connected
      // Note: always notify the ready state so a new status listener gets
      //       the notification even if it was already in the ready state
      if (pInf.state === "connecting" || pInf.state === "ready") {
        // Log services and characteristics
        // await _logServicesAndCharacteristicsAsync(pInf.scannedPeripheral);

        // And finally set state to "ready"
        // We always notify the ready state so a new status listener gets
        // the notification even if it was already in the ready state
        _updateConnectionStatus(pInf, "ready");
      } else {
        throw (
          (mtuError as Error) ?? new Errors.ConnectError(name, "disconnected")
        );
      }
    } catch (error) {
      // Log error
      console.log(`[BLE ${name}] Connection error: ${errToStr(error)}`);
      // Get error code and throw a more specific error
      const code = getNativeErrorCode(error);
      switch (code) {
        case "ERROR_DEVICE_DISCONNECTED":
          throw new Errors.ConnectError(name, "disconnected");
        case "ERROR_TIMEOUT":
          throw new Errors.ConnectError(name, "timeout");
        case "ERROR_CANCELLED":
          throw new Errors.ConnectError(name, "cancelled");
        case "ERROR_GATT_FAILURE":
        // We usually get this error when we've reached the maximum number of connections
        // eslint-disable-next-line no-fallthrough
        case "ERROR_GATT_ERROR":
          // We also get this error
          throw new Errors.ConnectError(name, "gattError");
        case "ERROR_BLUETOOTH_DISABLED":
          if (pInf.state === "connecting") {
            // If BLE is off on initiating connection, we get here without
            // the native code ever switching to connecting and disconnected
            _updateConnectionStatus(pInf, "disconnected");
          }
          throw new Errors.ConnectError(name, "bluetoothUnavailable");
        case "ERROR_UNKNOWN_PERIPHERAL":
          throw new Errors.UnknownPeripheralError(_getSystemId(peripheral));
        default:
          throw code ? new Errors.ConnectError(name, "error", code) : error;
      }
    }
  },

  async disconnectPeripheral(peripheral: PeripheralOrSystemId): Promise<void> {
    const pInf = _getPeripheralInfo(peripheral);
    const name = pInf.scannedPeripheral.name;
    console.log(`[BLE ${name}] Disconnecting, state was ${pInf.state}`);
    try {
      await BluetoothLE.disconnectPeripheral(pInf.scannedPeripheral.systemId);
    } catch (error: any) {
      // Getting an exception from native code:
      // - on Android when disconnecting while already disconnected
      // - on iOS when having multiple disconnects in a row (the last one cancels the previous)
      if (
        error.message !== "Peripheral not in required state to disconnect" &&
        error.message !== "Request canceled"
      ) {
        throw error;
      }
      // Those errors should only happen when we are already disconnecting/disconnected
      if (pInf.state !== "disconnecting" && pInf.state !== "disconnected") {
        console.warn(
          `[BLE ${name}] Got exception when disconnecting while in state ${pInf.state}: ${errToStr(error)}`
        );
      }
    }
  },

  async releasePeripheral(peripheral: PeripheralOrSystemId): Promise<void> {
    const pInf = _getPeripheralInfo(peripheral);
    await BluetoothLE.releasePeripheral(pInf.scannedPeripheral.systemId);
  },

  async getPeripheralName(peripheral: PeripheralOrSystemId): Promise<string> {
    return await BluetoothLE.getPeripheralName(_getSystemId(peripheral));
  },

  async getPeripheralMtu(peripheral: PeripheralOrSystemId): Promise<number> {
    return await BluetoothLE.getPeripheralMtu(_getSystemId(peripheral));
  },

  async readPeripheralRssi(
    peripheral: PeripheralOrSystemId,
    _timeoutMs = Constants.defaultRequestTimeout // TODO unused
  ): Promise<number> {
    return await BluetoothLE.readPeripheralRssi(_getSystemId(peripheral));
  },

  async getDiscoveredServices(
    peripheral: PeripheralOrSystemId
  ): Promise<string[]> {
    return toArray(
      await BluetoothLE.getDiscoveredServices(_getSystemId(peripheral))
    );
  },

  async getServiceCharacteristics(
    peripheral: PeripheralOrSystemId,
    serviceUuid: string
  ): Promise<string[]> {
    return toArray(
      await BluetoothLE.getServiceCharacteristics(
        _getSystemId(peripheral),
        serviceUuid
      )
    );
  },

  async getCharacteristicProperties(
    peripheral: PeripheralOrSystemId,
    serviceUuid: string,
    characteristicUuid: string,
    instanceIndex = 0
  ): Promise<number> {
    return await BluetoothLE.getCharacteristicProperties(
      _getSystemId(peripheral),
      serviceUuid,
      characteristicUuid,
      instanceIndex
    );
  },

  async readCharacteristic(
    peripheral: PeripheralOrSystemId,
    serviceUuid: string,
    characteristicUuid: string,
    options?: {
      instanceIndex?: number;
      timeoutMs?: number; // TODO unused => Constants.defaultRequestTimeout
    }
  ): Promise<Uint8Array> {
    return new Uint8Array(
      (await BluetoothLE.readCharacteristic(
        _getSystemId(peripheral),
        serviceUuid,
        characteristicUuid,
        options?.instanceIndex ?? 0
      )) ?? []
    );
  },

  async writeCharacteristic(
    peripheral: PeripheralOrSystemId,
    serviceUuid: string,
    characteristicUuid: string,
    data: ArrayBuffer,
    options?: {
      withoutResponse?: boolean;
      instanceIndex?: number;
      timeoutMs?: number; // TODO unused => Constants.defaultRequestTimeout
    }
  ): Promise<void> {
    await BluetoothLE.writeCharacteristic(
      _getSystemId(peripheral),
      serviceUuid,
      characteristicUuid,
      options?.instanceIndex ?? 0,
      [...new Uint8Array(data)],
      options?.withoutResponse ?? false
    );
  },

  // Notes:
  // Only one subscription (a new subscription will replace the previous one)
  // Will be unsubscribed on disconnect
  async subscribeCharacteristic(
    peripheral: PeripheralOrSystemId,
    serviceUuid: string,
    characteristicUuid: string,
    onValueChanged: (ev: PeripheralCharacteristicValueChangedEvent) => void,
    options?: {
      instanceIndex?: number;
      timeoutMs?: number; // TODO unused => Constants.defaultRequestTimeout
    }
  ): Promise<void> {
    const pInf = _getPeripheralInfo(peripheral);
    await BluetoothLE.subscribeCharacteristic(
      _getSystemId(peripheral),
      serviceUuid,
      characteristicUuid,
      options?.instanceIndex ?? 0
    );
    const key = getCharacteristicKey(
      serviceUuid,
      characteristicUuid,
      options?.instanceIndex ?? 0
    );
    pInf.valueChangedCallbacks.set(key, onValueChanged);
  },

  async unsubscribeCharacteristic(
    peripheral: PeripheralOrSystemId,
    serviceUuid: string,
    characteristicUuid: string,
    options?: {
      instanceIndex?: number;
      timeoutMs?: number; // TODO unused => Constants.defaultRequestTimeout
    }
  ): Promise<void> {
    const pInf = _getPeripheralInfo(peripheral);
    const key = getCharacteristicKey(
      serviceUuid,
      characteristicUuid,
      options?.instanceIndex ?? 0
    );
    pInf.valueChangedCallbacks.delete(key);
    await BluetoothLE.unsubscribeCharacteristic(
      _getSystemId(peripheral),
      serviceUuid,
      characteristicUuid,
      options?.instanceIndex ?? 0
    );
  },
} as const;
