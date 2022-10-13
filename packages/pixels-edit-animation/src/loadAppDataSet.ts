import {
  AnimationTypeValues,
  ActionTypeValues,
  ConditionTypeValues,
  Color,
} from "@systemic-games/pixels-core-animation";
import AppDataSet from "./AppDataSet";
import { ColorTypeValues } from "./edit/ColorType";
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
import { safeAssign } from "@systemic-games/pixels-core-utils";

export interface JsonRgbColor {
  r?: number;
  g?: number;
  b?: number;
}

export interface JsonKeyframe {
  time?: number;
  color?: JsonRgbColor;
}

export interface JsonGradient {
  //TODO empty, duration, firstTime, lastTime not needed
  keyframes?: JsonKeyframe[];
}

export interface JsonPattern {
  name?: string;
  gradients?: JsonGradient[];
  //TODO not needed duration?: number;
}

export interface JsonAudioClip {
  name?: string;
  id?: number;
}

export interface JsonPreviewSettings {
  design?: number;
}

export interface JsonColor {
  type: number;
  rgbColor: JsonRgbColor;
}

export interface JsonAnimationData {
  name?: string;
  duration?: number;
  count?: number;
  fade?: number;
  faces?: number;
  patternIndex?: number;
  traveling?: boolean;
  overrideWithFace?: boolean;
  color?: JsonColor;
  gradient?: JsonGradient;
  defaultPreviewSettings?: JsonPreviewSettings;
}

export interface JsonAnimation {
  type?: number;
  data?: JsonAnimationData;
}

export interface JsonConditionData {
  flags?: number;
  faceIndex?: number;
  recheckAfter?: number;
  period?: number;
}

export interface JsonCondition {
  type?: number;
  data?: JsonConditionData;
}

export interface JsonActionData {
  animationIndex?: number;
  faceIndex?: number;
  loopCount?: number;
  audioClipIndex?: number;
}

export interface JsonAction {
  type?: number;
  data?: JsonActionData;
}

export interface JsonRule {
  condition?: JsonCondition;
  actions?: JsonAction[];
}

export interface JsonProfile {
  name?: string | null; //TODO remove null
  description?: string | null; //TODO remove null
  rules?: JsonRule[];
  defaultPreviewSettings?: JsonPreviewSettings;
}

export interface JsonDataSet {
  jsonVersion?: number;
  patterns?: JsonPattern[];
  animations?: JsonAnimation[];
  audioClips?: JsonAudioClip[]; //TODO Moved after animations
  behaviors?: JsonProfile[]; //TODO rename to profiles
  defaultBehavior?: JsonProfile; //TODO rename to defaultProfile
}

function toRgbColor(color?: JsonRgbColor): Color {
  return Color.fromBytes(color?.r ?? 0, color?.g ?? 0, color?.b ?? 0);
}

function toKeyframes(keyframes?: JsonKeyframe[]): EditRgbKeyframe[] {
  return (
    keyframes?.map((k) => new EditRgbKeyframe(k.time, toRgbColor(k.color))) ??
    []
  );
}

function toGradients(gradients?: JsonGradient[]): EditRgbGradient[] {
  return (
    gradients?.map((g) => new EditRgbGradient(toKeyframes(g.keyframes))) ?? []
  );
}

function toColor(color?: JsonColor): EditColor {
  const c = new EditColor();
  if (color) {
    switch (color.type) {
      case ColorTypeValues.Rgb:
      case ColorTypeValues.Face:
      case ColorTypeValues.Random:
        c.type = color.type;
        break;
      default:
        throw Error(`Unsupported color type ${color.type}`);
    }
    c.color = toRgbColor(color?.rgbColor);
  }
  return c;
}

function toPatterns(patterns?: JsonPattern[]): EditPattern[] {
  return (
    patterns?.map((p) => new EditPattern(p.name, toGradients(p.gradients))) ??
    []
  );
}

function toAudioClips(audioClips?: JsonAudioClip[]): EditAudioClip[] {
  return audioClips?.map((ac) => safeAssign(new EditAudioClip(), ac)) ?? [];
}

