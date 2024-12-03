import {
  AnimationFlagsValues,
  BatteryStateFlagsValues,
  Color,
  ColorUtils,
  ConnectionStateFlagsValues,
  FaceCompareFlagsValues,
  HelloGoodbyeFlagsValues,
  NoiseColorOverrideTypeValues,
  NormalsColorOverrideTypeValues,
} from "@systemic-games/pixels-core-animation";
import {
  assert,
  assertNever,
  bitsToFlags,
  combineFlags,
  keysToValues,
  range,
  valuesToKeys,
} from "@systemic-games/pixels-core-utils";

import {
  AnimationGradientData,
  AnimationGradientPatternData,
  AnimationPatternData,
  AnimationNoiseData,
  AnimationRainbowData,
  AnimationSetData,
  AnimationFlashesData,
  AnimationNormalsData,
  AnimationCycleData,
  AnimationSequenceData,
} from "./animations";
import { fromColor, toColor } from "./color";
import {
  CompositeProfileData,
  createCompositeActionSetData,
  createCompositeConditionSetData,
} from "./compositeProfile";
import { GradientData } from "./gradient";
import { toKeyframes, fromKeyframes } from "./keyframes";
import { PatternData } from "./pattern";
import {
  ProfileData,
  createActionSetData,
  createConditionSetData,
} from "./profile";
import {
  EditAction,
  EditActionPlayAnimation,
  EditActionPlayAudioClip,
  EditAnimation,
  EditAnimationCycle,
  EditAnimationGradient,
  EditAnimationGradientPattern,
  EditAnimationKeyframed,
  EditAnimationNoise,
  EditAnimationNormals,
  EditAnimationRainbow,
  EditAnimationSequence,
  EditAnimationSequenceItem,
  EditAnimationSimple,
  EditCompositeActionPlayMcpAnimation,
  EditCompositeConditionResult,
  EditCompositeConditionRollTag,
  EditCompositeProfile,
  EditCondition,
  EditConditionBatteryState,
  EditConditionConnectionState,
  EditConditionCrooked,
  EditConditionFaceCompare,
  EditConditionHandling,
  EditConditionHelloGoodbye,
  EditConditionIdle,
  EditConditionRolled,
  EditConditionRolling,
  EditPattern,
  EditProfile,
  EditRgbGradient,
  EditRule,
} from "../edit";
import EditActionMakeWebRequest from "../edit/EditActionMakeWebRequest";
import EditActionSpeakText from "../edit/EditActionSpeakText";

