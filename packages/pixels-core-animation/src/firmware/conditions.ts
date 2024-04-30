import {
  enumFlag,
  enumValue,
  serializable,
} from "@systemic-games/pixels-core-utils";

/**
 * The types of conditions we support!
 */
export const ConditionTypeValues = {
  unknown: enumValue(0),
  helloGoodbye: enumValue(),
  handling: enumValue(),
  rolling: enumValue(),
  faceCompare: enumValue(),
  crooked: enumValue(),
  connectionState: enumValue(),
  batteryState: enumValue(),
  idle: enumValue(),
  rolled: enumValue(),
};

/**
 * The names for the "enum" type {@link ConditionTypeValues}.
 * @category Animation
 */
export type ConditionType = keyof typeof ConditionTypeValues;

/**
 * The base struct for all conditions, stores a type identifier so we can tell the actual
 * type of the condition and fetch the condition parameters correctly.
 */
export interface Condition {
  /** See {@link ConditionTypeValues} for possible values. */
  type: number;
}

/**
 * Condition that triggers when the die is idle for a while
 */
export class ConditionIdle implements Condition {
  @serializable(1)
  type = ConditionTypeValues.idle;

  @serializable(2)
  repeatPeriod = 0;

  // No stored parameter for now

  // bool checkTrigger(Modules:: Accelerometer:: RollState newState, int newFaceIndex) const ;
}

/**
 * Condition that triggers when the die is being handled
 */
export class ConditionHandling implements Condition {
  @serializable(1)
  type = ConditionTypeValues.handling;

  // No stored parameter for now

  // bool checkTrigger(Modules:: Accelerometer:: RollState newState, int newFaceIndex) const ;
}

/**
 * Condition that triggers when the die is being rolled
 */
export class ConditionRolling implements Condition {
  @serializable(1)
  type = ConditionTypeValues.rolling;

  @serializable(2)
  repeatPeriod = 0; // 0 means do NOT repeat

  // No parameter for now

  // bool checkTrigger(Modules:: Accelerometer:: RollState newState, int newFaceIndex) const ;
}

/**
 * Condition that triggers when the die has landed by is crooked
 */
export class ConditionCrooked implements Condition {
  @serializable(1)
  type = ConditionTypeValues.crooked;

  // No parameter for now

  // bool checkTrigger(Modules:: Accelerometer:: RollState newState, int newFaceIndex) const ;
}

/**
 * Flags used to indicate how we treat the face, whether we want to trigger if the
 * value is greater than the parameter, less, or equal, or any combination
 */
export const ConditionFaceCompareFlagsValues = {
  less: enumFlag(0),
  equal: enumFlag(),
  greater: enumFlag(),
};

/**
 * The names for the "enum" type {@link ConditionFaceCompareFlagsValues}.
 * @category Animation
 */
export type ConditionFaceCompareFlags =
  keyof typeof ConditionFaceCompareFlagsValues;

/**
 * Condition that triggers when the die has landed on a face
 */
export class ConditionFaceCompare implements Condition {
  @serializable(1)
  type = ConditionTypeValues.faceCompare;

  @serializable(1)
  faceIndex = 0;

  @serializable(1)
  flags = ConditionFaceCompareFlagsValues.less;

  // bool checkTrigger(Modules:: Accelerometer:: RollState newState, int newFaceIndex) const ;
}

/**
 * Condition that triggers when the die has landed on a face, using a bitfield to check the faces
 */
export class ConditionRolled implements Condition {
  @serializable(1)
  type = ConditionTypeValues.rolled;

  @serializable(4)
  faceMask = 0;

  // bool checkTrigger(Modules:: Accelerometer:: RollState newState, int newFaceIndex) const;
}

/**
 * Indicate whether the condition should trigger on Hello, Goodbye or both
 */
export const ConditionHelloGoodbyeFlagsValues = {
  hello: enumFlag(0),
  goodbye: enumFlag(),
};

/**
 * The names for the "enum" type {@link ConditionHelloGoodbyeFlagsValues}.
 * @category Animation
 */
export type ConditionHelloGoodbyeFlags =
  keyof typeof ConditionHelloGoodbyeFlagsValues;

/**
 * Condition that triggers on a life state event
 */
export class ConditionHelloGoodbye implements Condition {
  @serializable(1)
  type = ConditionTypeValues.helloGoodbye;

  @serializable(1)
  flags = ConditionHelloGoodbyeFlagsValues.hello;

  // bool checkTrigger(bool isHello) const;
}

/**
 * Indicates when the condition should trigger, connected!, disconnected! or both
 */
export const ConditionConnectionStateFlagsValues = {
  connected: enumFlag(0),
  disconnected: enumFlag(),
};

/**
 * The names for the "enum" type {@link ConditionConnectionStateFlagsValues}.
 * @category Animation
 */
export type ConditionConnectionStateFlags =
  keyof typeof ConditionConnectionStateFlagsValues;

/**
 * Condition that triggers on connection events
 */
export class ConditionConnectionState implements Condition {
  @serializable(1)
  type = ConditionTypeValues.connectionState;

  @serializable(1)
  flags = ConditionConnectionStateFlagsValues.connected;

  // bool checkTrigger(bool connected) const;
}

/**
 * Indicates which battery event the condition should trigger on
 */
export const ConditionBatteryStateFlagsValues = {
  ok: enumFlag(0),
  low: enumFlag(),
  charging: enumFlag(),
  done: enumFlag(),
  badCharging: enumFlag(),
  error: enumFlag(),
};

/**
 * The names for the "enum" type {@link ConditionBatteryStateFlagsValues}.
 * @category Animation
 */
export type ConditionBatteryStateFlags =
  keyof typeof ConditionBatteryStateFlagsValues;

/**
 * Condition that triggers on battery state events
 */
export class ConditionBatteryState implements Condition {
  @serializable(1)
  type = ConditionTypeValues.batteryState;

  @serializable(1)
  flags = ConditionBatteryStateFlagsValues.ok;

  @serializable(2)
  repeatPeriod = 0;

  // bool checkTrigger(Modules:: BatteryController:: BatteryState newState) const;
}
