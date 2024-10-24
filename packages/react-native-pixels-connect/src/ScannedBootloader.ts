export interface ScannedBootloader {
  /** Device type is Bootloader. */
  type: "bootloader";

  /** The type of Pixels device. */
  deviceType: "die" | "charger";

  /** The unique id assigned by the system to the Bluetooth peripheral. */
  systemId: string;

  /** The unique Pixel id of the device (if applicable). */
  pixelId: number;

  /** The Pixels die name. */
  name: string;

  /** The last RSSI value measured by the peripheral. */
  rssi: number;

  /** Bluetooth MAC address, 48 bits, Not available on iOS. */
  address: number;

  /** Timestamp when the advertisement data was received. */
  timestamp: Date;
}