export function toProfile(
  data: Readonly<ProfileData>,
  getAnimation: (uuid: string) => EditAnimation | undefined,
  allowMissingDependency = false
): EditProfile {
  const checkGetAnimation = (uuid?: string): EditAnimation | undefined => {
    if (uuid) {
      const anim = getAnimation(uuid);
      if (!allowMissingDependency && !anim) {
        throw new Error(`toProfile(): No animation with uuid ${uuid}`);
      }
      return anim;
    }
  };

  const rules = data.rules.map((r) => {
    let condition: EditCondition;
    const condType = r.condition.type;
    const index = r.condition.index;
    switch (condType) {
      case "helloGoodbye":
        {
          const condData = data.conditions.helloGoodbye[index];
          assert(
            condData,
            `No data for ${condType} condition at index ${index}`
          );
          condition = new EditConditionHelloGoodbye({
            ...condData,
            flags: combineFlags(
              keysToValues(condData.flags, HelloGoodbyeFlagsValues)
            ),
          });
        }
        break;
      case "handling":
        condition = new EditConditionHandling();
        break;
      case "rolling":
        {
          const condData = data.conditions.rolling[index];
          assert(
            condData,
            `No data for ${condType} condition at index ${index}`
          );
          condition = new EditConditionRolling(condData);
        }
        break;
      case "rolled":
        {
          const condData = data.conditions.rolled[index];
          assert(
            condData,
            `No data for ${condType} condition at index ${index}`
          );
          condition = new EditConditionRolled({
            ...condData,
            faces: condData.faces,
          });
        }
        break;
      case "crooked":
        condition = new EditConditionCrooked();
        break;
      case "connection":
        {
          const condData = data.conditions.connection[index];
          assert(
            condData,
            `No data for ${condType} condition at index ${index}`
          );
          condition = new EditConditionConnectionState({
            ...condData,
            flags: combineFlags(
              keysToValues(condData.flags, ConnectionStateFlagsValues)
            ),
          });
        }
        break;
      case "battery":
        {
          const condData = data.conditions.battery[index];
          assert(
            condData,
            `No data for ${condType} condition at index ${index}`
          );
          condition = new EditConditionBatteryState({
            ...condData,
            flags: combineFlags(
              keysToValues(condData.flags, BatteryStateFlagsValues)
            ),
          });
        }
        break;
      case "idle":
        {
          const condData = data.conditions.idle[index];
          assert(
            condData,
            `No data for ${condType} condition at index ${index}`
          );
          condition = new EditConditionIdle(condData);
        }
        break;
      default:
        assertNever(condType, `Unsupported condition type: ${condType}`);
    }
    const actions = r.actions.map((a) => {
      const actType = a.type;
      switch (actType) {
        case "playAnimation": {
          const actData = data.actions.playAnimation[a.index];
          assert(actData, `No data for ${actType} action at index ${a.index}`);
          return new EditActionPlayAnimation({
            ...actData,
            animation: checkGetAnimation(actData.animationUuid),
            colors: actData.colors.map((c) => new Color(c)),
          });
        }
        case "playAudioClip": {
          const actData = data.actions.playAudioClip[a.index];
          assert(actData, `No data for ${actType} action at index ${a.index}`);
          return new EditActionPlayAudioClip(actData);
        }
        case "makeWebRequest": {
          const actData = data.actions.makeWebRequest[a.index];
          assert(actData, `No data for ${actType} action at index ${a.index}`);
          return new EditActionMakeWebRequest(actData);
        }
        case "speakText": {
          const actData = data.actions.speakText[a.index];
          assert(actData, `No data for ${actType} action at index ${a.index}`);
          return new EditActionSpeakText(actData);
        }
        default:
          assertNever(actType, `Unsupported action type: ${actType}`);
      }
    });
    return new EditRule(condition, actions);
  });
  return new EditProfile({
    ...data,
    rules,
    creationDate: new Date(data.creationDate),
    lastModified: new Date(data.lastModified),
  });
}

