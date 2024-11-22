export type ScannedMPC = Readonly<{
  /** Device type is Pixels MPC. */
  type: "mpc";

  /** The unique id assigned by the system to the MPC Bluetooth peripheral. */
  systemId: string;

  /** The unique MPC id of the device. */
  pixelId: number;

  /** The Pixels die name. */
  name: string;

  /** The number of LEDs of the MPC. */
  ledCount: number;

  /** The MPC firmware build date. */
  firmwareDate: Date;

  /** The last RSSI value measured by the MPC. */
  rssi: number;

  /** The MPC battery level (percentage). */
  batteryLevel: number; // Percentage

  /**
   * Whether the MPC internal battery is charging or not.
   * Set to 'true' if fully charged but still on charger.
   */
  isCharging: boolean;

  /** Bluetooth MAC address, 48 bits, Not available on iOS. */
  address: number;

  /** Timestamp when the advertisement data was received. */
  timestamp: Date;
}>;
