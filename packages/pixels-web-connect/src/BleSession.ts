import {
  PixelSession,
  PixelBleUuids,
} from "@systemic-games/pixels-core-connect";

import PixelDevices from "./PixelDevices";

/**
 * Represents a Bluetooth session with a Pixel die,
 * using Web Bluetooth.
 */
export default class BleSession extends PixelSession {
  private _name = "";
  private _device: BluetoothDevice;
  private _notify?: BluetoothRemoteGATTCharacteristic;
  private _write?: BluetoothRemoteGATTCharacteristic;

  constructor(deviceSystemId: string) {
    super(deviceSystemId);
    const device = PixelDevices.getDevice(deviceSystemId);
    if (!device) {
      throw new Error(
        `No known Bluetooth device with system id: ${deviceSystemId}`
      );
    }
    this._device = device;
  }

  get pixelName(): string {
    return this._name;
  }

  async connect(): Promise<void> {
    // Update name
    this._name = this._device.name ?? "";

    // Subscribe to disconnect event
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const mySession = this;
    this._device.addEventListener("gattserverdisconnected", (/*ev: Event*/) => {
      // let reason: ConnectionEventReason = ConnectionEventReasonValues.Success;
      // if (this._connected) {
      //   // Disconnect not called by user code
      //   reason = this._reconnect
      //     ? ConnectionEventReasonValues.LinkLoss
      //     : ConnectionEventReasonValues.Timeout;
      // }

      // Notify disconnection
      mySession._notifyConnectionEvent("disconnected");
    });

    const server = this._device.gatt;
    if (server && !server.connected) {
      // Attempt to connect
      this._notifyConnectionEvent("connecting");
      await server.connect();
      this._notifyConnectionEvent("connected");

      const service = await server.getPrimaryService(PixelBleUuids.service);
      this._notify = await service.getCharacteristic(
        PixelBleUuids.notifyCharacteristic
      );
      this._write = await service.getCharacteristic(
        PixelBleUuids.writeCharacteristic
      );
      this._notifyConnectionEvent("ready");
    }
  }

  async disconnect(): Promise<void> {
    this._device.gatt?.disconnect();
  }

  async subscribe(listener: (dataView: DataView) => void): Promise<() => void> {
    if (!this._notify) {
      throw new Error("Not connected");
    }
    function internalListener(this: BluetoothRemoteGATTCharacteristic) {
      if (this.value?.buffer?.byteLength) {
        listener(this.value);
      }
    }
    const notifyCharac = this._notify;
    notifyCharac.addEventListener(
      "characteristicvaluechanged",
      internalListener
    );
    await notifyCharac.startNotifications();
    return () => {
      notifyCharac.removeEventListener(
        "characteristicvaluechanged",
        internalListener
      );
    };
  }

  async writeValue(
    data: ArrayBuffer,
    withoutResponse?: boolean,
    _timeoutMs?: number // Default is Constants.defaultRequestTimeout
  ): Promise<void> {
    if (!this._write) {
      throw new Error("Not connected");
    }
    if (withoutResponse) {
      await this._write.writeValueWithoutResponse(data);
    } else {
      await this._write.writeValueWithResponse(data);
    }
  }
}
