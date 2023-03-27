/**
 * Bluetooth UUIDs related to Pixels peripherals.
 */
const PixelBleUuids = {
  /** Pixel dice service UUID. */
  service: "6e400001-b5a3-f393-e0a9-e50e24dcca9e",

  /** Pixel dice notify characteristic UUID. */
  notifyCharacteristic: "6e400001-b5a3-f393-e0a9-e50e24dcca9e",

  /** Pixel dice write characteristic UUID. */
  writeCharacteristic: "6e400002-b5a3-f393-e0a9-e50e24dcca9e",

  /** The short UUID of the Nordic's DFU service. */
  dfuService: 0xfe59,
} as const;

export default PixelBleUuids;
