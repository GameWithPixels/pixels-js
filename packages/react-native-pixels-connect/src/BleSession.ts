import {
  PixelsBluetoothIds,
  PixelSession,
} from "@systemic-games/pixels-core-connect";
import {
  Central,
  CentralEventMap,
} from "@systemic-games/react-native-bluetooth-le";

import { ScannedDevicesRegistry } from "./ScannedDevicesRegistry";

/**
 * Represents a Bluetooth session with a Pixel die,
 * using Web Bluetooth.
 */
export default class BleSession extends PixelSession {
  readonly type: "die" | "charger";
  private _disposeFunc: () => void;

  constructor(type: BleSession["type"], systemId: string, name?: string) {
    super(systemId, name);
    this.type = type;
    const onConnection = (
      ev: CentralEventMap["peripheralConnectionStatus"]
    ) => {
      if (!this.pixelName) {
        // Only set the name if it's not already set, as the current name may be more up-to-date because of OS caching
        this._setName(ev.peripheral.name);
      }
      this._notifyConnectionEvent(ev.connectionStatus, ev.reason);
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
    const { service, notifyCharacteristic } = this.getBleUuids();
    await Central.subscribeCharacteristic(
      this.systemId,
      service,
      notifyCharacteristic,
      (ev) =>
        ev.value?.length &&
        listener(new DataView(new Uint8Array(ev.value).buffer))
    );
    return () => {
      Central.unsubscribeCharacteristic(
        this.systemId,
        service,
        notifyCharacteristic
      ).catch(() => {});
      // TODO (e) => this.log(`Error unsubscribing characteristic: ${e}`));
    };
  }

  async writeValue(
    data: ArrayBuffer,
    withoutResponse?: boolean,
    timeoutMs?: number // TODO default should be Constants.defaultRequestTimeout
  ): Promise<void> {
    const { service, writeCharacteristic } = this.getBleUuids();
    await Central.writeCharacteristic(
      this.systemId,
      service,
      writeCharacteristic,
      data,
      { withoutResponse, timeoutMs }
    );
  }

  private getBleUuids(): typeof PixelsBluetoothIds.die {
    switch (this.type) {
      case "die":
        return !ScannedDevicesRegistry.hasLegacyService(this.systemId)
          ? PixelsBluetoothIds.die // Default for dice
          : PixelsBluetoothIds.legacyDie;
      case "charger":
        return PixelsBluetoothIds.charger;
    }
  }
}