export function toAnimation<T extends keyof AnimationSetData>(
  type: T,
  data: Readonly<AnimationSetData[T][number]>,
  getAnimation: (uuid: string) => EditAnimation | undefined,
  getPattern: (uuid: string) => EditPattern | undefined,
  getGradient: (uuid: string) => EditRgbGradient | undefined,
  allowMissingDependency = false
): EditAnimation {
  const checkGetAnim = (uuid: string): EditAnimation => {
    const anim = getAnimation(uuid);
    if (!anim) {
      throw new Error(`toAnimation(): No animation with uuid ${uuid}`);
    }
    return anim;
  };
  const checkGetPattern = (uuid?: string): EditPattern | undefined => {
    if (uuid) {
      const pattern = getPattern(uuid);
      if (!allowMissingDependency && !pattern) {
        throw new Error(`toAnimation(): No pattern with uuid ${uuid}`);
      }
      return pattern;
    }
  };
  const checkGetGradient = (uuid?: string): EditRgbGradient | undefined => {
    if (uuid) {
      const gradient = getGradient(uuid);
      if (!allowMissingDependency && !gradient) {
        throw new Error(`toAnimation(): No gradient with uuid ${uuid}`);
      }
      return gradient;
    }
  };
  const animFlags = combineFlags(
    keysToValues(data.animFlags, AnimationFlagsValues)
  );
  switch (type) {
    case "flashes": {
      const animData = data as AnimationFlashesData;
      return new EditAnimationSimple({
        ...animData,
        animFlags,
        color: toColor(animData.color),
      });
    }
    case "rainbow": {
      const animData = data as AnimationRainbowData;
      return new EditAnimationRainbow({
        ...animData,
        animFlags,
      });
    }
    case "pattern": {
      const animData = data as AnimationPatternData;
      return new EditAnimationKeyframed({
        ...animData,
        animFlags,
        pattern: checkGetPattern(animData.patternUuid),
      });
    }
    case "gradientPattern": {
      const animData = data as AnimationGradientPatternData;
      return new EditAnimationGradientPattern({
        ...animData,
        animFlags,
        pattern: checkGetPattern(animData.patternUuid),
        gradient: checkGetGradient(animData.gradientUuid),
      });
    }
    case "gradient": {
      const animData = data as AnimationGradientData;
      return new EditAnimationGradient({
        ...animData,
        animFlags,
        gradient: checkGetGradient(animData.gradientUuid),
      });
    }
    case "noise": {
      const animData = data as AnimationNoiseData;
      return new EditAnimationNoise({
        ...animData,
        animFlags,
        gradient: checkGetGradient(animData.gradientUuid),
        blinkGradient: checkGetGradient(animData.blinkGradientUuid),
        gradientColorType:
          NoiseColorOverrideTypeValues[animData.gradientColorType],
      });
    }
    case "normals": {
      const animData = data as AnimationNormalsData;
      return new EditAnimationNormals({
        ...animData,
        animFlags,
        gradient: checkGetGradient(animData.gradientUuid),
        axisGradient: checkGetGradient(animData.axisGradientUuid),
        angleGradient: checkGetGradient(animData.angleGradientUuid),
        gradientColorType:
          NormalsColorOverrideTypeValues[animData.gradientColorType],
      });
    }
    case "cycle": {
      const animData = data as AnimationCycleData;
      return new EditAnimationCycle({
        ...animData,
        animFlags,
        gradient: checkGetGradient(animData.gradientUuid),
      });
    }
    case "sequence": {
      const animData = data as AnimationSequenceData;
      return new EditAnimationSequence({
        ...animData,
        animFlags,
        animations: animData.animations.map(
          (a) => new EditAnimationSequenceItem(checkGetAnim(a.uuid), a.delay)
        ),
      });
    }
    default:
      assertNever(type, `Unsupported animation type: ${type}`);
  }
}

export function toPattern(data: Readonly<PatternData>): EditPattern {
  return new EditPattern({
    ...data,
    gradients: data.gradients.map(
      (g) => new EditRgbGradient({ keyframes: toKeyframes(g.keyframes) })
    ),
  });
}

export function toGradient(data: Readonly<GradientData>): EditRgbGradient {
  return new EditRgbGradient({
    ...data,
    keyframes: toKeyframes(data.keyframes),
  });
}

// undefined means "all faces"
export function fromFaceCompare(flags: number, face: number): number[] {
  const isEq = flags & FaceCompareFlagsValues.equal ? 1 : 0;
  const lessOrEqual =
    FaceCompareFlagsValues.less | FaceCompareFlagsValues.equal;
  const greaterOrEqual =
    FaceCompareFlagsValues.greater | FaceCompareFlagsValues.equal;
  return !flags || face <= 0
    ? []
    : (face === 20 && (flags & lessOrEqual) === lessOrEqual) ||
        (face === 1 && (flags & greaterOrEqual) === greaterOrEqual)
      ? range(1, 21)
      : flags & FaceCompareFlagsValues.less
        ? range(1, face + isEq)
        : flags & FaceCompareFlagsValues.greater
          ? range(face + 1 - isEq, 21)
          : [face];
}

export function fromProfile(profile: Readonly<EditProfile>): ProfileData {
  const conditions = createConditionSetData();
  const actions = createActionSetData();
  const rules = profile.rules.map((r) => {
    return addConditionData(r, conditions, actions);
  });
  return {
    uuid: profile.uuid,
    name: profile.name,
    description: profile.description,
    dieType: profile.dieType,
    colorway: profile.colorway,
    brightness: profile.brightness,
    creationDate: profile.creationDate.getTime(),
    lastModified: profile.lastModified.getTime(),
    conditions,
    actions,
    rules,
  };
}

