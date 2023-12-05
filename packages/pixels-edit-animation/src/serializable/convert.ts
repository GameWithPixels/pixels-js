import {
  BatteryStateFlagsValues,
  Color,
  ColorUtils,
  ConnectionStateFlagsValues,
  FaceCompareFlagsValues,
  HelloGoodbyeFlagsValues,
} from "@systemic-games/pixels-core-animation";
import {
  assert,
  assertNever,
  bitsToFlags,
  combineFlags,
  keysToValues,
  valuesToKeys,
} from "@systemic-games/pixels-core-utils";
import { fromByteArray, toByteArray } from "base64-js";

import {
  AnimationGradientData,
  AnimationGradientModulatedData,
  AnimationColorDesignData,
  AnimationNoiseData,
  AnimationRainbowData,
  AnimationSetData,
  AnimationFlashesData,
} from "./animations";
import { GradientData } from "./gradient";
import { PatternData } from "./pattern";
import {
  ActionSetData,
  ProfileData,
  createActionSetData,
  createConditionSetData,
} from "./profile";
import {
  EditActionPlayAnimation,
  EditActionPlayAudioClip,
  EditActionRunOnDevice,
  EditAnimation,
  EditAnimationGradient,
  EditAnimationGradientPattern,
  EditAnimationKeyframed,
  EditAnimationNoise,
  EditAnimationRainbow,
  EditAnimationSimple,
  EditAudioClip,
  EditColor,
  EditCondition,
  EditConditionBatteryState,
  EditConditionConnectionState,
  EditConditionCrooked,
  EditConditionFaceCompare,
  EditConditionHandling,
  EditConditionHelloGoodbye,
  EditConditionIdle,
  EditConditionRolling,
  EditPattern,
  EditProfile,
  EditRgbGradient,
  EditRgbKeyframe,
  EditRule,
} from "../edit";
import EditActionMakeWebRequest from "../edit/EditActionMakeWebRequest";

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
          condition = new EditConditionFaceCompare({
            ...condData,
            flags: combineFlags(
              keysToValues(condData.flags, FaceCompareFlagsValues)
            ),
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
        default:
          assertNever(actType, `Unsupported action type: ${actType}`);
      }
    });
    return new EditRule(condition, { actions });
  });
  return new EditProfile({ ...data, rules });
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
  switch (type) {
    case "flashes": {
      const animData = data as AnimationFlashesData;
      return new EditAnimationSimple({
        ...animData,
        color: toColor(animData.color),
      });
    }
    case "rainbow": {
      const animData = data as AnimationRainbowData;
      return new EditAnimationRainbow(animData);
    }
    case "colorDesign": {
      const animData = data as AnimationColorDesignData;
      return new EditAnimationKeyframed({
        ...animData,
        pattern: checkGetPattern(animData.patternUuid),
      });
    }
    case "gradientModulated": {
      const animData = data as AnimationGradientModulatedData;
      return new EditAnimationGradientPattern({
        ...animData,
        pattern: checkGetPattern(animData.patternUuid),
        gradient: checkGetGradient(animData.gradientUuid),
      });
    }
    case "gradient": {
      const animData = data as AnimationGradientData;
      return new EditAnimationGradient({
        ...animData,
        gradient: checkGetGradient(animData.gradientUuid),
      });
    }
    case "noise": {
      const animData = data as AnimationNoiseData;
      return new EditAnimationNoise({
        ...animData,
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

export function toKeyframes(base64: string): EditRgbKeyframe[] {
  const dataView = new DataView(toByteArray(base64).buffer);
  const keyframes: EditRgbKeyframe[] = [];
  let byteOffset = 0;
  const lengthMinus8 = dataView.byteLength - 8;
  while (byteOffset <= lengthMinus8) {
    const time = dataView.getFloat32(byteOffset);
    byteOffset += 4;
    const color = new Color(dataView.getUint32(byteOffset));
    byteOffset += 4;
    keyframes.push(new EditRgbKeyframe({ time, color }));
  }
  return keyframes;
}

export function toColor(data: string): EditColor {
  if (data === "face" || data === "random") {
    return new EditColor(data);
  } else {
    return new EditColor(new Color(data));
  }
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
      case "rolled":
        {
          condIndex = conditions[condType].length;
          const cond = r.condition as EditConditionFaceCompare;
          conditions[condType].push({
            flags: valuesToKeys(
              bitsToFlags(cond.flags),
              FaceCompareFlagsValues
            ),
            face: cond.face,
          });
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
        type: condType,
        index: condIndex,
      },
      actions: r.actions.map((action) => {
        const actType = action.type;
        let retActType: keyof ActionSetData;
        switch (actType) {
          case "none":
            throw new Error(`Invalid action type: ${actType}`);
          case "playAnimation":
            {
              retActType = actType;
              const act = action as EditActionPlayAnimation;
              actions[actType].push({
                animationUuid: act.animation?.uuid,
                face: act.face,
                loopCount: act.loopCount,
              });
            }
            break;
          case "runOnDevice": {
            const remoteType = (action as EditActionRunOnDevice).remoteType;
            switch (remoteType) {
              case "none":
                throw new Error(`Invalid remote action type: ${remoteType}`);
              case "playAudioClip":
                {
                  retActType = remoteType;
                  const act = action as EditActionPlayAudioClip;
                  actions[retActType].push({
                    clipUuid: act.clip?.uuid,
                  });
                }
                break;
              case "makeWebRequest": {
                retActType = remoteType;
                const act = action as EditActionMakeWebRequest;
                actions[retActType].push({
                  url: act.url,
                  value: act.value,
                });
                break;
              }
              default:
                assertNever(
                  remoteType,
                  `Unsupported remote action type: ${remoteType}`
                );
            }
            break;
          }
          case "playAudioClip":
          case "speakText":
          case "makeWebRequest":
            throw new Error(`Unsupported action type: ${actType}`);
          default:
            assertNever(actType, `Unsupported action type: ${actType}`);
        }
        return {
          type: retActType,
          index: actions[retActType].length - 1,
        };
      }),
    };
  });
  return {
    uuid: profile.uuid,
    name: profile.name,
    description: profile.description,
    conditions,
    actions,
    rules,
  };
}

function fromColor(color: EditColor): string {
  const mode = color.mode;
  switch (mode) {
    case "rgb":
      return ColorUtils.colorToString(color.color).toString();
    case "face":
    case "random":
      return mode;
    default:
      assertNever(mode, `Unsupported color mode: ${mode}`);
  }
}

export function fromAnimation(animation: Readonly<EditAnimation>): {
  type: keyof AnimationSetData;
  data: AnimationSetData[keyof AnimationSetData][number];
} {
  const type = animation.type;
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
          animFlags: anim.animFlags,
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
          animFlags: anim.animFlags,
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
        type: "colorDesign",
        data: {
          uuid: anim.uuid,
          name: anim.name,
          duration: anim.duration,
          animFlags: anim.animFlags,
          patternUuid: anim.pattern?.uuid,
        },
      };
    }
    case "gradientPattern": {
      const anim = animation as EditAnimationGradientPattern;
      return {
        type: "gradientModulated",
        data: {
          uuid: anim.uuid,
          name: anim.name,
          duration: anim.duration,
          animFlags: anim.animFlags,
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
          animFlags: anim.animFlags,
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
          animFlags: anim.animFlags,
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

function toKeyframesBase64(keyframes?: Readonly<EditRgbKeyframe[]>): string {
  const array = new Uint8Array(8 * (keyframes?.length ?? 0));
  const dataView = new DataView(array.buffer);
  let byteOffset = 0;
  keyframes?.forEach((kf) => {
    dataView.setFloat32(byteOffset, kf.time ?? 0);
    byteOffset += 4;
    dataView.setUint32(byteOffset, kf.color.toColor32());
    byteOffset += 4;
  });
  return fromByteArray(array);
}

export function fromPattern(pattern: Readonly<EditPattern>): PatternData {
  const gradients = pattern.gradients.map((g) => ({
    keyframes: toKeyframesBase64(g.keyframes),
  }));
  return { uuid: pattern.uuid, name: pattern.name, gradients };
}

export function fromGradient(
  gradient: Readonly<EditRgbGradient>
): GradientData {
  const keyframes = toKeyframesBase64(gradient.keyframes);
  return { uuid: gradient.uuid, keyframes };
}
