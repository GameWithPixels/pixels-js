export type ScannedCharger = Readonly<{
  /** Device type is Pixels charger. */
  type: "charger";

  /** The unique id assigned by the system to the charger Bluetooth peripheral. */
  systemId: string;

  /** The unique charger id of the device. */
  pixelId: number;

  /** The Pixels die name. */
  name: string;

  /** The number of LEDs of the charger. */
  ledCount: number;

  /** The charger firmware build date. */
  firmwareDate: Date;

  /** The last RSSI value measured by the charger. */
  rssi: number;

  /** The charger battery level (percentage). */
  batteryLevel: number; // Percentage

  /**
   * Whether the charger internal battery is charging or not.
   * Set to 'true' if fully charged but still on charger.
   */
  isCharging: boolean;

  /** Bluetooth MAC address, 48 bits, Not available on iOS. */
  address: number;

  /** Timestamp when the advertisement data was received. */
  timestamp: Date;
}>;
