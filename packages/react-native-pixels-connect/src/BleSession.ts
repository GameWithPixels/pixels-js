import {
  PixelsConnectUuids,
  PixelSession,
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

  get pixelName(): string | undefined {
    return this._name;
  }

  constructor(params: {
    systemId: string;
    name?: string;
    uuids: PixelsConnectUuids;
  }) {
    super(params);
    this._name = params.name;
    const onConnection = (ev: PeripheralConnectionEvent) => {
      this._name = ev.peripheral.name;
      this._notifyConnectionEvent(ev.connectionStatus);
    };
    Central.addPeripheralConnectionListener(this.systemId, onConnection);
  }

  async connect(): Promise<void> {
    // And connect
    await Central.connectPeripheral(this.systemId);
  }

  async disconnect(): Promise<void> {
    await Central.disconnectPeripheral(this.systemId);
  }

  async subscribe(listener: (dataView: DataView) => void): Promise<() => void> {
    const onValueChange = (ev: PeripheralCharacteristicValueChangedEvent) => {
      if (ev.value?.length) {
        listener(new DataView(new Uint8Array(ev.value).buffer));
      }
    };

    await Central.subscribeCharacteristic(
      this.systemId,
      this._bleUuids.service,
      this._bleUuids.notifyCharacteristic,
      onValueChange
    );

    return () => {
      Central.unsubscribeCharacteristic(
        this.systemId,
        this._bleUuids.service,
        this._bleUuids.notifyCharacteristic,
        onValueChange
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
      this._bleUuids.service,
      this._bleUuids.writeCharacteristic,
      data,
      { withoutResponse, timeoutMs }
    );
  }
}
