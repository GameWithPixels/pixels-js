import {
  createTypedEventEmitter,
  delay,
} from "@systemic-games/pixels-core-utils";
import { NativeEventEmitter, EmitterSubscription } from "react-native";

import {
  AdvertisementData,
  BluetoothLE,
  ConnectionStatus,
  Device,
} from "./BluetoothLE";
import { Constants } from "./Constants";
import { PeripheralInfo } from "./PeripheralInfo";
import * as Errors from "./errors";
import { BleEventMap, BluetoothState, ConnectionEventReason } from "./events";
import { getNativeErrorCode } from "./getNativeErrorCode";
import { requestPermissions } from "./requestPermissions";
import { PeripheralsMap } from "./static";

function toArray(strList?: string): string[] {
  return strList?.split(",") ?? [];
}

function toString(...values: (string | number)[]): string {
  return values.join(",");
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

// A scanned peripheral is BLE device and its advertisement data
export type ScannedPeripheral = Device &
  Readonly<{
    advertisementData: AdvertisementData;
  }>;

export type ScanStopReason =
  | Exclude<BluetoothState, "ready">
  | "failedToStart"
  | "success"; // Scan was stopped by a call to stopScan() or shutdown()

export type ScanEvent = Readonly<
  | {
      type: "peripheral";
      peripheral: ScannedPeripheral;
    }
  | {
      type: "status";
      scanStatus: ScanStatus;
      stopReason?: ScanStopReason;
    }
>;

export type PeripheralConnectionEvent = Readonly<{
  peripheral: ScannedPeripheral;
  connectionStatus: ConnectionStatus;
  reason: ConnectionEventReason;
}>;

export type PeripheralCharacteristicValueChangedEvent = Readonly<{
  peripheral: ScannedPeripheral;
  service: string;
  characteristic: string;
  characteristicIndex: number;
  value: readonly number[]; // Array of bytes
}>;

export type PeripheralOrSystemId = ScannedPeripheral | string;

/**
 * Event map for {@link Central} class.
 * This is the list of supported events where the property name
 * is the event name and the property type the event data type.
 */
export type CentralEventMap = Readonly<{
  bluetoothState: { state: BluetoothState };
  scanStatus: { status: ScanStatus };
}>;

// Our native event emitter and subscriptions
let _nativeEmitter: NativeEventEmitter | undefined;
let _bleStateSubs: EmitterSubscription | undefined;
let _connStatusSubs: EmitterSubscription | undefined;
let _valueChangedSubs: EmitterSubscription | undefined;
let _scanResultSubs: EmitterSubscription | undefined;

// Our event emitter
const _evEmitter = createTypedEventEmitter<CentralEventMap>();

// Bluetooth state
let _bluetoothState: BluetoothState = "unknown";

// Scan status
let _scanStatus: ScanStatus = "stopped";

// Scan callback
let _scanCallback: ((ev: ScanEvent) => void) | undefined;

function _getSystemId(peripheral: PeripheralOrSystemId): string {
  return typeof peripheral === "string" ? peripheral : peripheral.systemId;
}

function _getPeripheralInfo(peripheral: PeripheralOrSystemId): PeripheralInfo {
  const pInf = PeripheralsMap.get(_getSystemId(peripheral));
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

function _updateBluetoothState(state: BluetoothState): void {
  if (_bluetoothState !== state) {
    console.log(
      `[BLE] Bluetooth state changed from ${_bluetoothState} to ${state}`
    );
    _bluetoothState = state;
    try {
      _evEmitter.emit("bluetoothState", { state });
    } catch (error) {
      const e = errToStr(error);
      console.error(
        `[BLE] Uncaught error in "bluetoothState" event listener: ${e}`
      );
    }
  }
  if (state !== "ready") {
    _updateScanStatus("stopped", state);
  }
}

function _updateScanStatus(
  scanStatus: ScanStatus,
  reason?: ScanStopReason
): void {
  console.log(
    `[BLE] Scan status changed from ${_scanStatus} to ${scanStatus}${
      reason ? ` with reason: ${reason}` : ""
    }`
  );

  const callback = _scanCallback;
  const statusChanged = _scanStatus !== scanStatus;
  _scanStatus = scanStatus;

  // Remove native listener and callback if scan is not running
  if (scanStatus === "stopped") {
    _scanCallback = undefined;
    _scanResultSubs?.remove();
    _scanResultSubs = undefined;
  } else if (!_scanCallback) {
    // This should never happen
    console.warn("[BLE] No scan callback for scan status change!");
  }

  // Notify
  if (statusChanged) {
    try {
      _evEmitter.emit("scanStatus", { status: scanStatus });
    } catch (e) {
      console.error(
        `[BLE] Uncaught error in "scanStatus" event listener: ${errToStr(e)}`
      );
    }
    const stopReason =
      scanStatus !== "stopped" ? undefined : reason ?? "success";
    try {
      callback?.({ type: "status", scanStatus, stopReason });
    } catch (e) {
      console.error(
        `[BLE] Uncaught error in startScan callback for status: ${errToStr(e)}`
      );
    }
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
  const name = pInf.scannedPeripheral.name;
  for (const cb of pInf.connStatusCallbacks) {
    try {
      cb(ev);
    } catch (error) {
      const e = errToStr(error);
      console.error(
        `[BLE ${name}] Uncaught error in Connection Status event listener: ${e}`
      );
    }
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
          const pInf = PeripheralsMap.get(device.systemId);
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
                if (pInf.state !== "disconnecting") {
                  console.log(
                    `[BLE ${name}] Unexpected disconnection, last known state is ${pInf.state}`
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
            const pInf = PeripheralsMap.get(device.systemId);
            const name = device.name;
            if (pInf) {
              const onValueChanged = pInf.valueChangedCallbacks.get(
                toString(
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
    PeripheralsMap.clear();
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

  addListener<T extends keyof CentralEventMap>(
    type: T,
    listener: (ev: CentralEventMap[T]) => void
  ): void {
    _evEmitter.addListener(type, listener);
  },

  removeListener<T extends keyof CentralEventMap>(
    type: T,
    listener: (ev: CentralEventMap[T]) => void
  ): void {
    _evEmitter.removeListener(type, listener);
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
    scanCallback: (ev: ScanEvent) => void
  ): Promise<void> {
    if (!_nativeEmitter) {
      throw new Errors.CentralNotInitializedError();
    }

    // Only one scan at a time
    if (_scanCallback) {
      throw new Errors.ScanAlreadyInProgressError();
    }

    // We rely on the uniqueness of the value of scanCallback to know
    // if this scan is still the current one.
    // We can't just check if _scanCallback being undefined or not as
    // calls to _updateBluetoothState() / _updateScanStatus() will raise
    // scanStatus and/or bluetoothState events which may run client code
    // that call startScan() and set _scanCallback again (potentially
    // passing the same callback).
    const originalScanCallback = scanCallback;
    scanCallback = (ev: ScanEvent) => originalScanCallback(ev);

    // Throw if this scan was stopped
    const checkActive = () => {
      if (_scanCallback !== scanCallback) {
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
    _scanCallback = scanCallback;
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
        // This call will update the Bluetooth state which cancel the scan
        // if Bluetooth is not ready
        BluetoothLE.bleInitialize().catch(reject);
      });
    } else if (_bluetoothState !== "ready") {
      // Update scan status if Bluetooth is not ready
      if (_scanCallback === scanCallback) {
        _updateScanStatus("stopped", _bluetoothState);
      }
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
        const pInf = PeripheralsMap.get(ev.device.systemId);
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
          PeripheralsMap.set(ev.device.systemId, {
            scannedPeripheral: peripheral,
            state: "disconnected",
            requiredServices,
            connStatusCallbacks: [],
            valueChangedCallbacks: new Map(),
          });
        }
        try {
          _scanCallback?.({ type: "peripheral", peripheral });
        } catch (error) {
          const e = errToStr(error);
          console.error(`[BLE ${name}] Uncaught error in Scan callback: ${e}`);
        }
      }
    });

    // Start scan
    try {
      await BluetoothLE.startScan(servicesStr);
    } catch (e) {
      // Failed to start scan, Android only
      const message = (e as Error)?.message;
      console.log(`[BLE] Error starting scan: ${message ?? String(e)}`);
      // Update Bluetooth state it we are still the active scan
      if (_scanCallback === scanCallback) {
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

  async connectPeripheral(
    peripheral: PeripheralOrSystemId,
    opt?: {
      connectionStatusCallback?: (ev: PeripheralConnectionEvent) => void;
      timeout?: number; // In ms
    }
  ): Promise<void> {
    const pInf = _getPeripheralInfo(peripheral);
    const name = pInf.scannedPeripheral.name;
    const callback = opt?.connectionStatusCallback;
    const timeoutMs = opt?.timeout ?? 0;

    console.log(
      `[BLE ${name}] Connecting with ` +
        `${timeoutMs ? `timeout of ${timeoutMs}ms` : "no timeout"},` +
        ` last known state is ${pInf.state}`
    );

    // Store connection status callback if one was given (otherwise keep the existing one)
    if (callback && !pInf.connStatusCallbacks.includes(callback)) {
      pInf.connStatusCallbacks.push(callback);
    }

    // Timeout
    let hasTimedOut = false;
    const timeoutId =
      timeoutMs > 0 &&
      setTimeout(() => {
        // Disconnect on timeout
        console.log(`[BLE ${name}] Connection timed-out after ${timeoutMs}ms`);
        hasTimedOut = true;
        Central.disconnectPeripheral(peripheral).catch((e) =>
          console.warn(
            `[BLE ${name}] Failed to disconnect on connection timeout: ${e}`
          )
        );
      }, timeoutMs);

    try {
      const sysId = _getSystemId(peripheral);
      if (!(await BluetoothLE.createPeripheral(sysId))) {
        throw new Errors.ConnectError(name, "createFailed");
      }

      try {
        // TODO Temp fix: connecting immediately after a disconnect causes issues
        // on Android: the device is never actually disconnected, but the MTU
        // is reset to 23 as far as the native code is concerned.
        await delay(300);

        // Connect to peripheral
        await BluetoothLE.connectPeripheral(
          sysId,
          pInf.requiredServices,
          false
        );

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
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
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
      // Getting an exception from Android when disconnecting while already disconnected
      if (error.message !== "Peripheral not in required state to disconnect") {
        throw error;
      }
      if (pInf.state !== "disconnecting" && pInf.state !== "disconnected") {
        console.warn(
          `[BLE ${name}] Got exception when disconnecting while in state ${pInf.state}`
        );
      }
    } finally {
      // Always remove callback and release peripheral
      pInf.connStatusCallbacks.length = 0;
      await BluetoothLE.releasePeripheral(pInf.scannedPeripheral.systemId);
    }
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

  // Replaces a previous subscription to same characteristic
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
    const key = toString(
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
    await BluetoothLE.unsubscribeCharacteristic(
      _getSystemId(peripheral),
      serviceUuid,
      characteristicUuid,
      options?.instanceIndex ?? 0
    );
    const key = toString(
      serviceUuid,
      characteristicUuid,
      options?.instanceIndex ?? 0
    );
    pInf.valueChangedCallbacks.delete(key);
  },
} as const;
