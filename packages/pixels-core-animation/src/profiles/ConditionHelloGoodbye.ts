import { enumFlag, serializable } from "@systemic-games/pixels-core-utils";

import Condition from "./Condition";
import { ConditionType, ConditionTypeValues } from "./ConditionType";

/**
 * Indicates whether the condition should trigger on Hello,
 * Goodbye or both.
 * @category Profile Condition
 * @enum
 */
export const HelloGoodbyeFlagsValues = {
  Hello: enumFlag(0),
  Goodbye: enumFlag(),
} as const;

/**
 * The "enum" type for {@link HelloGoodbyeFlagsValues}.
 * @category Profile Condition
 */
export type HelloGoodbyeFlags =
  typeof HelloGoodbyeFlagsValues[keyof typeof HelloGoodbyeFlagsValues];

/**
 * Condition that triggers on a life state event
 * @category Profile Condition
 */
export default class ConditionHelloGoodbye implements Condition {
  @serializable(1)
  type: ConditionType = ConditionTypeValues.HelloGoodbye;

  @serializable(1, { padding: 2 })
  flags: HelloGoodbyeFlags = 0;
}
