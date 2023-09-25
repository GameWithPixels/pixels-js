export const Constants = {
  // The lowest Maximum Transmission Unit (MTU) value allowed by the BLE standard.
  minMtu: 23,

  // The highest Maximum Transmission Unit (MTU) value allowed by the BLE standard.
  maxMtu: 517,

  // The default timeout value (in milliseconds) for requests send to a BLE peripheral.
  defaultRequestTimeout: 10000,

  ackMessageTimeout: 5000,

  maxMessageSize: 100,
} as const;
