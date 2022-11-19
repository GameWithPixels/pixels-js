/** Constants used across the pixels-core-connect package. */
const Constants = {
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
} as const;

export default Constants;