function addConditionData(
  rule: Readonly<EditRule>,
  conditions: ProfileData["conditions"],
  actions: ProfileData["actions"]
): ProfileData["rules"][number] {
  const { type } = rule.condition;
  let index = 0;
  switch (type) {
    case "none":
      throw new Error(`Invalid condition type: ${type}`);
    case "handling":
    case "crooked":
      break;
    case "helloGoodbye":
      {
        index = conditions[type].length;
        const cond = rule.condition as EditConditionHelloGoodbye;
        conditions[type].push({
          flags: valuesToKeys(bitsToFlags(cond.flags), HelloGoodbyeFlagsValues),
        });
      }
      break;
    case "rolling":
      {
        index = conditions[type].length;
        const cond = rule.condition as EditConditionRolling;
        conditions[type].push({
          recheckAfter: cond.recheckAfter,
        });
      }
      break;
    case "faceCompare":
      {
        index = conditions["rolled"].length;
        const cond = rule.condition as EditConditionFaceCompare;
        conditions["rolled"].push({
          faces: fromFaceCompare(cond.flags, cond.face),
        });
      }
      break;
    case "rolled":
      {
        index = conditions[type].length;
        const cond = rule.condition as EditConditionRolled;
        conditions[type].push({ faces: [...cond.faces] });
      }
      break;
    case "connection":
      {
        index = conditions[type].length;
        const cond = rule.condition as EditConditionConnectionState;
        conditions[type].push({
          flags: valuesToKeys(
            bitsToFlags(cond.flags),
            ConnectionStateFlagsValues
          ),
        });
      }
      break;
    case "battery":
      {
        index = conditions[type].length;
        const cond = rule.condition as EditConditionBatteryState;
        conditions[type].push({
          flags: valuesToKeys(bitsToFlags(cond.flags), BatteryStateFlagsValues),
          recheckAfter: cond.recheckAfter,
        });
      }
      break;
    case "idle":
      {
        index = conditions[type].length;
        const cond = rule.condition as EditConditionIdle;
        conditions[type].push({
          period: cond.period,
        });
      }
      break;
    default:
      assertNever(type, `Unsupported condition type: ${type}`);
  }
  return {
    condition: {
      type: type === "faceCompare" ? "rolled" : type,
      index,
    },
    actions: rule.actions.map((action) => addActionData(action, actions)),
  };
}

function addActionData(
  action: Readonly<EditAction>,
  actions: ProfileData["actions"]
): ProfileData["rules"][number]["actions"][number] {
  const { type } = action;
  if (type === "none") {
    throw new Error(`Invalid action type: ${type}`);
  }
  switch (type) {
    case "playAnimation":
      {
        const act = action as EditActionPlayAnimation;
        actions[type].push({
          animationUuid: act.animation?.uuid,
          face: act.face,
          loopCount: act.loopCount,
          duration: act.duration,
          fade: act.fade,
          intensity: act.intensity,
          faceMask: act.faceMask,
          colors: act.colors.map(ColorUtils.colorToString),
        });
      }
      break;
    case "playAudioClip":
      {
        const act = action as EditActionPlayAudioClip;
        actions[type].push({
          clipUuid: act.clipUuid,
          volume: act.volume,
          loopCount: act.loopCount,
        });
      }
      break;
    case "makeWebRequest":
      {
        const act = action as EditActionMakeWebRequest;
        actions[type].push({
          url: act.url,
          value: act.value,
          format: act.format,
        });
      }
      break;
    case "speakText":
      {
        const act = action as EditActionSpeakText;
        actions[type].push({
          text: act.text,
          volume: act.volume,
          pitch: act.pitch,
          rate: act.rate,
        });
      }
      break;
    default:
      assertNever(type, `Unsupported action type: ${type}`);
  }
  return {
    type,
    index: actions[type].length - 1,
  };
}

