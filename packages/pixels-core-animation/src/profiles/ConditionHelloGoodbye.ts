import { enumFlag, serializable } from "@systemic-games/pixels-core-utils";

import Condition from "./Condition";
import { ConditionTypeValues } from "./ConditionType";

/**
 * Indicates whether the condition should trigger on Hello,
 * Goodbye or both.
 * @category Profile Condition
 * @enum
 */
export const HelloGoodbyeFlagsValues = {
  hello: enumFlag(0),
  goodbye: enumFlag(),
} as const;

/**
 * The names for the "enum" type {@link HelloGoodbyeFlagsValues}.
 * @category Profile Condition
 */
export type HelloGoodbyeFlags = keyof typeof HelloGoodbyeFlagsValues;

/**
 * Condition that triggers on a life state event
 * @category Profile Condition
 */
export default class ConditionHelloGoodbye implements Condition {
  @serializable(1)
  type: number = ConditionTypeValues.helloGoodbye;

  @serializable(1, { padding: 2 })
  flags: number = 0;
}
