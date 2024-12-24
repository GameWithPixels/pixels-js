import { enumValue } from "@systemic-games/pixels-core-utils";

/**
 * The different possible battery states for a charger.
 * @enum
 * @category Message
 */
export const ChargerBatteryStateValues = {
  unknown: enumValue(0),
  /** Battery looks fine, nothing is happening. */
  ok: enumValue(),
  /** Battery level is low, notify user they should recharge. */
  low: enumValue(),
  /** Battery is currently recharging. */
  charging: enumValue(),
  /** Battery is full and finishing charging. */
  trickleCharging: enumValue(),
  /** Battery is full and finished charging. */
  done: enumValue(),
  /** Charge state doesn't make sense (charging but no coil voltage detected for instance). */
  error: enumValue(),
} as const;

/**
 * The names for the "enum" type {@link ChargerBatteryStateValues}.
 * @category Message
 */
export type ChargerBatteryState = keyof typeof ChargerBatteryStateValues;