export function fromAnimation(animation: Readonly<EditAnimation>): {
  type: keyof AnimationSetData;
  data: AnimationSetData[keyof AnimationSetData][number];
} {
  const type = animation.type;
  const animFlags = valuesToKeys(
    bitsToFlags(animation.animFlags),
    AnimationFlagsValues
  );
  switch (type) {
    case "none":
      throw new Error(`Invalid animation type: ${type}`);
    case "simple": {
      const anim = animation as EditAnimationSimple;
      return {
        type: "flashes",
        data: {
          uuid: anim.uuid,
          name: anim.name,
          duration: anim.duration,
          animFlags,
          category: anim.category,
          dieType: anim.dieType,
          faces: anim.faceMask,
          color: fromColor(anim.color),
          count: anim.count,
          fade: anim.fade,
        },
      };
    }
    case "rainbow": {
      const anim = animation as EditAnimationRainbow;
      return {
        type,
        data: {
          uuid: anim.uuid,
          name: anim.name,
          duration: anim.duration,
          animFlags,
          category: anim.category,
          dieType: anim.dieType,
          faces: anim.faceMask,
          count: anim.count,
          fade: anim.fade,
          intensity: anim.intensity,
          cycles: anim.cycles,
        },
      };
    }
    case "keyframed": {
      const anim = animation as EditAnimationKeyframed;
      return {
        type: "pattern",
        data: {
          uuid: anim.uuid,
          name: anim.name,
          duration: anim.duration,
          animFlags,
          category: anim.category,
          dieType: anim.dieType,
          patternUuid: anim.pattern?.uuid,
        },
      };
    }
    case "gradientPattern": {
      const anim = animation as EditAnimationGradientPattern;
      return {
        type,
        data: {
          uuid: anim.uuid,
          name: anim.name,
          duration: anim.duration,
          animFlags,
          category: anim.category,
          dieType: anim.dieType,
          patternUuid: anim.pattern?.uuid,
          gradientUuid: anim.gradient?.uuid,
          overrideWithFace: anim.overrideWithFace,
        },
      };
    }
    case "gradient": {
      const anim = animation as EditAnimationGradient;
      return {
        type,
        data: {
          uuid: anim.uuid,
          name: anim.name,
          duration: anim.duration,
          animFlags,
          category: anim.category,
          dieType: anim.dieType,
          faces: anim.faceMask,
          gradientUuid: anim.gradient?.uuid,
        },
      };
    }
    case "noise": {
      const anim = animation as EditAnimationNoise;
      return {
        type,
        data: {
          uuid: anim.uuid,
          name: anim.name,
          duration: anim.duration,
          animFlags,
          category: anim.category,
          dieType: anim.dieType,
          gradientUuid: anim.gradient?.uuid,
          blinkGradientUuid: anim.blinkGradient?.uuid,
          blinkFrequency: anim.blinkFrequency,
          blinkFrequencyVar: anim.blinkFrequencyVar,
          blinkDuration: anim.blinkDuration,
          fade: anim.fade,
          gradientColorType: valuesToKeys(
            [anim.gradientColorType],
            NoiseColorOverrideTypeValues
          )[0],
          gradientColorVar: anim.gradientColorVar,
        },
      };
    }
    case "normals": {
      const anim = animation as EditAnimationNormals;
      return {
        type,
        data: {
          uuid: anim.uuid,
          name: anim.name,
          duration: anim.duration,
          animFlags,
          category: anim.category,
          dieType: anim.dieType,
          gradientUuid: anim.gradient?.uuid,
          axisGradientUuid: anim.axisGradient?.uuid,
          axisScrollSpeed: anim.axisScrollSpeed,
          axisScale: anim.axisScale,
          axisOffset: anim.axisOffset,
          angleGradientUuid: anim.angleGradient?.uuid,
          angleScrollSpeed: anim.angleScrollSpeed,
          fade: anim.fade,
          gradientColorType: valuesToKeys(
            [anim.gradientColorType],
            NormalsColorOverrideTypeValues
          )[0],
          gradientColorVar: anim.gradientColorVar,
        },
      };
    }
    case "cycle": {
      const anim = animation as EditAnimationCycle;
      return {
        type,
        data: {
          uuid: anim.uuid,
          name: anim.name,
          duration: anim.duration,
          animFlags,
          category: anim.category,
          dieType: anim.dieType,
          count: anim.count,
          cycles: anim.cycles,
          fade: anim.fade,
          intensity: anim.intensity,
          faces: anim.faceMask,
          gradientUuid: anim.gradient?.uuid,
        },
      };
    }
    case "sequence": {
      const anim = animation as EditAnimationSequence;
      return {
        type,
        data: {
          uuid: anim.uuid,
          name: anim.name,
          duration: anim.duration,
          animFlags,
          category: anim.category,
          dieType: anim.dieType,
          animations: anim.animations.map((i) => ({
            uuid: i.animation.uuid,
            delay: i.delay,
          })),
        },
      };
    }
    case "name":
      throw Error(`Unsupported animation type: ${type}`);
    default:
      assertNever(type, `Unsupported animation type: ${type}`);
  }
}

