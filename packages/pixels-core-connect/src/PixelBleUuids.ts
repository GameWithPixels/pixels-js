/**
 * Bluetooth UUIDs related to Pixels peripherals.
 * @category Pixels
 */
export const PixelBleUuids = {
  /** Die service UUID. */
  dieService: "6e400001-b5a3-f393-e0a9-e50e24dcca9e",

  /** Die notify characteristic UUID. */
  dieNotifyCharacteristic: "6e400001-b5a3-f393-e0a9-e50e24dcca9e",

  /** Die write characteristic UUID. */
  dieWriteCharacteristic: "6e400002-b5a3-f393-e0a9-e50e24dcca9e",

  /** Large charging case (LCC) service UUID. */
  chargerService: "a8b90001-8d5e-4411-bd7a-cb49359d1f05",

  /** Large charging case (LCC) notify characteristic UUID. */
  chargerNotifyCharacteristic: "a8b90002-8d5e-4411-bd7a-cb49359d1f05",

  /** Large charging case (LCC) write characteristic UUID. */
  chargerWriteCharacteristic: "a8b90003-8d5e-4411-bd7a-cb49359d1f05",

  /** Nordic's DFU service short UUID. */
  dfuService: 0xfe59,

  /** Systemic Games company identifier. */
  systemicGamesCompanyId: 0x0d39,
} as const;
