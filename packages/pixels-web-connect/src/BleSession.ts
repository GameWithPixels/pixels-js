import {
  PixelSession,
  PixelsConnectUuids,
} from "@systemic-games/pixels-core-connect";

import { PixelsDevices } from "./PixelsDevices";

class BluetoothError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "BluetoothError";
  }
}

class ScanTimeoutError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "ScanTimeoutError";
  }
}

async function scanForDevice(device: BluetoothDevice): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      abortController.abort();
      reject(new ScanTimeoutError());
    }, 5000);
    const abortController = new AbortController();
    device.addEventListener("advertisementreceived", () => {
      clearTimeout(timeoutId);
      abortController.abort();
      resolve();
    });
    device
      .watchAdvertisements({
        signal: abortController.signal,
      })
      .catch((error) => reject(error));
  });
}

export class BleSessionError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "BleSessionError";
  }
}

/**
 * Represents a Bluetooth session with a Pixel die,
 * using Web Bluetooth.
 */
export default class BleSession extends PixelSession {
  private _device: BluetoothDevice;
  private _notify?: BluetoothRemoteGATTCharacteristic;
  private _write?: BluetoothRemoteGATTCharacteristic;
  private _disposeFunc: () => void;

  constructor(params: {
    systemId: string;
    name?: string;
    uuids: PixelsConnectUuids;
  }) {
    super(params);
    const device = PixelsDevices.getKnownDevice(params.systemId);
    if (!device) {
      throw new BleSessionError(
        `No known Bluetooth device with system id: ${params.systemId}`
      );
    }
    this._device = device;
    const name = device.name;
    name && this._setName(name);

    // Subscribe to disconnect event
    const onConnection = (/*ev: Event*/) => {
      // let reason: ConnectionEventReason = ConnectionEventReasonValues.Success;
      // if (this._connected) {
      //   // Disconnect not called by user code
      //   reason = this._reconnect
      //     ? ConnectionEventReasonValues.LinkLoss
      //     : ConnectionEventReasonValues.Timeout;
      // }
      const name = device.name;
      name && this._setName(name);
      // Notify disconnection
      this._notifyConnectionEvent("disconnected");
    };
    device.addEventListener("gattserverdisconnected", onConnection);
    this._disposeFunc = () => {
      this.setConnectionEventListener(undefined);
      device.addEventListener("gattserverdisconnected", onConnection);
    };
  }

  dispose(): void {
    this._disposeFunc();
  }

  async connect(timeoutMs: number): Promise<void> {
    const server = this._device.gatt;
    if (!server) {
      throw new BluetoothError("Gatt server not available");
    }
    if (!server.connected) {
      // Timeout
      let hasTimedOut = false;
      const setupTimeout = () =>
        timeoutMs > 0 &&
        setTimeout(() => {
          // Disconnect on timeout
          hasTimedOut = true;
          this.disconnect().catch(() => {});
        }, timeoutMs);
      let timeoutId = setupTimeout();

      try {
        // Attempt to connect
        this._notifyConnectionEvent("connecting");
        await server.connect();
      } catch (error) {
        let lastError = error as Error | undefined;
        if (
          //@ts-ignore watchAdvertisements() may not exist
          this._device.watchAdvertisements &&
          lastError?.message?.includes("no longer in range")
        ) {
          // Connection possibly failed because device was never scanned
          try {
            timeoutId && clearTimeout(timeoutId);
            await scanForDevice(this._device);
            timeoutId = setupTimeout();
            await server.connect();
            lastError = undefined;
          } catch (error) {
            if (!(error instanceof ScanTimeoutError)) {
              lastError = error as Error;
            }
          }
        }
        // Check if the error was caused by the connection timeout
        if (hasTimedOut) {
          lastError = new Error("Connection timeout");
        }
        if (lastError) {
          this._notifyConnectionEvent("disconnected");
          throw lastError;
        }
      } finally {
        timeoutId && clearTimeout(timeoutId);
      }

      // Get Pixel service and characteristics
      this._notifyConnectionEvent("connected");
      const service = await server.getPrimaryService(this._bleUuids.service);
      this._notify = await service.getCharacteristic(
        this._bleUuids.notifyCharacteristic
      );
      this._write = await service.getCharacteristic(
        this._bleUuids.writeCharacteristic
      );
    }
    // Note: always notify the ready state so a new status listener will
    //       get the notification if even the device was already connected.
    this._notifyConnectionEvent("ready");
  }

  async disconnect(): Promise<void> {
    this._device.gatt?.disconnect();
  }

  async subscribe(listener: (dataView: DataView) => void): Promise<() => void> {
    if (!this._notify) {
      throw new BleSessionError("Not connected");
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
      throw new BleSessionError("Not connected");
    }
    if (withoutResponse) {
      await this._write.writeValueWithoutResponse(data);
    } else {
      await this._write.writeValueWithResponse(data);
    }
  }
}
