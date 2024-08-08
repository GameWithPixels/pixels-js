import { enumValue } from "@systemic-games/pixels-core-utils";

/**
 * The different possible battery charging states.
 * @enum
 * @category Message
 */
export const PixelBatteryStateValues = {
  /** Battery looks fine, nothing is happening. */
  ok: enumValue(0),
  /** Battery level is low, notify user they should recharge. */
  low: enumValue(),
  /** Battery is currently recharging. */
  charging: enumValue(),
  /** Battery is full and finished charging. */
  done: enumValue(),
  /**
   * Coil voltage is bad, die is probably positioned incorrectly.
   * Note that currently this state is triggered during transition between charging and not charging...
   */
  badCharging: enumValue(),
  /** Charge state doesn't make sense (charging but no coil voltage detected for instance). */
  error: enumValue(),
} as const;

/**
 * The names for the "enum" type {@link PixelBatteryStateValues}.
 * @category Message
 */
export type PixelBatteryState = keyof typeof PixelBatteryStateValues;
