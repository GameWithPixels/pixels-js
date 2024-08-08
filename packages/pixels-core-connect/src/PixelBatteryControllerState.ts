import { enumValue } from "@systemic-games/pixels-core-utils";

/**
 * The different possible battery charging states.
 * @enum
 * @category Message
 */
export const PixelBatteryControllerStateValues = {
  unknown: enumValue(0),
  // Battery looks fine, nothing is happening
  ok: enumValue(),
  // Battery voltage is so low the die might turn off at any time
  empty: enumValue(),
  // Battery level is low, notify user they should recharge
  low: enumValue(),
  // Coil voltage is bad, but we don't know yet if that's because we just put the die
  // on the coil, or if indeed the die is incorrectly positioned
  transitionOn: enumValue(),
  // Coil voltage is bad, but we don't know yet if that's because we removed the die and
  // the coil cap is still discharging, or if indeed the die is incorrectly positioned
  transitionOff: enumValue(),
  // Coil voltage is bad, die is probably positioned incorrectly
  // Note that currently this state is triggered during transition between charging and not charging...
  badCharging: enumValue(),
  // Charge state doesn't make sense (charging but no coil voltage detected for instance)
  error: enumValue(),
  // Battery is currently recharging, but still really low
  chargingLow: enumValue(),
  // Battery is currently recharging
  charging: enumValue(),
  // Battery is currently cooling down
  cooldown: enumValue(),
  // Battery is currently recharging, but at 99%
  trickle: enumValue(),
  // Battery is full and finished charging
  done: enumValue(),
  // Battery is too cold
  lowTemp: enumValue(),
  // Battery is too hot
  highTemp: enumValue(),
} as const;

/**
 * The names for the "enum" type {@link PixelBatteryControllerStateValues}.
 * @category Message
 */
export type PixelBatteryControllerState =
  keyof typeof PixelBatteryControllerStateValues;
