import {
  BluetoothLE,
  Device,
  ConnectionStatus,
  AdvertisementData,
  Characteristic,
  BleScanResultEvent,
  BleEvent,
  BleConnectionEvent,
  BleCharacteristicValueChangedEvent,
} from "@systemic-games/react-native-bluetooth-le";
import * as React from "react";
import { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  PressableProps,
  ViewStyle,
  NativeEventEmitter,
  EmitterSubscription,
  Platform,
  PermissionsAndroid,
  ScrollView,
  // eslint-disable-next-line import/namespace
} from "react-native";

// https://stackoverflow.com/a/34310051
const toHexString = (arr: Iterable<number>) => {
  return Array.from(arr, function (byte) {
    // eslint-disable-next-line no-bitwise
    return ("0" + (byte & 0xff).toString(16)).slice(-2);
  }).join(",");
};

// https://stackoverflow.com/a/70114114
Promise.allSettled =
  Promise.allSettled ||
  ((promises: any) =>
    Promise.all(
      promises.map((p: any) =>
        p
          .then((value: any) => ({
            status: "fulfilled",
            value,
          }))
          .catch((reason: any) => ({
            status: "rejected",
            reason,
          }))
      )
    ));

// Bluetooth helper for communicating with Pixels
class PixelBleHelper {
  private readonly _ble = BluetoothLE;
  private readonly _evEmitter = new NativeEventEmitter(BluetoothLE);
  private readonly _scanResultSub: EmitterSubscription;
  private readonly _connStatusSub: EmitterSubscription;
  private readonly _valueChangedSub: EmitterSubscription;
  private _onScanStatusChanged?: (scanning: boolean) => void;
  private _onDeviceDiscovered?: (
    device: Device,
    advertisementData: AdvertisementData
  ) => void;
  private _onConnectionEvent?: (
    device: Device,
    status: ConnectionStatus
  ) => void;
  private _onCharacteristicValueChanged?: (
    device: Device,
    characteristic: Characteristic,
    data: Uint8Array
  ) => void;
  private readonly _allPixels: Device[] = [];

  private static readonly _serviceUuid = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
  private static readonly _notifyUuid = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
  private static readonly _writeUuid = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";

  constructor() {
    this._ble.bleInitialize().catch((err) => console.error(err));

    this._scanResultSub = this._evEmitter.addListener(
      BleEvent.scanResult,
      (ev: BleScanResultEvent) => {
        if (typeof ev === "string") {
          console.log(`Scan error: ${ev}`);
        } else {
          try {
            this._onDeviceDiscovered?.(ev.device, ev.advertisementData);
          } catch (error) {
            console.log(
              `Exception in BLE Scan Result event listener: ${error}`
            );
          }
        }
      }
    );

    this._connStatusSub = this._evEmitter.addListener(
      BleEvent.connectionEvent,
      (ev: BleConnectionEvent) => {
        try {
          console.log(ev);
          this._onConnectionEvent?.(ev.device, ev.connectionStatus);
        } catch (error) {
          console.log(
            `Exception in BLE Connection Status event listener: ${error}`
          );
        }
      }
    );

    this._valueChangedSub = this._evEmitter.addListener(
      BleEvent.characteristicValueChanged,
      (ev: BleCharacteristicValueChangedEvent) => {
        try {
          this._onCharacteristicValueChanged?.(
            ev.device,
            ev.characteristic,
            new Uint8Array(ev.data)
          );
        } catch (error) {
          console.log(
            `Exception in BLE Characteristic Value Changed event listener: ${error}`
          );
        }
      }
    );
  }

  dispose() {
    this._scanResultSub.remove();
    this._connStatusSub.remove();
    this._valueChangedSub.remove();
    this._ble.bleShutdown();
    this._allPixels.length = 0;
  }

