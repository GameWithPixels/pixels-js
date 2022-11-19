/**
 * Bluetooth UUIDs related to Pixels peripherals.
 */
const PixelUuids = {
  /** Pixel dice service UUID. */
  serviceUuid: "6e400001-b5a3-f393-e0a9-e50e24dcca9e",

  /** Pixel dice notify characteristic UUID. */
  notifyCharacteristicUuid: "6e400001-b5a3-f393-e0a9-e50e24dcca9e",

  /** Pixel dice write characteristic UUID. */
  writeCharacteristicUuid: "6e400002-b5a3-f393-e0a9-e50e24dcca9e",

  /** The short UUID of the Nordic's DFU service. */
  dfuServiceShortUuid: 0xfe59,
} as const;

export default PixelUuids;
