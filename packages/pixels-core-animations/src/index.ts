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
import DataSet from "./DataSet";
import RgbKeyframe from "./animations/RgbKeyframe";
import RgbTrack from "./animations/RgbTrack";
import SimpleKeyframe from "./animations/SimpleKeyframe";
import Track from "./animations/Track";

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

import Color from "./color/Color";
import {
  toColor32,
  getRed,
  getGreen,
  getBlue,
  combineColors,
  interpolateColors,
  interpolateIntensity,
  modulateColor,
} from "./color/Color32Utils";
import { gamma8, gamma32, gamma, reverseGamma8 } from "./color/GammaUtils";

export {
  Color,
  toColor32,
  getRed,
  getGreen,
  getBlue,
  combineColors,
  interpolateColors,
  interpolateIntensity,
  modulateColor,
  gamma8,
  gamma32,
  gamma,
  reverseGamma8,
};

import Action from "./profiles/Action";
import ActionPlayAnimation from "./profiles/ActionPlayAnimation";
import ActionPlayAudioClip from "./profiles/ActionPlayAudioClip";
import { ActionTypeValues, type ActionType } from "./profiles/ActionType";

export {
  ActionTypeValues,
  type ActionType,
  Action,
  ActionPlayAnimation,
  ActionPlayAudioClip,
};

import Condition from "./profiles/Condition";
import {
  ConditionTypeValues,
  type ConditionType,
} from "./profiles/ConditionType";
import ConditionIdle from "./profiles/ConditionIdle";
import ConditionRolling from "./profiles/ConditionRolling";
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
import ConditionConnectionState, {
  ConnectionStateFlagsValues,
  type ConnectionStateFlags,
} from "./profiles/ConditionConnectionState";
import ConditionBatteryState, {
  BatteryStateFlagsValues,
  type BatteryStateFlags,
} from "./profiles/ConditionBatteryState";

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

import Rule from "./profiles/Rule";
import Profile from "./profiles/Profile";

export { Rule, Profile };
