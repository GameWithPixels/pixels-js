import { enumValue } from "@systemic-games/pixels-core-utils";

/**
 * Available modes for telemetry requests.
 * @enum
 * @category Message
 */
export const TelemetryRequestModeValues = {
  /* Request Pixel to stop automatically sending telemetry updates. */
  off: enumValue(0),

  /* Request Pixel to immediately send a single telemetry update. */
  once: enumValue(),

  /* Request Pixel to automatically send telemetry updates. */
  automatic: enumValue(),
} as const;

/**
 * The names for the "enum" type {@link TelemetryRequestModeValues}.
 * @category Message
 */
export type TelemetryRequestMode = keyof typeof TelemetryRequestModeValues;
