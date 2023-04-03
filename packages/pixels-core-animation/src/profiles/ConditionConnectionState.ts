import { enumFlag, serializable } from "@systemic-games/pixels-core-utils";

import Condition from "./Condition";
import { ConditionTypeValues } from "./ConditionType";

/**
 * Indicates when the condition should trigger connected, disconnected, or both.
 * @category Profile Condition
 * @enum
 */
export const ConnectionStateFlagsValues = {
  connected: enumFlag(0),
  disconnected: enumFlag(),
};

/**
 * The names for the "enum" type {@link ConnectionStateFlagsValues}.
 * @category Profile Condition
 */
export type ConnectionStateFlags = keyof typeof ConnectionStateFlagsValues;

/**
 * Condition that triggers on connection events.
 * @category Profile Condition
 */
export default class ConditionConnectionState implements Condition {
  @serializable(1)
  type: number = ConditionTypeValues.connectionState;

  @serializable(1, { padding: 2 })
  flags: number = 0;
}
