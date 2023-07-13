/**
 * Gives information about the various level of Web Bluetooth support.
 */
export interface BluetoothCapabilities {
  /** Whether Web Bluetooth is available at all. */
  bluetooth: boolean;
  /**
   * Whether the "Use the new permissions backend for Web Bluetooth"
   * flag is enabled in Chrome, which allow the browser storing
   * access permissions on per site - per device basis.
   */
  persistentPermissions: boolean;
}

/**
 * Check if Web Bluetooth is available in the current context and if Bluetooth
 * devices previously authorized by the user may be directly re-connected without
 * needing to prompt the user (see {@link getPixel}).
 * @returns A {@link BluetoothCapabilities} object.
 */
export function getBluetoothCapabilities(): BluetoothCapabilities {
  return {
    bluetooth: !!navigator?.bluetooth?.requestDevice,
    persistentPermissions: !!navigator?.bluetooth?.getDevices,
  };
}
