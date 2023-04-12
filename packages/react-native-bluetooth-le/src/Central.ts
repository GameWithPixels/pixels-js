import { createTypedEventEmitter } from "@systemic-games/pixels-core-utils";
import { NativeEventEmitter, EmitterSubscription } from "react-native";

import {
  BluetoothLE,
  ConnectionStatus,
  BleEvent,
  AdvertisementData,
  Device,
  BleScanResultEvent,
  BleConnectionEvent,
  BleCharacteristicValueChangedEvent,
} from "./BluetoothLE";
import Constants from "./Constants";
import * as Errors from "./Errors";
import requestPermissions from "./requestPermissions";

function _toArray(strList?: string): string[] {
  return strList?.split(",") ?? [];
}

function _toString(...values: (string | number)[]): string {
  return values.join(",");
}

export interface ScanStatusEvent {
  readonly scanning: boolean;
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
  readonly value: DataView;
}

export type PeripheralOrSystemId = ScannedPeripheral | string;

type ScanEventMap = {
  scanStatus: ScanStatusEvent;
  scannedPeripheral: ScannedPeripheralEvent;
};

type PeripheralState =
  | "disconnected"
  | "connecting"
  | "ready"
  | "disconnecting";

interface PeripheralInfo {
  scannedPeripheral: ScannedPeripheral;
  state: PeripheralState;
  requiredServices: string;
  connStatusCallback?: (ev: PeripheralConnectionEvent) => void;
  valueChangedCallbacks: Map<
    string,
    (ev: PeripheralCharacteristicValueChangedEvent) => void
  >;
}

// Our native event emitter and subscriptions
let _nativeEmitter: NativeEventEmitter | undefined;
let _scanResultSubs: EmitterSubscription | undefined;
let _connStatusSubs: EmitterSubscription | undefined;
let _valueChangedSubs: EmitterSubscription | undefined;

// Our scan event emitter
const _scanEvEmitter = createTypedEventEmitter<ScanEventMap>();

// List of known peripherals
const _peripherals: Map<string, PeripheralInfo> = new Map();

function _notifyScanStatus(scanStatus: boolean) {
  try {
    _scanEvEmitter.emit("scanStatus", { scanning: scanStatus });
  } catch (error) {
    console.error(`[BLE] Exception in Scan Status event listener: ${error}`);
  }
}

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

// A scanned peripheral is BLE device and its advertisement data
export interface ScannedPeripheral extends Device {
  readonly advertisementData: AdvertisementData;
}