export function fromPattern(pattern: Readonly<EditPattern>): PatternData {
  const gradients = pattern.gradients.map((g) => ({
    keyframes: fromKeyframes(g.keyframes),
  }));
  return { uuid: pattern.uuid, name: pattern.name, gradients };
}

export function fromGradient(
  gradient: Readonly<EditRgbGradient>
): GradientData {
  const keyframes = fromKeyframes(gradient.keyframes);
  return { uuid: gradient.uuid, keyframes };
}

export function fromCompositeProfile(
  profile: Readonly<EditCompositeProfile>
): CompositeProfileData {
  const conditions = createCompositeConditionSetData();
  const actions = createCompositeActionSetData();
  const rules = profile.rules.map((r) => {
    const type = r.condition.type;
    let index = 0;
    switch (type) {
      case "none":
        throw new Error(`Invalid composite condition type: ${type}`);
      case "rolled":
        {
          index = conditions[type].length;
          const cond = r.condition as EditConditionRolled;
          conditions[type].push({ faces: [...cond.faces] });
        }
        break;
      case "result":
        {
          index = conditions[type].length;
          const cond = r.condition as EditCompositeConditionResult;
          conditions[type].push({
            value: cond.value,
          });
        }
        break;
      case "rollTag":
        {
          index = conditions[type].length;
          const cond = r.condition as EditCompositeConditionRollTag;
          conditions[type].push({
            tag: cond.tag,
          });
        }
        break;
      default:
        assertNever(type, `Unsupported composite condition type: ${type}`);
    }
    return {
      condition: { type, index },
      actions: r.actions.map((action) => {
        const actType = action.type;
        if (actType === "none") {
          throw new Error(`Invalid composite action type: ${actType}`);
        }
        switch (actType) {
          case "playAnimation":
          case "playAudioClip":
          case "makeWebRequest":
          case "speakText":
            addActionData(action, actions);
            break;
          case "playMcpAnimation":
            {
              const act = action as EditCompositeActionPlayMcpAnimation;
              actions[actType].push({
                animation: act.animation,
              });
            }
            break;
          default:
            assertNever(
              actType,
              `Unsupported composite action type: ${actType}`
            );
        }
        return {
          type: actType,
          index: actions[actType].length - 1,
        };
      }),
    } as const;
  });
  return {
    uuid: profile.uuid,
    name: profile.name,
    description: profile.description,
    formula: profile.formula,
    speakResult: profile.speakResult,
    resultAnimationUuid: profile.resultAnimation?.uuid,
    creationDate: profile.creationDate.getTime(),
    lastModified: profile.lastModified.getTime(),
    conditions,
    actions,
    rules,
  };
}
