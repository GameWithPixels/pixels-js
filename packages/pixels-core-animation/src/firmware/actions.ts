import { enumValue, serializable } from "@systemic-games/pixels-core-utils";

import { Animation } from "./animations";
import { ParameterOverride } from "./context";

/**
 * The different types of action we support. Yes, yes, it's only one right now :)
 */
export const ActionTypeValues = {
  unknown: enumValue(0),
  playAnimation: enumValue(),
  runOnDevice: enumValue(),
};

/**
 * The names for the "enum" type {@link ActionTypeValues}.
 * @category Animation
 */
export type ActionType = keyof typeof ActionTypeValues;

/**
 * Base struct for Actions. Stores the actual type so that we can cast the data
 * to the proper derived type and access the parameters.
 */
export interface Action {
  /** See {@link ActionTypeValues} for possible values. */
  type: number;
}

/**
 * Action to play an animation, really!
 */
export class ActionPlayAnimation implements Action {
  @serializable(1)
  type = ActionTypeValues.playAnimation;

  @serializable(1)
  faceIndex = 0;

  @serializable(1)
  loopCount = 1;

  animation?: Animation;
  @serializable(2)
  animOffset = 0;

  overrides?: ParameterOverride[];
  @serializable(2)
  overridesOffset = 0;
  @serializable(1)
  overridesLength = 0;
}

/**
 * Action to be run on a connected device
 */
export class ActionRunOnDevice implements Action {
  @serializable(1)
  type = ActionTypeValues.runOnDevice;

  @serializable(1)
  remoteActionType = 0; // Type of remote action

  @serializable(2)
  actionId = 0; // The id of the remote action
}