  async scanForPixels(
    discoveredDeviceCallback: (
      device: Device,
      advertisementData: AdvertisementData
    ) => void
  ): Promise<boolean> {
    // Ask for permissions on Android
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("BLE permissions granted");
      } else {
        console.log("BLE permissions denied");
        return false;
      }
    }

    // Start BLE scanning
    this._onDeviceDiscovered = discoveredDeviceCallback;
    try {
      await this._ble.startScan(PixelBleHelper._serviceUuid);
    } catch (error: any) {
      console.log(`Failed to start scan: ${error.message} (${error.code})`);
      return false;
    }

    console.log("Scan started");
    this._onScanStatusChanged?.call(this, true);
    return true;
  }

  async stopScanning() {
    await this._ble.stopScan();
    this._onScanStatusChanged?.call(this, false);
  }

  //Note: callback might be triggered even if status didn't changed
  notifyScanStatusChanged(scanStatusChanged?: (scanning: boolean) => void) {
    this._onScanStatusChanged = scanStatusChanged;
  }

  notifyConnectionEvent(
    conStatusChanged?: (device: Device, status: ConnectionStatus) => void
  ) {
    this._onConnectionEvent = conStatusChanged;
  }

  notifyCharacteristicValueChanged(
    valueChanged?: (
      device: Device,
      characteristic: Characteristic,
      data: Uint8Array
    ) => void
  ) {
    this._onCharacteristicValueChanged = valueChanged;
  }

  async connectPixel(device: Device): Promise<Device | undefined> {
    const name = device.name;
    console.log(`${name}: connecting`);
    // Checking name
    const devName = await this._ble.getPeripheralName(device.systemId);
    if (name !== devName) {
      console.log(`${name}: device name doesn't match => ${devName}`);
      return;
    }
    try {
      if (await this._ble.createPeripheral(device.systemId)) {
        this._allPixels.push(device);
        await this._ble.connectPeripheral(
          device.systemId,
          PixelBleHelper._serviceUuid,
          false
        );
        console.log(`${name}: connected, setting MTU`);
        await this._ble.requestPeripheralMtu(device.systemId, 512);
        // Get characteristics properties
        const characteristics = await this._ble.getServiceCharacteristics(
          device.systemId,
          PixelBleHelper._serviceUuid
        );
        characteristics.split(",").forEach(async (uuid) => {
          const props = await this._ble.getCharacteristicProperties(
            device.systemId,
            PixelBleHelper._serviceUuid,
            uuid,
            0
          );
          console.log(`  * characteristic ${uuid} has properties = ${props}`);
        });
        // Subscribe
        await this._ble.subscribeCharacteristic(
          device.systemId,
          PixelBleHelper._serviceUuid,
          PixelBleHelper._notifyUuid,
          0
        );
        console.log(`${name}: subscribed`);
        return device;
      } else {
        console.log(`Failed to create peripheral for ${device.name}`);
      }
    } catch (error) {
      console.log(error);
    }
  }

  async disconnectPixel(device: Device) {
    await this._ble.disconnectPeripheral(device.systemId);
  }

  async sendMessage(device: Device, data: Uint8Array) {
    await this._ble.writeCharacteristic(
      device.systemId,
      PixelBleHelper._serviceUuid,
      PixelBleHelper._writeUuid,
      0,
      Array.from(data),
      false
    );
  }

  async disconnectAll() {
    console.log(`disconnectAll: ${this._allPixels.map((d) => d.name)}`);
    const tasks = this._allPixels.map(async (px) => {
      await this._ble.disconnectPeripheral(px.systemId);
    });
    this._allPixels.length = 0;
    return Promise.allSettled(tasks);
  }
}

const bleHelper = new PixelBleHelper();

interface PixelStatus {
  readonly device: Device;
  readonly status: ConnectionStatus;
}

