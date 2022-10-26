import DataSet from "./DataSet";
import AnimationBits from "./animations/AnimationBits";
import AnimationGradient from "./animations/AnimationGradient";
import AnimationGradientPattern from "./animations/AnimationGradientPattern";
import AnimationKeyframed from "./animations/AnimationKeyframed";
import AnimationNoise from "./animations/AnimationNoise";
import AnimationPreset from "./animations/AnimationPreset";
import AnimationRainbow from "./animations/AnimationRainbow";
import AnimationSimple from "./animations/AnimationSimple";
import {
  AnimationTypeValues,
  type AnimationType,
} from "./animations/AnimationType";
import Constants from "./animations/Constants";
import RgbKeyframe from "./animations/RgbKeyframe";
import RgbTrack from "./animations/RgbTrack";
import SimpleKeyframe from "./animations/SimpleKeyframe";
import Track from "./animations/Track";
import Color from "./color/Color";
import Action from "./profiles/Action";
import ActionPlayAnimation from "./profiles/ActionPlayAnimation";
import ActionPlayAudioClip from "./profiles/ActionPlayAudioClip";
import { ActionTypeValues, type ActionType } from "./profiles/ActionType";
import Condition from "./profiles/Condition";
import ConditionBatteryState, {
  BatteryStateFlagsValues,
  type BatteryStateFlags,
} from "./profiles/ConditionBatteryState";
import ConditionConnectionState, {
  ConnectionStateFlagsValues,
  type ConnectionStateFlags,
} from "./profiles/ConditionConnectionState";
import ConditionCrooked from "./profiles/ConditionCrooked";
import ConditionFaceCompare, {
  FaceCompareFlagsValues,
  type FaceCompareFlags,
} from "./profiles/ConditionFaceCompare";
import ConditionHandling from "./profiles/ConditionHandling";
import ConditionHelloGoodbye, {
  HelloGoodbyeFlagsValues,
  type HelloGoodbyeFlags,
} from "./profiles/ConditionHelloGoodbye";
import ConditionIdle from "./profiles/ConditionIdle";
import ConditionRolling from "./profiles/ConditionRolling";
import {
  ConditionTypeValues,
  type ConditionType,
} from "./profiles/ConditionType";
import Profile from "./profiles/Profile";
import Rule from "./profiles/Rule";

export {
  AnimationBits,
  AnimationGradient,
  AnimationGradientPattern,
  AnimationKeyframed,
  AnimationNoise,
  AnimationPreset,
  AnimationRainbow,
  AnimationSimple,
  AnimationTypeValues,
  type AnimationType,
  Constants,
  DataSet,
  RgbKeyframe,
  RgbTrack,
  SimpleKeyframe,
  Track,
};

export { Color };

export {
  ActionTypeValues,
  type ActionType,
  Action,
  ActionPlayAnimation,
  ActionPlayAudioClip,
};

export {
  Condition,
  ConditionTypeValues,
  type ConditionType,
  ConditionIdle,
  ConditionRolling,
  ConditionCrooked,
  ConditionFaceCompare,
  FaceCompareFlagsValues,
  type FaceCompareFlags,
  ConditionHandling,
  ConditionHelloGoodbye,
  HelloGoodbyeFlagsValues,
  type HelloGoodbyeFlags,
  ConditionConnectionState,
  ConnectionStateFlagsValues,
  type ConnectionStateFlags,
  ConditionBatteryState,
  BatteryStateFlagsValues,
  type BatteryStateFlags,
};

export { Rule, Profile };

export * from "./color/colorUtils";
export * from "./color/color32Utils";
export * from "./color/gammaUtils";
