import {
  createTypedEventEmitter,
  EventReceiver,
  TypedEventEmitter,
} from "@systemic-games/pixels-core-utils";
import { NativeEventEmitter, EmitterSubscription } from "react-native";

import {
  AdvertisementData,
  BluetoothLE,
  ConnectionStatus,
  Device,
} from "./BluetoothLE";
import { Constants } from "./Constants";
import * as Errors from "./errors";
import { BleEventMap, BluetoothState, ConnectionEventReason } from "./events";
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

export type BluetoothStateEvent = Readonly<{
  state: BluetoothState;
}>;

export type ScanStatus = "stopped" | "starting" | "scanning";

export type ScanStopReason =
  | Exclude<BluetoothState, "ready">
  | "failedToStart"
  | "success"; // Scan was stopped by a call to stopScan() or shutdown()

export type ScanStatusEvent = Readonly<{
  status: ScanStatus;
  stopReason?: ScanStopReason;
  context?: unknown;
}>;

// A scanned peripheral is BLE device and its advertisement data
export type ScannedPeripheral = Device &
  Readonly<{
    advertisementData: AdvertisementData;
  }>;

export type ScannedPeripheralEvent = Readonly<{
  peripheral: ScannedPeripheral;
  context?: unknown;
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

export type CharacteristicValueChangedEvent = Readonly<{
  peripheral: ScannedPeripheral;
  service: string;
  characteristic: string;
  characteristicIndex: number;
  value: readonly number[]; // Array of bytes
}>;

export type PeripheralOrSystemId = ScannedPeripheral | string;

type PeripheralEventMap = Readonly<{
  connectionStatus: CentralEventMap["peripheralConnectionStatus"];
  valueChanged: CharacteristicValueChangedEvent;
}>;

// Internal data about a peripheral
interface PeripheralInfo {
  scannedPeripheral: ScannedPeripheral;
  state: "disconnected" | "connecting" | "ready" | "disconnecting";
  requiredServices: string; // Comma separated list of required services
  evEmitter: TypedEventEmitter<PeripheralEventMap>;
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
    console.log(
      `[BLE] Bluetooth state changed from ${_bluetoothState} to ${state}`
    );
    _bluetoothState = state;
    _emitEvent("bluetoothState", { state });
  }
  if (state !== "ready") {
    _updateScanStatus("stopped", state);
  }
}

function _updateScanStatus(status: ScanStatus, reason?: ScanStopReason): void {
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
      `[BLE] Scan status changed from ${_scanStatus} to ${status}${
        reason ? ` with reason: ${reason}` : ""
      }`
    );

    _scanStatus = status;
    const stopReason = status !== "stopped" ? undefined : reason ?? "success";
    _emitEvent("scanStatus", {
      status,
      stopReason,
      context,
    });
  }
}

