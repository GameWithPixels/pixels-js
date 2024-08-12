/**
 * Bluetooth UUIDs for a Pixels' peripheral service and characteristics.
 * @category Pixels
 */
export type PixelsConnectUuids = {
  /** Pixel device service UUID. */
  service: string;

  /** Pixel device notify characteristic UUID. */
  notifyCharacteristic: string;

  /** Pixel device write characteristic UUID. */
  writeCharacteristic: string;
};

/**
 * Bluetooth IDs and UUIDs related to Pixels peripherals.
 * @category Pixels
 */
export const PixelsBluetoothIds = {
  /** Service and characteristic UUIDs of a Pixels die. */
  pixel: {
    /** Die service UUID. */
    service: "6e400001-b5a3-f393-e0a9-e50e24dcca9e",

    /** Die notify characteristic UUID. */
    notifyCharacteristic: "6e400001-b5a3-f393-e0a9-e50e24dcca9e",

    /** Die write characteristic UUID. */
    writeCharacteristic: "6e400002-b5a3-f393-e0a9-e50e24dcca9e",
  } as Readonly<PixelsConnectUuids>,

  /** Service and characteristic UUIDs of a Pixels charger. */
  charger: {
    /** Large charging case (LCC) service UUID. */
    service: "a8b90001-8d5e-4411-bd7a-cb49359d1f05",

    /** Large charging case (LCC) notify characteristic UUID. */
    notifyCharacteristic: "a8b90002-8d5e-4411-bd7a-cb49359d1f05",

    /** Large charging case (LCC) write characteristic UUID. */
    writeCharacteristic: "a8b90003-8d5e-4411-bd7a-cb49359d1f05",
  } as Readonly<PixelsConnectUuids>,

  /** Nordic's DFU service short UUID. */
  dfuService: 0xfe59,

  /** Systemic Games company identifier. */
  systemicGamesCompanyId: 0x0d39,
} as const;
