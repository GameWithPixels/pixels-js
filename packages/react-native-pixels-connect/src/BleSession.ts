import {
  PixelSession,
  PixelBleUuids,
} from "@systemic-games/pixels-core-connect";
import {
  Central,
  PeripheralCharacteristicValueChangedEvent,
  PeripheralConnectionEvent,
} from "@systemic-games/react-native-bluetooth-le";

/**
 * Represents a Bluetooth session with a Pixel die,
 * using Web Bluetooth.
 */
export default class BleSession extends PixelSession {
  private _name = "";
  private readonly _centralConnStatusCb: (
    ev: PeripheralConnectionEvent
  ) => void;

  get pixelName(): string {
    return this._name;
  }

  constructor(deviceSystemId: string) {
    super(deviceSystemId);
    this._centralConnStatusCb = (ev: PeripheralConnectionEvent) => {
      this._notifyConnectionEvent(ev.connectionStatus);
    };
  }

  async connect(): Promise<void> {
    try {
      // Update name
      this._name = await Central.getPeripheralName(this.pixelSystemId);
    } catch {
      this._name = "";
    }

    // And connect
    await Central.connectPeripheral(this.pixelSystemId, {
      connectionStatusCallback: this._centralConnStatusCb,
    });
  }

  async disconnect(): Promise<void> {
    await Central.disconnectPeripheral(this.pixelSystemId);
  }

  async subscribe(listener: (dataView: DataView) => void): Promise<() => void> {
    // if (!this._notify) {
    //   throw new Error("Not connected");
    // }
    const internalListener = (
      ev: PeripheralCharacteristicValueChangedEvent
    ) => {
      if (ev.value?.length) {
        listener(new DataView(new Uint8Array(ev.value).buffer));
      }
    };

    await Central.subscribeCharacteristic(
      this.pixelSystemId,
      PixelBleUuids.service,
      PixelBleUuids.notifyCharacteristic,
      internalListener
    );

    return () => {
      Central.unsubscribeCharacteristic(
        this.pixelSystemId,
        PixelBleUuids.service,
        PixelBleUuids.notifyCharacteristic
      ).catch(() => {});
      //TODO (e) => this.log(`Error unsubscribing characteristic: ${e}`));
    };
  }

  async writeValue(
    data: ArrayBuffer,
    withoutResponse?: boolean,
    timeoutMs?: number // TODO default should be Constants.defaultRequestTimeout
  ): Promise<void> {
    // if (!this._write) {
    //   throw new Error("Not connected");
    // }
    await Central.writeCharacteristic(
      this.pixelSystemId,
      PixelBleUuids.service,
      PixelBleUuids.writeCharacteristic,
      data,
      { withoutResponse, timeoutMs }
    );
  }
}