function _notifyConnectionStatus(
  pInf: PeripheralInfo,
  connectionStatus: ConnectionStatus,
  reason: ConnectionEventReason = "success"
): void {
  const ev = {
    peripheral: pInf.scannedPeripheral,
    connectionStatus,
    reason,
  } as const;
  _emitEvent("peripheralConnectionStatus", ev);
  _emitPeripheralEvent(pInf, "connectionStatus", ev);
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
              console.log(
                `[BLE ${name}] Got connection status ${connectionStatus}` +
                  ` with reason: ${reason}`
              );
            }
            switch (connectionStatus) {
              case "connecting":
              case "disconnecting":
                pInf.state = connectionStatus;
                break;
              case "disconnected":
                // Warn of disconnection without getting a "disconnecting" first
                if (pInf.state === "ready") {
                  console.log(
                    `[BLE ${name}] Unexpected immediate disconnection, last known state is ${pInf.state}`
                  );
                }
                pInf.state = connectionStatus;
                break;
              case "failedToConnect":
                pInf.state = "disconnected";
                break;
              case "connected":
              case "ready":
                pInf.state = "connecting";
                break;
            }
            if (connectionStatus !== "ready") {
              // The ready status is notified once the MTU has been changed
              _notifyConnectionStatus(pInf, connectionStatus, reason);
            }
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
          try {
            // Forward event
            const pInf = _peripherals.get(device.systemId);
            const name = device.name;
            if (pInf) {
              _emitPeripheralEvent(
                pInf,
                getCharacteristicKey(
                  characteristic.serviceUuid,
                  characteristic.uuid,
                  characteristic.instanceIndex
                ),
                {
                  peripheral: pInf.scannedPeripheral,
                  service: characteristic.serviceUuid,
                  characteristic: characteristic.uuid,
                  characteristicIndex: characteristic.instanceIndex,
                  value: data,
                }
              );
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
  // Devices supporting at least one of the services will be reported.
  async startScan(
    services: string | readonly string[],
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
            new Errors.ScanStartFailed(_bluetoothState)
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
    const servicesArray =
      services === ""
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
        console.warn(`[BLE] Scan failed: ${ev.error}`);
        _updateScanStatus("stopped", "failedToStart");
      } else {
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
          });
        }
        _emitEvent("scannedPeripheral", { peripheral, context });
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
      `[BLE ${name}] Connecting with ` +
        `${timeoutMs ? `timeout of ${timeoutMs}ms` : "no timeout"},` +
        ` last known state is ${pInf.state}`
    );

    try {
      const sysId = _getSystemId(peripheral);
      if (!(await BluetoothLE.createPeripheral(sysId))) {
        throw new Errors.ConnectError(name, "createFailed");
      }

      // TODO timeout should be handled by the native code, so we get the correct reason on the disconnection event
      let hasTimedOut = false;
      const timeoutId =
        timeoutMs > 0 &&
        setTimeout(() => {
          // Disconnect on timeout
          console.log(
            `[BLE ${name}] Connection timed-out after ${timeoutMs}ms`
          );
          hasTimedOut = true;
          Central.disconnectPeripheral(peripheral).catch((e) => {
            // Ignore error if we are disconnected as requested
            if (pInf.state !== "disconnected") {
              console.warn(
                `[BLE ${name}] Failed to disconnect on connection timeout: ${e}`
              );
            }
          });
        }, timeoutMs);

      try {
        // Connect to peripheral
        await BluetoothLE.connectPeripheral(sysId, pInf.requiredServices);

        // Stop connection timeout, assumes setting MTU will be quick
        timeoutId && clearTimeout(timeoutId);

        // Set MTU
        console.log(`[BLE ${name}] Connected, updating MTU`);
        let mtu = 0;
        try {
          mtu = await BluetoothLE.requestPeripheralMtu(sysId, Constants.maxMtu);
        } catch (error) {
          if (getNativeErrorCode(error) === "ERROR_GATT_INVALID_PDU") {
            // MTU has already been set in this session
            try {
              mtu = await BluetoothLE.getPeripheralMtu(sysId);
            } catch {}
          } else {
            console.log(
              `[BLE ${name}] Updating MTU failed (current value is ${mtu})`
            );
            throw error;
          }
        }
        console.log(`[BLE ${name}] MTU set to ${mtu}`);

        // Continue if there wasn't any state change since we got connected
        // Note: always notify the ready state so a new status listener gets
        //       the notification even if it was already in the ready state
        if (pInf.state === "connecting" || pInf.state === "ready") {
          // Log services and characteristics
          // const services = await BluetoothLE.getDiscoveredServices(sysId);
          // const logs: string[][] = [];
          // await Promise.all(
          //   services.split(",").map(async (serviceUuid) => {
          //     const log = [` * service ${serviceUuid}:`];
          //     logs.push(log);
          //     // Get characteristics for the service
          //     const characteristics =
          //       await BluetoothLE.getServiceCharacteristics(sysId, serviceUuid);
          //     // And get characteristics properties
          //     await Promise.all(
          //       characteristics.split(",").map(async (uuid) => {
          //         const props = await BluetoothLE.getCharacteristicProperties(
          //           sysId,
          //           serviceUuid,
          //           uuid,
          //           0
          //         );
          //         log.push(
          //           `    - characteristic ${uuid} has properties = ${props}`
          //         );
          //       })
          //     );
          //   })
          // );
          // if (logs.length) {
          //   console.log(
          //     `[BLE ${name}] Enumerating services:\n${logs
          //       .map((l) => l.join("\n"))
          //       .join("\n")}`
          //   );
          // } else {
          //   console.log(`[BLE ${name}] No service discovered`);
          // }

          // And finally set state to "ready"
          pInf.state = "ready";
          _notifyConnectionStatus(pInf, "ready");
        } else {
          throw new Errors.ConnectError(name, "disconnected");
        }
      } catch (error) {
        // Stop connection timeout
        timeoutId && clearTimeout(timeoutId);

        // Check if error was (likely) caused by the connection timeout
        if (hasTimedOut) {
          throw new Errors.ConnectError(name, "timeout");
        } else {
          try {
            await Central.disconnectPeripheral(peripheral);
          } catch (error) {
            console.warn(
              `[BLE ${name}] Error trying to disconnect after failing to connect: ${errToStr(
                error
              )}`
            );
          }
          if (getNativeErrorCode(error) === "ERROR_BLUETOOTH_DISABLED") {
            throw new Errors.ConnectError(name, "bluetoothUnavailable");
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      // Log error
      console.log(
        `[BLE ${name}] Error connecting to peripheral: ${errToStr(error)}`
      );
      const code = getNativeErrorCode(error);
      switch (code) {
        case "ERROR_DEVICE_DISCONNECTED":
          throw new Errors.ConnectError(name, "disconnected");
        case "ERROR_TIMEOUT":
          throw new Errors.ConnectError(name, "timeout");
        case "ERROR_CANCELLED":
          throw new Errors.ConnectError(name, "cancelled");
        case "ERROR_BLUETOOTH_DISABLED":
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
    console.log(
      `[BLE ${name}] Disconnecting, last known state is ${pInf.state}`
    );
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
          `[BLE ${name}] Got exception when disconnecting while in state ${pInf.state}`
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

  async subscribeCharacteristic(
    peripheral: PeripheralOrSystemId,
    serviceUuid: string,
    characteristicUuid: string,
    onValueChanged: (ev: CharacteristicValueChangedEvent) => void,
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
    pInf.evEmitter.addListener(key, onValueChanged);
  },

  async unsubscribeCharacteristic(
    peripheral: PeripheralOrSystemId,
    serviceUuid: string,
    characteristicUuid: string,
    onValueChanged: (ev: CharacteristicValueChangedEvent) => void,
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
    pInf.evEmitter.removeListener(key, onValueChanged);
    await BluetoothLE.unsubscribeCharacteristic(
      _getSystemId(peripheral),
      serviceUuid,
      characteristicUuid,
      options?.instanceIndex ?? 0
    );
  },
} as const;
