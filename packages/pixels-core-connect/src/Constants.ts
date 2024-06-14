import { PixelDieType } from "@systemic-games/pixels-core-animation";

/** Constants used across the pixels-core-connect package. */
export const Constants = {
  /** The lowest Maximum Transmission Unit (MTU) value allowed by the BLE standard. */
  minMtu: 23,

  /** The highest Maximum Transmission Unit (MTU) value allowed by the BLE standard. */
  maxMtu: 517,

  /** The default timeout value (in milliseconds) when connecting to a Pixel. */
  connectionTimeout: 10000,

  /** The default timeout value (in milliseconds) for requests made to a Pixel. */
  defaultRequestTimeout: 10000,

  /** The default timeout value (in milliseconds) for waiting on a Pixel to reply. */
  ackMessageTimeout: 5000,

  /** The maximum size of messages send to a Pixel. */
  maxMessageSize: 100,

  /** The maximum byte size for the name of a Pixel. */
  maxNameByteSize: 31,

  /** The maximum byte size for the name of a Pixel in the advertisement data. */
  maxAdvertisedNameByteSize: 13,

  /** Messages and related data structures version number. */
  apiVersion: 256,

  /** Minimum compatible version for the messages and related data structures. */
  compatApiVersion: 256,

  /** Hash for firmware default profile. */
  factoryProfileHashes: {
    unknown: 0x57477a0b,
    d20: 0x57477a0b,
  } as { [key in PixelDieType]: number },
} as const;
