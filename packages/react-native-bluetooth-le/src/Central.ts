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
import {
  PeripheralInfo,
  CentralPeripheralsMap as peripheralsMap,
  PeripheralState,
} from "./CentralPeripheralsMap";
import { Constants } from "./Constants";
import * as Errors from "./errors";
import {
  BleBluetoothStateEvent,
  BleCharacteristicValueChangedEvent,
  BleConnectionEvent,
  BleEventMap,
  BleScanResultEvent,
} from "./events";
import { requestPermissions } from "./requestPermissions";

function _toArray(strList?: string): string[] {
  return strList?.split(",") ?? [];
}

function _toString(...values: (string | number)[]): string {
  return values.join(",");
}

export interface ScanStatusEvent {
  readonly scanning: boolean;
}

// A scanned peripheral is BLE device and its advertisement data
export interface ScannedPeripheral extends Device {
  readonly advertisementData: AdvertisementData;
}

export interface ScannedPeripheralEvent {
  readonly peripheral: ScannedPeripheral;
}

export interface PeripheralConnectionEvent {
  readonly peripheral: ScannedPeripheral;
  readonly connectionStatus: ConnectionStatus;
}

export interface PeripheralCharacteristicValueChangedEvent {
  readonly peripheral: ScannedPeripheral;
  readonly service: string;
  readonly characteristic: string;
  readonly characteristicIndex: number;
  readonly value: number[]; // Array of bytes
}

export type PeripheralOrSystemId = ScannedPeripheral | string;

/**
 * Event map for {@link Central} class.
 * This is the list of supported events where the property name
 * is the event name and the property type the event data type.
 * @category Pixels
 */
export interface CentralEventMap {
  scanStatus: ScanStatusEvent;
  scannedPeripheral: ScannedPeripheralEvent;
}

// Our native event emitter and subscriptions
let _nativeEmitter: NativeEventEmitter | undefined;
let _scanResultSubs: EmitterSubscription | undefined;
let _connStatusSubs: EmitterSubscription | undefined;
let _valueChangedSubs: EmitterSubscription | undefined;

// Our scan event emitter
const _scanEvEmitter = createTypedEventEmitter<CentralEventMap>();

//
let _bleInit = false;

function _notifyScanStatus(scanStatus: boolean) {
  try {
    _scanEvEmitter.emit("scanStatus", { scanning: scanStatus });
  } catch (error) {
    console.error(
      `[BLE] Uncaught error in Scan Status event listener: ${error}`
    );
  }
}

function _getSystemId(peripheral: PeripheralOrSystemId): string {
  return typeof peripheral === "string" ? peripheral : peripheral.systemId;
}

function _getPeripheralInfo(peripheral: PeripheralOrSystemId): PeripheralInfo {
  const pInf = peripheralsMap.get(_getSystemId(peripheral));
  if (!pInf) {
    throw new Errors.UnknownPeripheralError(_getSystemId(peripheral));
  }
  return pInf;
}

function _addListener<T extends keyof BleEventMap>(
  name: T,
  listener: (ev: BleEventMap[T]) => void
) {
  return _nativeEmitter?.addListener(name, listener);
}

