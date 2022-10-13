import { enumFlag, serializable } from "@systemic-games/pixels-core-utils";
import Condition from "./Condition";
import { ConditionType, ConditionTypeValues } from "./ConditionType";

/// <summary>
/// Indicate whether the condition should trigger on Hello, Goodbye or both
/// </summary>
export const HelloGoodbyeFlagsValues = {
  Hello: enumFlag(0),
  Goodbye: enumFlag(),
} as const;

/** The "enum" type for {@link HelloGoodbyeFlagsValues}. */
export type HelloGoodbyeFlags =
  typeof HelloGoodbyeFlagsValues[keyof typeof HelloGoodbyeFlagsValues];

/// <summary>
/// Condition that triggers on a life state event
/// </summary>
export default class ConditionHelloGoodbye implements Condition {
  @serializable(1)
  type: ConditionType = ConditionTypeValues.HelloGoodbye;

  @serializable(1, { padding: 2 })
  flags: HelloGoodbyeFlags = 0;
}
