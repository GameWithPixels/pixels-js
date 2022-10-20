import { PixelSession, PixelUuids } from "@systemic-games/pixels-core-connect";

// Chrome: chrome://flags/#enable-experimental-web-platform-features
// /!\ This flag might need to be set multiple time depending on how your run chrome
// (normally v.s. from a debug session with VS Code for example)

async function findBluetoothDevice(
  systemId: string
): Promise<BluetoothDevice | undefined> {
  const devices = await navigator?.bluetooth?.getDevices();
  return devices.find((d) => d.id === systemId);
}

/**
 * Represents a Bluetooth session with a Pixel die,
 * using Web Bluetooth.
 */
export default class BleSession extends PixelSession {
  private _name = "";
  private _notify?: BluetoothRemoteGATTCharacteristic;
  private _write?: BluetoothRemoteGATTCharacteristic;

  get pixelName(): string {
    return this._name;
  }

  async connect(): Promise<void> {
    const device = await findBluetoothDevice(this.pixelSystemId);
    if (!device) {
      throw new Error("Device not found");
    }

    // Update name
    this._name = device.name ?? "";

    // Subscribe to disconnect event
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const mySession = this;
    device.addEventListener("gattserverdisconnected", (/*ev: Event*/) => {
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

    const server = device.gatt;
    if (server) {
      if (!server.connected) {
        // Attempt to connect.
        this._notifyConnectionEvent("connecting");
        await server.connect();
        this._notifyConnectionEvent("connected");

        // Create session
        const service = await server.getPrimaryService(PixelUuids.serviceUuid);
        this._notify = await service.getCharacteristic(
          PixelUuids.notifyCharacteristicUuid
        );
        this._write = await service.getCharacteristic(
          PixelUuids.writeCharacteristicUuid
        );

        this._notifyConnectionEvent("ready");
      }
    }
  }

  async disconnect(): Promise<void> {
    const device = await findBluetoothDevice(this.pixelSystemId);
    device?.gatt?.disconnect();
  }

  async subscribe(listener: (dataView: DataView) => void): Promise<() => void> {
    if (!this._notify) {
      throw new Error("No connected");
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
      throw new Error("No connected");
    }
    if (withoutResponse) {
      await this._write.writeValueWithoutResponse(data);
    } else {
      await this._write.writeValueWithResponse(data);
    }
  }
}