export default function App() {
  const [scannedDevices, setScannedDevices] = useState<Device[]>([]);
  const [scanning, setScanning] = useState(false);
  const [pixelStatuses, setPixelStatuses] = useState<PixelStatus[]>([]);

  useEffect(() => {
    // Scan notification
    // eslint-disable-next-line no-shadow
    bleHelper.notifyScanStatusChanged((scanning) => {
      console.log(`Scanning: ${scanning}`);
      setScanning(scanning);
    });

    // Connection notification
    bleHelper.notifyConnectionEvent((device, status) => {
      console.log(`> Connection event => ${status}`);
      console.log(
        `  for peripheral: address = ${device.address}, name = ${device.name}`
      );
      // eslint-disable-next-line no-shadow
      setPixelStatuses((pixelStatuses) => {
        const pixelStatus: PixelStatus = {
          device,
          status,
        };
        const index = pixelStatuses.findIndex(
          (e) => e.device.systemId === device.systemId
        );
        if (index < 0) {
          return [...pixelStatuses, pixelStatus];
        } else {
          const arr = [...pixelStatuses];
          arr[index] = pixelStatus;
          return arr;
        }
      });

      // Value changed notification
      bleHelper.notifyCharacteristicValueChanged(
        (peripheral, characteristic, data) => {
          console.log(`> Characteristic ${characteristic.uuid} value changed`);
          console.log(`  => ${toHexString(data)}`);
          console.log(
            `  for peripheral: address = ${peripheral.address}, name = ${peripheral.name}`
          );
        }
      );
    });

    // Return clean up function
    return function () {
      bleHelper.stopScanning();
      bleHelper.notifyScanStatusChanged();
      bleHelper.notifyConnectionEvent();
      bleHelper.notifyCharacteristicValueChanged();
      setScannedDevices(() => []);
      setPixelStatuses(() => []);
      bleHelper.disconnectAll().catch((err) => console.log(err));
    };
  }, []);

  const onDiscoveredDevice = (
    device: Device,
    advertisementData: AdvertisementData
  ) => {
    // eslint-disable-next-line no-shadow
    setScannedDevices((scannedDevices) => {
      if (
        scannedDevices.findIndex((dev) => dev.systemId === device.systemId) < 0
      ) {
        console.log(
          `Found Pixel: address=${device.address}, name=${device.name}`
        );
        console.log(`  * Services: ${advertisementData.services}`);
        if (advertisementData.manufacturersData) {
          console.log(
            `  * Manufacturer Data: ${advertisementData.manufacturersData
              .map((m) => `${m.companyId}: ${m.data.toString()}`)
              .join(", ")}`
          );
        }
        if (advertisementData.servicesData) {
          console.log(
            `  * Service Data: ${advertisementData.servicesData
              .map((s) => `${s.service}: ${s.data.toString()}`)
              .join(", ")}`
          );
        }
        return [...scannedDevices, device];
      } else {
        return scannedDevices;
      }
    });
    return false;
  };

  const connectAndIdentify = async (device: Device) => {
    const peripheral = await bleHelper.connectPixel(device);
    if (peripheral) {
      // Send WhoAmI message
      await bleHelper.sendMessage(peripheral, new Uint8Array([1]));
      console.log(`${peripheral.name}: wrote to characteristic`);
    }
  };

  const showDiceBox = (device: Device) => {
    const pixelStatus = pixelStatuses.find(
      (e) => e.device.systemId === device.systemId
    );
    const getValues: () => { text: string; func: () => Promise<void> } = () =>
      !pixelStatus || pixelStatus.status === "disconnected"
        ? {
            text: "Connect",
            func: async () => await connectAndIdentify(device),
          }
        : {
            text: "Disconnect",
            func: async () => await bleHelper.disconnectPixel(device),
          };
    const values = getValues();
    return (
      <View style={styles.deviceBox}>
        <Text style={styles.deviceTextName}>{device.name}</Text>
        <PressableOpacity
          style={styles.button}
          onPress={() => values.func().catch(console.error)}
        >
          <Text style={styles.textButton}>{values.text}</Text>
        </PressableOpacity>
        <Text style={styles.deviceTextStatus}>{pixelStatus?.status ?? ""}</Text>
      </View>
    );
  };

  // Get list of devices not if "disconnected" state
  // Note: such devices might be in the process of connecting or disconnecting
  const getNotDisconnected = () => {
    const devices: Device[] = [];
    scannedDevices.forEach((d) => {
      const pixelStatus = pixelStatuses.find(
        (e) => e.device.systemId === d.systemId
      );
      if (pixelStatus && pixelStatus.status !== "disconnected") {
        devices.push(d);
      }
    });
    return devices;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bluetooth Scanner</Text>
      <PressableOpacity
        style={styles.button}
        onPress={() =>
          bleHelper.scanForPixels(onDiscoveredDevice).catch(console.error)
        }
      >
        <Text style={styles.textButton}>Scan For Pixels!</Text>
      </PressableOpacity>
      <View style={styles.containerRow}>
        {scanning ? (
          <PressableOpacity
            style={styles.button}
            onPress={() => bleHelper.stopScanning().catch(console.error)}
          >
            <Text style={styles.textButton}>Stop</Text>
          </PressableOpacity>
        ) : (
          <></>
        )}
        {getNotDisconnected().length < scannedDevices.length ? (
          <PressableOpacity
            style={styles.button}
            onPress={() => setScannedDevices(getNotDisconnected())}
          >
            <Text style={styles.textButton}>Clear</Text>
          </PressableOpacity>
        ) : (
          <></>
        )}
      </View>
      {scanning && scannedDevices.length === 0 ? (
        <Text style={styles.textStatus}>Scanning...</Text>
      ) : (
        <ScrollView showsVerticalScrollIndicator>
          {scannedDevices.map((device) => (
            <View key={device.systemId} style={styles.deviceList}>
              {showDiceBox(device)}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// https://stackoverflow.com/a/68978207
const PressableOpacity = ({ children, style, ...props }: PressableProps) => {
  return (
    <Pressable
      style={({ pressed }) => [
        style as ViewStyle,
        { opacity: pressed ? 0.5 : 1.0 },
      ]}
      {...props}
    >
      <>{children}</>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  containerRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    paddingVertical: "5%",
  },
  button: {
    backgroundColor: "#841584",
    borderRadius: 8,
    paddingVertical: "3%",
    paddingHorizontal: "3%",
    marginVertical: "2%",
  },
  textButton: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  textStatus: {
    fontSize: 18,
    fontWeight: "bold",
  },
  deviceList: {
    flexDirection: "row",
    alignItems: "center",
  },
  deviceBox: {
    margin: "3%",
    backgroundColor: "lightgray",
    borderRadius: 10,
    paddingVertical: "2%",
    paddingHorizontal: "4%",
    width: "95%",
    flexDirection: "row",
    alignItems: "center",
  },
  deviceTextName: {
    fontSize: 18,
    fontWeight: "bold",
    marginRight: "3%",
  },
  deviceTextStatus: {
    fontSize: 18,
    marginLeft: "3%",
  },
});