const Central = {
  // May be called multiple times
  initialize(): void {
    if (!_connStatusSubs) {
      if (!_nativeEmitter) {
        _nativeEmitter = new NativeEventEmitter(BluetoothLE);
      }
      // Initialize native module and event emitter
      // await BluetoothLE.bleInitialize();

      // Listen to native connection events
      _connStatusSubs = _nativeEmitter.addListener(
        BleEvent.connectionEvent,
        (ev: BleConnectionEvent) => {
          try {
            // Forward event
            const pInf = _peripherals.get(ev.device.systemId);
            if (pInf) {
              if (
                (ev.connectionStatus === "connecting" ||
                  ev.connectionStatus === "disconnecting" ||
                  ev.connectionStatus === "disconnected") &&
                pInf.state !== ev.connectionStatus
              ) {
                pInf.state = ev.connectionStatus;
              }
              pInf.connStatusCallback?.({
                peripheral: pInf.scannedPeripheral,
                connectionStatus: ev.connectionStatus,
              });
            } else {
              console.warn(
                `[BLE ${ev.device.name}] Got connection status ${ev.connectionStatus}` +
                  " for unknown scanned peripheral"
              );
            }
          } catch (error) {
            console.error(
              `[BLE ${ev.device.name}] Exception in Connection Status event listener: ${error}`
            );
          }
        }
      );

      // Listen to native characteristic value changed events
      _valueChangedSubs = _nativeEmitter.addListener(
        BleEvent.characteristicValueChanged,
        (ev: BleCharacteristicValueChangedEvent) => {
          try {
            // Forward event
            const pInf = _peripherals.get(ev.device.systemId);
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
                value: new DataView(new Uint8Array(ev.data).buffer),
              });
            } else {
              console.warn(
                `[BLE ${ev.device.name}] Got characteristic value changed for unknown scanned peripheral`
              );
            }
          } catch (error) {
            console.error(
              `[BLE ${ev.device.name}] Exception in Characteristic Value Changed event listener: ${error}`
            );
          }
        }
      );
      console.log("[BLE] Central has initialized");
    }
  },

  shutdown(): void {
    _scanResultSubs?.remove();
    _scanResultSubs = undefined;
    _connStatusSubs?.remove();
    _connStatusSubs = undefined;
    _valueChangedSubs?.remove();
    _valueChangedSubs = undefined;
    _peripherals.clear();
    // await BluetoothLE.bleShutdown();
    console.log("[BLE] Central has shutdown");
  },

  isReady(): boolean {
    return !!_nativeEmitter;
  },

  getScannedPeripherals(): ScannedPeripheral[] {
    return [..._peripherals.values()].map((pInf) => pInf.scannedPeripheral);
  },

  getConnectedPeripherals(): ScannedPeripheral[] {
    return [..._peripherals.values()]
      .filter((pInf) => pInf.state === "ready")
      .map((pInf) => pInf.scannedPeripheral);
  },

  addScanStatusEventListener(
    scanStatusCallback: (ev: ScanStatusEvent) => void
  ): void {
    _scanEvEmitter.addListener("scanStatus", scanStatusCallback);
  },

  removeScanStatusEventListener(
    scanStatusCallback: (ev: ScanStatusEvent) => void
  ): void {
    _scanEvEmitter.removeListener("scanStatus", scanStatusCallback);
  },

  addScannedPeripheralEventListener(
    scannedPeripheralCallback: (ev: ScannedPeripheralEvent) => void
  ): void {
    _scanEvEmitter.addListener("scannedPeripheral", scannedPeripheralCallback);
  },

  removeScannedPeripheralEventListener(
    scannedPeripheralCallback: (ev: ScannedPeripheralEvent) => void
  ): void {
    _scanEvEmitter.removeListener(
      "scannedPeripheral",
      scannedPeripheralCallback
    );
  },

  async scanForPeripheralsWithServices(
    services: string | string[]
  ): Promise<void> {
    if (!_nativeEmitter) {
      throw new Errors.CentralNotReadyError();
    }

    // Ask for permissions on Android
    if (!(await requestPermissions())) {
      throw new Errors.BluetoothPermissionsDeniedError();
    }

    // Start BLE scanning
    const requiredServices =
      typeof services === "string" ? services : services.join(",");

    try {
      // Listen to native scan events
      _scanResultSubs?.remove();
      _scanResultSubs = _nativeEmitter.addListener(
        BleEvent.scanResult,
        (ev: BleScanResultEvent) => {
          if (typeof ev === "string") {
            console.error(`[BLE] Scan error: ${ev}`);
            _notifyScanStatus(false);
          } else {
            try {
              // Forward event
              const peripheral = {
                ...ev.device,
                advertisementData: ev.advertisementData,
              };
              const pInf = _peripherals.get(ev.device.systemId);
              if (pInf) {
                pInf.scannedPeripheral = peripheral;
                pInf.requiredServices = requiredServices;
                // Note: don't change state as the peripheral might be in the process of being connected
              } else {
                _peripherals.set(ev.device.systemId, {
                  scannedPeripheral: peripheral,
                  state: "disconnected",
                  requiredServices,
                  valueChangedCallbacks: new Map(),
                });
              }
              _scanEvEmitter.emit("scannedPeripheral", { peripheral });
            } catch (error) {
              console.error(
                `[BLE] Exception in Scan Result event listener: ${error}`
              );
            }
          }
        }
      );

      //TODO temp fix waiting on BLE lib update
      await BluetoothLE.startScan(
        requiredServices.length ? requiredServices : undefined
      );
    } catch (error: any) {
      throw Error(`Failed to start scan: ${error.message} (${error.code})`);
    }

    console.log(
      `[BLE] Started scan for BLE peripherals with services ${requiredServices}`
    );

    _notifyScanStatus(true);
  },

  async stopScanning(): Promise<void> {
    console.log("[BLE] Stopping scan");
    _scanResultSubs?.remove();
    _scanResultSubs = undefined;
    await BluetoothLE.stopScan();
    _notifyScanStatus(false);
  },
  /*
    //Note: callback might be triggered even if status didn't changed
    subscribeScanStatusChanged(scanStatusChanged?: (scanning: boolean) => void) {
      this._scanStatusChanged = scanStatusChanged;
    }
  
    subscribeConnectionStatusChanged(
      conStatusChanged?: (
        peripheral: Peripheral,
        status: ConnectionStatus
      ) => void
    ) {
      this._conStatusChanged = conStatusChanged;
    }
  
    subscribeCharacteristicValueChanged(
      valueChanged?: (
        peripheral: Peripheral,
        characteristic: Characteristic,
        msgOrType: MessageOrType
      ) => void
    ) {
      this._characteristicValueChanged = valueChanged;
    }
  */
  async connectPeripheral(
    peripheral: PeripheralOrSystemId,
    connectionStatusCallback?: (ev: PeripheralConnectionEvent) => void,
    timeoutMs = 0 //TODO unused
  ): Promise<void> {
    const pInf = _getPeripheralInfo(peripheral);
    const name = pInf.scannedPeripheral.name;
    if (
      !connectionStatusCallback &&
      pInf.connStatusCallback !== connectionStatusCallback
    ) {
      throw new Errors.ConnectError(name, "InUse");
    }

    console.log(
      `[BLE ${name}] Connecting with ` +
        `${timeoutMs ? `timeout of ${timeoutMs}ms` : "no timeout"},` +
        ` last known state is ${pInf.state}`
    );

    //TODO handle case when another connection request for the same device is already under way
    //TODO reject if state is not disconnected?
    const sysId = _getSystemId(peripheral);
    if (await BluetoothLE.createPeripheral(sysId)) {
      try {
        // Store connection status callback if one was given (otherwise keep the existing one)
        if (connectionStatusCallback) {
          pInf.connStatusCallback = connectionStatusCallback;
        }

        // Connect to peripheral
        await BluetoothLE.connectPeripheral(
          sysId,
          pInf.requiredServices ?? "",
          false
        );

        // Set MTU
        console.log(`[BLE ${name}] Connected, updating MTU...`);
        try {
          const mtu = await BluetoothLE.requestPeripheralMtu(
            sysId,
            Constants.maxMtu
          );
          console.log(`[BLE ${name}] MTU set to ${mtu}`);
        } catch {
          const mtu = await BluetoothLE.getPeripheralMtu(sysId);
          if (mtu <= 23) {
            // Note: we can't change MTU more than once
            //TODO check for Error (0x4): GATT INVALID PDU
            console.log(`[BLE ${name}] MTU not changed: ${mtu}`);
          }
        }

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
        } else if (pInf.state !== "ready") {
          throw new Errors.ConnectError(name, "Disconnected");
        }
      } catch (error) {
        Central.disconnectPeripheral(peripheral).catch((e) =>
          console.warn(
            `[BLE ${name}] Failed to disconnect after failing to connect: ${e}`
          )
        );
        throw error;
      }
    } else {
      throw new Errors.ConnectError(name, "NativeError");
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
      //TODO getting an exception from Android when disconnecting while already disconnected
      if (error.message !== "Peripheral not in required state to disconnect") {
        throw error;
      }
    } finally {
      // Always remove callback and release peripheral
      pInf.connStatusCallback = undefined;
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
    _timeoutMs = Constants.defaultRequestTimeout //TODO unused
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
      timeoutMs?: number; //TODO unused => Constants.defaultRequestTimeout
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
      timeoutMs?: number; //TODO unused => Constants.defaultRequestTimeout
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
      timeoutMs?: number; //TODO unused => Constants.defaultRequestTimeout
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
      timeoutMs?: number; //TODO unused => Constants.defaultRequestTimeout
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

export default Central;
