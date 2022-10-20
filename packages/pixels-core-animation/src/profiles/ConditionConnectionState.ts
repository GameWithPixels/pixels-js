import { enumFlag, serializable } from "@systemic-games/pixels-core-utils";

import Condition from "./Condition";
import { ConditionType, ConditionTypeValues } from "./ConditionType";

/// <summary>
/// Indicates when the condition should trigger, connected!, disconnected! or both
/// </summary>
export const ConnectionStateFlagsValues = {
  Connected: enumFlag(0),
  Disconnected: enumFlag(),
};

/** The "enum" type for {@link ConnectionStateFlagsValues}. */
export type ConnectionStateFlags =
  typeof ConnectionStateFlagsValues[keyof typeof ConnectionStateFlagsValues];

/// <summary>
/// Condition that triggers on connection events
/// </summary>
export default class ConditionConnectionState implements Condition {
  @serializable(1)
  type: ConditionType = ConditionTypeValues.ConnectionState;

  @serializable(1, { padding: 2 })
  flags: ConnectionStateFlags = 0;
}
