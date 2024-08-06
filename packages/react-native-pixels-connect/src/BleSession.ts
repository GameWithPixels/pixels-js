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
  private _name: string | undefined;
  private readonly _centralConnStatusCb: (
    ev: PeripheralConnectionEvent
  ) => void;

  get pixelName(): string | undefined {
    return this._name;
  }

  constructor(systemId: string, name?: string) {
    super(systemId);
    this._name = name;
    this._centralConnStatusCb = (ev: PeripheralConnectionEvent) => {
      this._notifyConnectionEvent(ev.connectionStatus);
    };
  }

  async connect(): Promise<void> {
    try {
      // Update name
      const name = await Central.getPeripheralName(this.systemId);
      if (name) {
        // We may get null if Bluetooth is off
        this._name = name;
      }
    } catch (error) {
      // Will fail if peripheral was released
      console.log(
        `Error getting Pixel name (which was ${this._name}): ${error}`
      );
    }

    // And connect
    await Central.connectPeripheral(this.systemId, {
      connectionStatusCallback: this._centralConnStatusCb,
    });
  }

  async disconnect(): Promise<void> {
    await Central.disconnectPeripheral(this.systemId);
  }

  async subscribe(listener: (dataView: DataView) => void): Promise<() => void> {
    const internalListener = (
      ev: PeripheralCharacteristicValueChangedEvent
    ) => {
      if (ev.value?.length) {
        listener(new DataView(new Uint8Array(ev.value).buffer));
      }
    };

    await Central.subscribeCharacteristic(
      this.systemId,
      PixelBleUuids.dieService,
      PixelBleUuids.dieNotifyCharacteristic,
      internalListener
    );

    return () => {
      Central.unsubscribeCharacteristic(
        this.systemId,
        PixelBleUuids.dieService,
        PixelBleUuids.dieNotifyCharacteristic
      ).catch(() => {});
      // TODO (e) => this.log(`Error unsubscribing characteristic: ${e}`));
    };
  }

  async writeValue(
    data: ArrayBuffer,
    withoutResponse?: boolean,
    timeoutMs?: number // TODO default should be Constants.defaultRequestTimeout
  ): Promise<void> {
    await Central.writeCharacteristic(
      this.systemId,
      PixelBleUuids.dieService,
      PixelBleUuids.dieWriteCharacteristic,
      data,
      { withoutResponse, timeoutMs }
    );
  }
}
