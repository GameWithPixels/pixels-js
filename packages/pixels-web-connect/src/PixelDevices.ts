import { PixelBleUuids } from "@systemic-games/pixels-core-connect";

const _devices = new Map<string, BluetoothDevice>();

/** Singleton that manages a list of Bluetooth device for Pixels. */
const PixelDevices = {
  /**
   * Ask user to select a Bluetooth device for a Pixel.
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
   * Retrieve a Bluetooth device for a Pixel that's been previously requested with {@link requestDevice}
   * @param systemId The system id of the Pixel device.
   * @returns The corresponding BluetoothDevice if found, or undefined.
   */
  getDevice: (systemId: string): BluetoothDevice | undefined => {
    return _devices.get(systemId);
  },
};

export default PixelDevices;
