import { PixelBleUuids } from "@systemic-games/pixels-core-connect";

const _devices = new Map<string, BluetoothDevice>();

/** Singleton that manages a list of Bluetooth devices for Pixels. */
export const PixelsDevices = {
  /**
   * Request the user to select a Bluetooth device among a list of
   * scanned Pixels dice.
   * @returns A promise resolving to a BluetoothDevice for a Pixel.
   */
  requestDevice: async (): Promise<BluetoothDevice> => {
    if (!navigator?.bluetooth?.requestDevice) {
      throw new Error(
        "Bluetooth is not available, check that you're running in a secure environment" +
          " and that Web Bluetooth is enabled."
      );
    }
    // Request user to select a Pixel
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [PixelBleUuids.service] }],
    });
    _devices.set(device.id, device);
    return device;
  },

  /**
   * Returns the Bluetooth device for a Pixels die that's been previously
   * requested with {@link requestDevice}
   * @param id The unique id of the Bluetooth device as assigned by the system.
   * @returns The corresponding BluetoothDevice if found, or undefined.
   */
  getKnownDevice: (id: string): BluetoothDevice | undefined => {
    return _devices.get(id);
  },

  /**
   * Returns the Bluetooth device for a Pixels die that's been previously
   * authorized by the user in this or previous browser sessions.
   * @param id The unique id of the Bluetooth device as assigned by the system.
   * @returns The corresponding BluetoothDevice if found, or undefined.
   */
  getDevice: async (id: string): Promise<BluetoothDevice | undefined> => {
    let device = _devices.get(id);
    if (!device && navigator?.bluetooth?.getDevices) {
      const authorizedDevices = await navigator.bluetooth.getDevices();
      device = authorizedDevices.find((d) => d.id === id);
      if (device) {
        _devices.set(device.id, device);
      }
    }
    return device;
  },
};
