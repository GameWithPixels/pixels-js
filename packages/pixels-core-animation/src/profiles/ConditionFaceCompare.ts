import { enumFlag, serializable } from "@systemic-games/pixels-core-utils";

import Condition from "./Condition";
import { ConditionType, ConditionTypeValues } from "./ConditionType";

/**
 * Flags used to indicate how we treat the face,
 * whether we want to trigger if the  value is greater than the parameter,
 * less, or equal, or any combination.
 * @category Profile Condition
 * @enum
 */
export const FaceCompareFlagsValues = {
  Less: enumFlag(0),
  Equal: enumFlag(),
  Greater: enumFlag(),
} as const;

/**
 * The "enum" type for {@link FaceCompareFlagsValues}.
 * @category Profile Condition
 */
export type FaceCompareFlags =
  typeof FaceCompareFlagsValues[keyof typeof FaceCompareFlagsValues];

/**
 * Condition that triggers when the Pixel has landed on a face.
 * @category Profile Condition
 */
export default class ConditionFaceCompare implements Condition {
  @serializable(1)
  type: ConditionType = ConditionTypeValues.FaceCompare;

  @serializable(1)
  faceIndex = 0;

  @serializable(1, { padding: 1 })
  flags: FaceCompareFlags = 0;
}
