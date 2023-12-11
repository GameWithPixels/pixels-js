import {
  AnimationTypeValues,
  ActionTypeValues,
  ConditionTypeValues,
  Color,
  AnimationFlagsValues,
} from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import AppDataSet from "./AppDataSet";
import { ColorModeValues } from "./edit/ColorMode";
import EditAction from "./edit/EditAction";
import EditActionPlayAnimation from "./edit/EditActionPlayAnimation";
import EditActionPlayAudioClip from "./edit/EditActionPlayAudioClip";
import EditAnimation from "./edit/EditAnimation";
import EditAnimationGradient from "./edit/EditAnimationGradient";
import EditAnimationGradientPattern from "./edit/EditAnimationGradientPattern";
import EditAnimationKeyframed from "./edit/EditAnimationKeyframed";
import EditAnimationRainbow from "./edit/EditAnimationRainbow";
import EditAnimationSimple from "./edit/EditAnimationSimple";
import EditAudioClip from "./edit/EditAudioClip";
import EditColor from "./edit/EditColor";
import EditCondition from "./edit/EditCondition";
import EditConditionBatteryState from "./edit/EditConditionBatteryState";
import EditConditionConnectionState from "./edit/EditConditionConnectionState";
import EditConditionCrooked from "./edit/EditConditionCrooked";
import EditConditionFaceCompare from "./edit/EditConditionFaceCompare";
import EditConditionHandling from "./edit/EditConditionHandling";
import EditConditionHelloGoodbye from "./edit/EditConditionHelloGoodbye";
import EditConditionIdle from "./edit/EditConditionIdle";
import EditConditionRolling from "./edit/EditConditionRolling";
import EditPattern from "./edit/EditPattern";
import EditProfile from "./edit/EditProfile";
import EditRgbGradient from "./edit/EditRgbGradient";
import EditRgbKeyframe from "./edit/EditRgbKeyframe";
import EditRule from "./edit/EditRule";
import * as Json from "./jsonTypes";

function toRgbColor(color?: Json.RgbColor): Color {
  return Color.fromBytes(color?.r ?? 0, color?.g ?? 0, color?.b ?? 0);
}

function toKeyframes(keyframes?: Json.Keyframe[]): EditRgbKeyframe[] {
  return (
    keyframes?.map(
      (k) => new EditRgbKeyframe({ time: k.time, color: toRgbColor(k.color) })
    ) ?? []
  );
}

function toGradients(gradients?: Json.Gradient[]): EditRgbGradient[] {
  return (
    gradients?.map(
      (g) => new EditRgbGradient({ keyframes: toKeyframes(g.keyframes) })
    ) ?? []
  );
}

function toColor(color?: Json.Color): EditColor {
  if (color) {
    switch (color.type) {
      case ColorModeValues.rgb:
        return new EditColor(toRgbColor(color?.rgbColor));
      case ColorModeValues.face:
        return new EditColor("face");
      case ColorModeValues.random:
        return new EditColor("random");
      default:
        throw Error(`Unsupported color type ${color.type}`);
    }
  } else {
    return new EditColor();
  }
}

export function toPattern(pattern: Json.Pattern): EditPattern {
  return new EditPattern({
    name: pattern.name,
    gradients: toGradients(pattern.gradients),
  });
}

function toPatterns(patterns?: Json.Pattern[]): EditPattern[] {
  return patterns?.map(toPattern) ?? [];
}

function toAudioClips(audioClips?: Json.AudioClip[]): EditAudioClip[] {
  return audioClips?.map((ac) => new EditAudioClip(ac)) ?? [];
}

function toCondition(condition: Json.Condition): EditCondition {
  if (condition.data) {
    const data = condition.data;
    // TODO make those creations and assignments in a more generic way
    // TODO check flags value
    switch (condition.type) {
      case ConditionTypeValues.helloGoodbye:
        return safeAssign(new EditConditionHelloGoodbye(), data);
      case ConditionTypeValues.handling:
        return new EditConditionHandling();
      case ConditionTypeValues.rolling:
        return safeAssign(new EditConditionRolling(), data);
      case ConditionTypeValues.rolled:
        return safeAssign(new EditConditionFaceCompare(), {
          ...data,
          face: data.faceIndex && data.faceIndex + 1,
        });
      case ConditionTypeValues.crooked:
        return new EditConditionCrooked();
      case ConditionTypeValues.connection:
        return safeAssign(new EditConditionConnectionState(), data);
      case ConditionTypeValues.battery:
        return safeAssign(new EditConditionBatteryState(), data);
      case ConditionTypeValues.idle:
        return safeAssign(new EditConditionIdle(), data);
      default:
        throw Error(`Unsupported condition type ${condition.type}`);
    }
  } else {
    throw Error("No data for the condition");
  }
}

