import { enumFlag, serializable } from "@systemic-games/pixels-core-utils";

import Condition from "./Condition";
import { ConditionType, ConditionTypeValues } from "./ConditionType";

/// <summary>
/// Flags used to indicate how we treat the face, whether we want to trigger if the
/// value is greater than the parameter, less, or equal, or any combination
/// </summary>
export const FaceCompareFlagsValues = {
  Less: enumFlag(0),
  Equal: enumFlag(),
  Greater: enumFlag(),
} as const;

/** The "enum" type for {@link FaceCompareFlagsValues}. */
export type FaceCompareFlags =
  typeof FaceCompareFlagsValues[keyof typeof FaceCompareFlagsValues];

/// <summary>
/// Condition that triggers when the Pixel has landed on a face
/// </summary>
export default class ConditionFaceCompare implements Condition {
  @serializable(1)
  type: ConditionType = ConditionTypeValues.FaceCompare;

  @serializable(1)
  faceIndex = 0;

  @serializable(1, { padding: 1 })
  flags: FaceCompareFlags = 0;
}