export const Central = {
  // May be called multiple times
  initialize(): void {
    if (!_connStatusSubs) {
      if (!_nativeEmitter) {
        _nativeEmitter = new NativeEventEmitter(BluetoothLE);
      }

      // Listen to native connection events
      _connStatusSubs = _addListener(
        "connectionEvent",
        (ev: BleConnectionEvent) => {
          try {
            // Forward event
            const pInf = peripheralsMap.get(ev.device.systemId);
            if (pInf) {
              let newState: PeripheralState;
              switch (ev.connectionStatus) {
                case "connecting":
                case "disconnected":
                case "disconnecting":
                  newState = ev.connectionStatus;
                  break;
                case "failedToConnect":
                  newState = "disconnected";
                  break;
                case "connected":
                case "ready":
                  newState = "connecting";
                  break;
              }
              if (pInf.state !== newState) {
                pInf.state = newState;
              }
              if (ev.connectionStatus !== "ready") {
                // The ready status is notified once the MTU has been changed
                for (const cb of pInf.connStatusCallbacks) {
                  cb({
                    peripheral: pInf.scannedPeripheral,
                    connectionStatus: ev.connectionStatus,
                  });
                }
              }
            } else {
              console.warn(
                `[BLE ${ev.device.name}] Got connection status ${ev.connectionStatus}` +
                  " for unknown scanned peripheral"
              );
            }
          } catch (error) {
            console.error(
              `[BLE ${ev.device.name}] Uncaught error in Connection Status event listener: ${error}`
            );
          }
        }
      );

      // Listen to native characteristic value changed events
      _valueChangedSubs = _addListener(
        "characteristicValueChanged",
        (ev: BleCharacteristicValueChangedEvent) => {
          try {
            // Forward event
            const pInf = peripheralsMap.get(ev.device.systemId);
            if (pInf) {
              const onValueChanged = pInf.valueChangedCallbacks.get(
                _toString(
                  ev.characteristic.serviceUuid,
                  ev.characteristic.uuid,
                  ev.characteristic.instanceIndex
                )
              );
              onValueChanged?.({
                peripheral: pInf.scannedPeripheral,
                service: ev.characteristic.serviceUuid,
                characteristic: ev.characteristic.uuid,
                characteristicIndex: ev.characteristic.instanceIndex,
                value: ev.data,
              });
            } else {
              console.warn(
                `[BLE ${ev.device.name}] Got characteristic value changed for unknown scanned peripheral`
              );
            }
          } catch (error) {
            console.error(
              `[BLE ${ev.device.name}] Uncaught error in Characteristic Value Changed event listener: ${error}`
            );
          }
        }
      );
      console.log("[BLE] Central has initialized");
    }
  },

  shutdown(): void {
    BluetoothLE.stopScan().catch(() => {}); // Ignore any error
    _scanResultSubs?.remove();
    _scanResultSubs = undefined;
    _connStatusSubs?.remove();
    _connStatusSubs = undefined;
    _valueChangedSubs?.remove();
    _valueChangedSubs = undefined;
    peripheralsMap.clear();
    console.log("[BLE] Central has shutdown");
  },

  isInitialized(): boolean {
    return !!_connStatusSubs;
  },

  isScanning(): boolean {
    return !!_scanResultSubs;
  },

  getScannedPeripherals(): ScannedPeripheral[] {
    return [...peripheralsMap.values()].map((pInf) => pInf.scannedPeripheral);
  },

  getConnectedPeripherals(): ScannedPeripheral[] {
    return [...peripheralsMap.values()]
      .filter((pInf) => pInf.state === "ready")
      .map((pInf) => pInf.scannedPeripheral);
  },

  addListener<T extends keyof CentralEventMap>(
    name: T,
    listener: (ev: CentralEventMap[T]) => void
  ) {
    return _scanEvEmitter.addListener(name, listener);
  },

  removeListener<T extends keyof CentralEventMap>(
    name: T,
    listener: (ev: CentralEventMap[T]) => void
  ) {
    return _scanEvEmitter.removeListener(name, listener);
  },

  // On Android, BLE scanning will fail without error when started
  // more than 5 times over the last 30 seconds.
  async startScanning(services: string | string[]): Promise<void> {
    if (!_nativeEmitter) {
      throw new Errors.CentralNotReadyError();
    }

    // Ask for permissions on Android
    if (!(await requestPermissions())) {
      throw new Errors.BluetoothPermissionsDeniedError();
    }

    if (!_bleInit) {
      console.log("[BLE] Waiting on Bluetooth to be ready");
      await new Promise<void>((resolve, reject) => {
        _addListener("bluetoothState", ({ state }: BleBluetoothStateEvent) => {
          if (state === "ready") {
            resolve();
          } else {
            reject(new Errors.BluetoothPermissionsDeniedError()); // TODO it could be that Bluetooth is off
          }
        });
        BluetoothLE.bleInitialize().catch(reject);
      });
      console.log("[BLE] Bluetooth is ready");
      _bleInit = true;
    }

    // Get list of required services
    const requiredServices =
      typeof services === "string" ? services : services?.join(",") ?? "";

    try {
      // Listen to native scan events
      _scanResultSubs?.remove();
      _scanResultSubs = _nativeEmitter.addListener(
        "scanResult",
        (ev: BleScanResultEvent) => {
          if (typeof ev === "string") {
            console.warn(`[BLE] Scan error: ${ev}`);
            _notifyScanStatus(false);
          } else {
            try {
              // Forward event
              const peripheral = {
                ...ev.device,
                advertisementData: ev.advertisementData,
              };
              const pInf = peripheralsMap.get(ev.device.systemId);
              if (pInf) {
                pInf.scannedPeripheral = peripheral;
                pInf.requiredServices = requiredServices;
                // Note: don't change state as the peripheral might be in the process of being connected
              } else {
                peripheralsMap.set(ev.device.systemId, {
                  scannedPeripheral: peripheral,
                  state: "disconnected",
                  requiredServices,
                  connStatusCallbacks: [],
                  valueChangedCallbacks: new Map(),
                });
              }
              _scanEvEmitter.emit("scannedPeripheral", { peripheral });
            } catch (error) {
              console.error(
                `[BLE] Uncaught error in Scan Result event listener: ${error}`
              );
            }
          }
        }
      );

      // Start scan
      await BluetoothLE.startScan(requiredServices);
    } catch (error: any) {
      _scanResultSubs?.remove();
      _scanResultSubs = undefined;
      throw Error(`Failed to start scan: ${error.message} (${error.code})`);
    }

    console.log(
      `[BLE] Started scan for BLE peripherals with ${
        requiredServices.length
          ? `services ${requiredServices}`
          : "no specific service"
      }`
    );

    _notifyScanStatus(true);
  },

  async stopScanning(): Promise<void> {
    if (Central.isScanning()) {
      console.log("[BLE] Stopping scan");
      _scanResultSubs?.remove();
      _scanResultSubs = undefined;
      await BluetoothLE.stopScan();
      _notifyScanStatus(false);
    }
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
        console.log(`[BLE ${name}] Connection timeout after ${timeoutMs}ms`);
        hasTimedOut = true;
        Central.disconnectPeripheral(peripheral).catch((e) =>
          console.warn(
            `[BLE ${name}] Failed to disconnect on connection timeout: ${e}`
          )
        );
      }, timeoutMs);

    try {
      // TODO handle case when another connection request for the same device is already under way
      const sysId = _getSystemId(peripheral);
      if (!(await BluetoothLE.createPeripheral(sysId))) {
        throw new Errors.ConnectError(name, "nativeError");
      }

      try {
        // TODO Temp fix: connecting immediately after a disconnect causes issues
        // on Android: the device is never actually disconnected, but the MTU
        // is reset to 23 as far as the native code is concerned.
        await delay(300);

        // Connect to peripheral
        await BluetoothLE.connectPeripheral(
          sysId,
          pInf.requiredServices ?? "",
          false
        );

        // Set MTU
        console.log(`[BLE ${name}] Connected, updating MTU`);
        let mtu = 0;
        try {
          mtu = await BluetoothLE.requestPeripheralMtu(sysId, Constants.maxMtu);
        } catch (error: any) {
          if (error.code === "ERROR_GATT_INVALID_PDU") {
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
        if (pInf.state === "connecting") {
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
          for (const cb of pInf.connStatusCallbacks) {
            cb({
              connectionStatus: "ready",
              peripheral: pInf.scannedPeripheral,
            });
          }
        } else if (pInf.state !== "ready") {
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
              `[BLE ${name}] Error trying to disconnect after failing to connect: ${error}`
            );
          }
          throw error;
        }
      }
    } catch (error) {
      // Log error
      console.log(`[BLE ${name}] Error connecting to peripheral ${error}`);
      throw error;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  },

  async disconnectPeripheral(peripheral: PeripheralOrSystemId): Promise<void> {
    const pInf = _getPeripheralInfo(peripheral);
    console.log(
      `[BLE ${pInf.scannedPeripheral.name}] Disconnecting, last known state is ${pInf.state}`
    );
    try {
      await BluetoothLE.disconnectPeripheral(pInf.scannedPeripheral.systemId);
    } catch (error: any) {
      // TODO getting an exception from Android when disconnecting while already disconnected
      if (error.message !== "Peripheral not in required state to disconnect") {
        throw error;
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
    return _toArray(
      await BluetoothLE.getDiscoveredServices(_getSystemId(peripheral))
    );
  },

  async getServiceCharacteristics(
    peripheral: PeripheralOrSystemId,
    serviceUuid: string
  ): Promise<string[]> {
    return _toArray(
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
    const key = _toString(
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
    const key = _toString(
      serviceUuid,
      characteristicUuid,
      options?.instanceIndex ?? 0
    );
    pInf.valueChangedCallbacks.delete(key);
  },
} as const;
