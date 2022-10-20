import { PixelSession, PixelUuids } from "@systemic-games/pixels-core-connect";
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
    await Central.connectPeripheral(
      this.pixelSystemId,
      this._centralConnStatusCb
    );
  }

  async disconnect(): Promise<void> {
    await Central.disconnectPeripheral(this.pixelSystemId);
  }

  async subscribe(listener: (dataView: DataView) => void): Promise<() => void> {
    // if (!this._notify) {
    //   throw new Error("No connected");
    // }
    const internalListener = (
      ev: PeripheralCharacteristicValueChangedEvent
    ) => {
      if (ev.value?.buffer?.byteLength) {
        listener(ev.value);
      }
    };

    await Central.subscribeCharacteristic(
      this.pixelSystemId,
      PixelUuids.serviceUuid,
      PixelUuids.notifyCharacteristicUuid,
      internalListener
    );

    return () => {
      Central.unsubscribeCharacteristic(
        this.pixelSystemId,
        PixelUuids.serviceUuid,
        PixelUuids.notifyCharacteristicUuid
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
    //   throw new Error("No connected");
    // }
    await Central.writeCharacteristic(
      this.pixelSystemId,
      PixelUuids.serviceUuid,
      PixelUuids.writeCharacteristicUuid,
      data,
      { withoutResponse, timeoutMs }
    );
  }
}
