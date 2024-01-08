import {
  AnimationFlagsValues,
  BatteryStateFlagsValues,
  ConnectionStateFlagsValues,
  DataSet,
  FaceCompareFlagsValues,
  HelloGoodbyeFlagsValues,
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
} from "./animations";
import { fromColor, toColor } from "./color";
import { GradientData } from "./gradient";
import { toKeyframes, fromKeyframes } from "./keyframes";
import { PatternData } from "./pattern";
import {
  ProfileData,
  createActionSetData,
  createConditionSetData,
} from "./profile";
import { createDataSetForProfile } from "../createDataSet";
import {
  EditActionPlayAnimation,
  EditActionPlayAudioClip,
  EditAnimation,
  EditAnimationGradient,
  EditAnimationGradientPattern,
  EditAnimationKeyframed,
  EditAnimationNoise,
  EditAnimationRainbow,
  EditAnimationSimple,
  EditAudioClip,
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
  getAudioClip: (uuid: string) => EditAudioClip | undefined,
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
  const checkGetAudioClip = (uuid?: string): EditAudioClip | undefined => {
    if (uuid) {
      const clip = getAudioClip(uuid);
      if (!allowMissingDependency && !clip) {
        throw new Error(`toProfile(): No audio clip with uuid ${uuid}`);
      }
      return clip;
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
          });
        }
        case "playAudioClip": {
          const actData = data.actions.playAudioClip[a.index];
          assert(actData, `No data for ${actType} action at index ${a.index}`);
          return new EditActionPlayAudioClip({
            ...actData,
            clip: checkGetAudioClip(actData.clipUuid),
          });
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
    return new EditRule(condition, { actions });
  });
  return new EditProfile({
    ...data,
    rules,
    creationDate: new Date(data.creationDate),
    lastChanged: new Date(data.lastChanged),
    lastUsed: data.lastUsed ? new Date(data.lastUsed) : undefined,
  });
}

export function toAnimation<T extends keyof AnimationSetData>(
  type: T,
  data: Readonly<AnimationSetData[T][number]>,
  getPattern: (uuid: string) => EditPattern | undefined,
  getGradient: (uuid: string) => EditRgbGradient | undefined,
  allowMissingDependency = false
): EditAnimation {
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
    const condType = r.condition.type;
    let condIndex = 0;
    switch (condType) {
      case "none":
        throw new Error(`Invalid condition type: ${condType}`);
      case "handling":
      case "crooked":
        break;
      case "helloGoodbye":
        {
          condIndex = conditions[condType].length;
          const cond = r.condition as EditConditionHelloGoodbye;
          conditions[condType].push({
            flags: valuesToKeys(
              bitsToFlags(cond.flags),
              HelloGoodbyeFlagsValues
            ),
          });
        }
        break;
      case "rolling":
        {
          condIndex = conditions[condType].length;
          const cond = r.condition as EditConditionRolling;
          conditions[condType].push({
            recheckAfter: cond.recheckAfter,
          });
        }
        break;
      case "faceCompare":
        {
          condIndex = conditions["rolled"].length;
          const cond = r.condition as EditConditionFaceCompare;
          conditions["rolled"].push({
            faces: fromFaceCompare(cond.flags, cond.face),
          });
        }
        break;
      case "rolled":
        {
          condIndex = conditions[condType].length;
          const cond = r.condition as EditConditionRolled;
          conditions[condType].push({ faces: [...cond.faces] });
        }
        break;
      case "connection":
        {
          condIndex = conditions[condType].length;
          const cond = r.condition as EditConditionConnectionState;
          conditions[condType].push({
            flags: valuesToKeys(
              bitsToFlags(cond.flags),
              ConnectionStateFlagsValues
            ),
          });
        }
        break;
      case "battery":
        {
          condIndex = conditions[condType].length;
          const cond = r.condition as EditConditionBatteryState;
          conditions[condType].push({
            flags: valuesToKeys(
              bitsToFlags(cond.flags),
              BatteryStateFlagsValues
            ),
            recheckAfter: cond.recheckAfter,
          });
        }
        break;
      case "idle":
        {
          condIndex = conditions[condType].length;
          const cond = r.condition as EditConditionIdle;
          conditions[condType].push({
            period: cond.period,
          });
        }
        break;
      default:
        assertNever(condType, `Unsupported condition type: ${condType}`);
    }
    return {
      condition: {
        type: condType === "faceCompare" ? "rolled" : condType,
        index: condIndex,
      },
      actions: r.actions.map((action) => {
        const actType = action.type;
        if (actType === "none") {
          throw new Error(`Invalid action type: ${actType}`);
        }
        switch (actType) {
          case "playAnimation":
            {
              const act = action as EditActionPlayAnimation;
              actions[actType].push({
                animationUuid: act.animation?.uuid,
                face: act.face,
                loopCount: act.loopCount,
              });
            }
            break;
          case "playAudioClip":
            {
              const act = action as EditActionPlayAudioClip;
              actions[actType].push({
                clipUuid: act.clip?.uuid,
              });
            }
            break;
          case "makeWebRequest":
            {
              const act = action as EditActionMakeWebRequest;
              actions[actType].push({
                url: act.url,
                value: act.value,
              });
            }
            break;
          case "speakText":
            {
              const act = action as EditActionSpeakText;
              actions[actType].push({
                text: act.text,
              });
            }
            break;
          default:
            assertNever(actType, `Unsupported action type: ${actType}`);
        }
        return {
          type: actType,
          index: actions[actType].length - 1,
        };
      }),
    };
  });
  // Compute hash
  const data = createDataSetForProfile(profile).toDataSet();
  const hash = DataSet.computeHash(data.toByteArray());
  return {
    uuid: profile.uuid,
    name: profile.name,
    description: profile.description,
    dieType: profile.dieType,
    hash,
    creationDate: profile.creationDate.getTime(),
    lastChanged: profile.lastChanged.getTime(),
    lastUsed: profile.lastUsed?.getTime() ?? 0,
    conditions,
    actions,
    rules,
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
          faces: anim.faces,
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
          faces: anim.faces,
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
          faces: anim.faces,
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
          faces: anim.faces,
          gradientUuid: anim.gradient?.uuid,
          blinkDuration: anim.blinkDuration,
          blinkGradientUuid: anim.blinkGradient?.uuid,
          blinkCount: anim.blinkCount,
          fade: anim.fade,
        },
      };
    }
    case "cycle":
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
