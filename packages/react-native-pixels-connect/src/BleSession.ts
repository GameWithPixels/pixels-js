import {
  PixelsConnectUuids,
  PixelSession,
} from "@systemic-games/pixels-core-connect";
import {
  Central,
  CentralEventMap,
} from "@systemic-games/react-native-bluetooth-le";

/**
 * Represents a Bluetooth session with a Pixel die,
 * using Web Bluetooth.
 */
export default class BleSession extends PixelSession {
  private _disposeFunc: () => void;

  constructor(params: {
    systemId: string;
    name?: string;
    uuids: PixelsConnectUuids;
  }) {
    super(params);
    const onConnection = (
      ev: CentralEventMap["peripheralConnectionStatus"]
    ) => {
      this._setName(ev.peripheral.name);
      this._notifyConnectionEvent(ev.connectionStatus);
    };
    Central.addPeripheralConnectionListener(this.systemId, onConnection);
    this._disposeFunc = () => {
      this.setConnectionEventListener(undefined);
      Central.removePeripheralConnectionListener(this.systemId, onConnection);
    };
  }

  dispose(): void {
    this._disposeFunc();
  }

  // Note: Android will timeout after 30s
  async connect(timeoutMs: number): Promise<void> {
    // And connect
    await Central.connectPeripheral(this.systemId, timeoutMs);
  }

  async disconnect(): Promise<void> {
    await Central.disconnectPeripheral(this.systemId);
  }

  async subscribe(listener: (dataView: DataView) => void): Promise<() => void> {
    await Central.subscribeCharacteristic(
      this.systemId,
      this._bleUuids.service,
      this._bleUuids.notifyCharacteristic,
      (ev) =>
        ev.value?.length &&
        listener(new DataView(new Uint8Array(ev.value).buffer))
    );
    return () => {
      Central.unsubscribeCharacteristic(
        this.systemId,
        this._bleUuids.service,
        this._bleUuids.notifyCharacteristic
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