function toActions(
  animations: EditAnimation[],
  audioClips: EditAudioClip[],
  actions: Json.Action[]
): EditAction[] {
  const validActions = actions?.filter(
    (act): act is Required<Json.Action> => !!act.type && !!act.data
  );
  return (
    validActions?.map((act) => {
      const data = act.data;
      // TODO make those creations and assignments in a more generic way
      switch (act.type) {
        case ActionTypeValues.playAnimation:
          return safeAssign(new EditActionPlayAnimation(), {
            animation: animations[data.animationIndex ?? -1],
            face:
              data.faceIndex &&
              (data.faceIndex > 0 ? data.faceIndex + 1 : data.faceIndex),
            loopCount: data.loopCount,
          });
        case ActionTypeValues.playAudioClip:
          return safeAssign(new EditActionPlayAudioClip(), {
            clip: audioClips[data.audioClipIndex ?? -1],
          });
        default:
          throw Error(`Unsupported action type ${act.type}`);
      }
    }) ?? []
  );
}

export function toRules(
  animations: EditAnimation[],
  audioClips: EditAudioClip[],
  rules?: Json.Rule[]
): EditRule[] {
  const validRules = rules?.filter(
    (r): r is Required<Json.Rule> => !!r.condition && !!r.actions
  );
  return (
    validRules?.map(
      (r) =>
        new EditRule(toCondition(r.condition), {
          actions: toActions(animations, audioClips, r.actions),
        })
    ) ?? []
  );
}

export function toProfile(
  profile: Json.Profile,
  animations: EditAnimation[],
  audioClips: EditAudioClip[]
): EditProfile {
  return new EditProfile({
    name: profile.name ?? undefined,
    description: profile.description ?? undefined,
    rules: toRules(animations, audioClips, profile.rules),
  });
}

export function toAnimation(
  anim: Required<Json.Animation>,
  patterns: EditPattern[]
): EditAnimation {
  const data = anim.data;
  switch (anim.type) {
    // TODO make those creations and assignments in a more generic way
    case AnimationTypeValues.simple:
      return new EditAnimationSimple({
        name: data.name,
        duration: data.duration,
        faces: data.faces,
        color: toColor(data.color),
        count: data.count,
        fade: data.fade,
      }) as EditAnimation;
    case AnimationTypeValues.rainbow:
      return new EditAnimationRainbow({
        name: data.name,
        duration: data.duration,
        animFlags: data.traveling
          ? AnimationFlagsValues.traveling | AnimationFlagsValues.useLedIndices
          : 0,
        faces: data.faces,
        count: data.count,
        fade: data.fade,
        cycles: 1,
      }) as EditAnimation;
    case AnimationTypeValues.keyframed:
      return new EditAnimationKeyframed({
        name: data.name,
        duration: data.duration,
        pattern: patterns[data.patternIndex ?? -1],
      }) as EditAnimation;
    case AnimationTypeValues.gradientPattern:
      return new EditAnimationGradientPattern({
        name: data.name,
        duration: data.duration,
        pattern: patterns[data.patternIndex ?? -1],
        gradient: new EditRgbGradient({
          keyframes: toKeyframes(data.gradient?.keyframes),
        }),
        overrideWithFace: data.overrideWithFace,
      }) as EditAnimation;
    case AnimationTypeValues.gradient:
      return new EditAnimationGradient({
        name: data.name,
        duration: data.duration,
        faces: data.faces,
        gradient: new EditRgbGradient({
          keyframes: toKeyframes(data.gradient?.keyframes),
        }),
      }) as EditAnimation;
    default:
      throw Error(`Unsupported animation type ${anim.type}`);
  }
}

export function loadAppDataSet(jsonData: Json.DataSet): AppDataSet {
  const patterns = toPatterns(jsonData.patterns);
  const validAnimations = jsonData?.animations?.filter(
    (anim): anim is Required<Json.Animation> => !!anim.type && !!anim.data
  );
  const animations =
    validAnimations?.map((anim) => toAnimation(anim, patterns)) ?? [];
  const audioClips = toAudioClips(jsonData.audioClips);
  return new AppDataSet({
    patterns,
    animations,
    audioClips,
    profiles:
      jsonData?.behaviors?.map((p) => toProfile(p, animations, audioClips)) ??
      [],
    defaultProfile: jsonData?.defaultBehavior
      ? toProfile(jsonData.defaultBehavior, animations, audioClips)
      : undefined,
  });
}