function toCondition(condition?: JsonCondition): EditCondition | undefined {
  if (condition?.data) {
    const data = condition.data;
    //TODO make those creations and assignments in a more generic way
    //TODO check flags value
    switch (condition.type) {
      case ConditionTypeValues.HelloGoodbye:
        return safeAssign(new EditConditionHelloGoodbye(), data);
      case ConditionTypeValues.Handling:
        return new EditConditionHandling();
      case ConditionTypeValues.Rolling:
        return safeAssign(new EditConditionRolling(), data);
      case ConditionTypeValues.FaceCompare:
        return safeAssign(new EditConditionFaceCompare(), data);
      case ConditionTypeValues.Crooked:
        return new EditConditionCrooked();
      case ConditionTypeValues.ConnectionState:
        return safeAssign(new EditConditionConnectionState(), data);
      case ConditionTypeValues.BatteryState:
        return safeAssign(new EditConditionBatteryState(), data);
      case ConditionTypeValues.Idle:
        return safeAssign(new EditConditionIdle(), data);
      default:
        throw Error(`Unsupported condition type ${condition.type}`);
    }
  }
}

function toActions(
  animations: EditAnimation[],
  audioClips: EditAudioClip[],
  actions?: JsonAction[]
): EditAction[] {
  const actionsWithData = actions?.filter((act) => !!act.data) as {
    type?: number;
    data: JsonActionData;
  }[];
  return (
    actionsWithData?.map((act) => {
      const data = act.data;
      //TODO make those creations and assignments in a more generic way
      switch (act.type) {
        case ActionTypeValues.PlayAnimation:
          return safeAssign(new EditActionPlayAnimation(), {
            animation: animations[data.animationIndex ?? -1],
            faceIndex: data.faceIndex,
            loopCount: data.loopCount,
          });
        case ActionTypeValues.PlayAudioClip:
          return safeAssign(new EditActionPlayAudioClip(), {
            clip: audioClips[data.audioClipIndex ?? -1],
          });
        default:
          throw Error(`Unsupported action type ${act.type}`);
      }
    }) ?? []
  );
}

function toRules(
  animations: EditAnimation[],
  audioClips: EditAudioClip[],
  rules?: JsonRule[]
): EditRule[] {
  return (
    rules?.map((r) => {
      const rule = new EditRule();
      rule.condition = toCondition(r.condition);
      rule.actions.push(...toActions(animations, audioClips, r.actions));
      return rule;
    }) ?? []
  );
}

function toProfile(
  animations: EditAnimation[],
  audioClips: EditAudioClip[],
  profile: JsonProfile
): EditProfile {
  return new EditProfile(
    profile.name ?? "",
    profile.description ?? "",
    toRules(animations, audioClips, profile.rules)
  );
}

export default function (jsonData: JsonDataSet): AppDataSet {
  const patterns = toPatterns(jsonData.patterns);
  const audioClips = toAudioClips(jsonData.audioClips);
  const animationsWithData = jsonData?.animations?.filter(
    (anim) => !!anim.data
  ) as {
    type?: number;
    data: JsonAnimationData;
  }[];
  const animations =
    animationsWithData?.map((anim) => {
      const data = anim.data;
      switch (anim.type) {
        //TODO make those creations and assignments in a more generic way
        case AnimationTypeValues.Simple:
          return new EditAnimationSimple({
            name: data.name,
            duration: data.duration,
            faces: data.faces,
            color: toColor(data.color),
            count: data.count,
            fade: data.fade,
          }) as EditAnimation;
        case AnimationTypeValues.Rainbow:
          return new EditAnimationRainbow({
            name: data.name,
            duration: data.duration,
            faces: data.faces,
            count: data.count,
            fade: data.fade,
            traveling: data.traveling,
          }) as EditAnimation;
        case AnimationTypeValues.Keyframed:
          return new EditAnimationKeyframed({
            name: data.name,
            duration: data.duration,
            pattern: patterns[data.patternIndex ?? -1],
            flowOrder: data.traveling,
          }) as EditAnimation;
        case AnimationTypeValues.GradientPattern:
          return new EditAnimationGradientPattern({
            name: data.name,
            duration: data.duration,
            pattern: patterns[data.patternIndex ?? -1],
            gradient: new EditRgbGradient(
              toKeyframes(data.gradient?.keyframes)
            ),
            overrideWithFace: data.overrideWithFace,
          }) as EditAnimation;
        case AnimationTypeValues.Gradient:
          return new EditAnimationGradient({
            name: data.name,
            duration: data.duration,
            faces: data.faces,
            gradient: new EditRgbGradient(
              toKeyframes(data.gradient?.keyframes)
            ),
          }) as EditAnimation;
        default:
          throw Error(`Unsupported animation type ${anim.type}`);
      }
    }) ?? [];
  const toMyProfile = (profile: JsonProfile) =>
    toProfile(animations, audioClips, profile);
  return new AppDataSet({
    patterns,
    animations,
    audioClips,
    profiles: jsonData?.behaviors?.map(toMyProfile) ?? [],
    defaultProfile: jsonData?.defaultBehavior
      ? toMyProfile(jsonData.defaultBehavior)
      : undefined,
  });
}
