export type ScannedCharger = Readonly<{
  /** Device type is Pixels charger. */
  type: "charger";

  /** The unique id assigned by the system to the Pixel Bluetooth peripheral. */
  systemId: string;

  /** The unique Pixel id of the device. */
  pixelId: number;

  /** The Pixels die name. */
  name: string;

  /** The number of LEDs of the Pixel. */
  ledCount: number;

  /** The Pixel firmware build date. */
  firmwareDate: Date;

  /** The last RSSI value measured by the Pixel. */
  rssi: number;

  /** The Pixel battery level (percentage). */
  batteryLevel: number; // Percentage

  /**
   * Whether the Pixel battery is charging or not.
   * Set to 'true' if fully charged but still on charger.
   */
  isCharging: boolean;

  /** Bluetooth MAC address, 48 bits, Not available on iOS. */
  address: number;

  /** Timestamp when the advertisement data was received. */
  timestamp: Date;
}>;
