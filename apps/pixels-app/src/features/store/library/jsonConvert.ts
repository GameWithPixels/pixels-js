import {
  assert,
  assertNever,
  bitsToFlags,
  getValueKeyName,
  valuesToKeys,
} from "@systemic-games/pixels-core-utils";
import {
  AnimationCategoryValues,
  AnimationFlags,
  BatteryStateFlagsValues,
  Color32Utils,
  ColorModeValues,
  ColorUtils,
  ConnectionStateFlagsValues,
  AnimConstants,
  HelloGoodbyeFlagsValues,
  Json,
  PixelDieTypeValues,
  Serializable,
} from "@systemic-games/pixels-edit-animation";
import { fromByteArray } from "base64-js";

import { LibraryData } from "./LibraryData";

import { generateUuid } from "~/features/utils";

const regexExp =
  /^[0-9A-F]{8}-[0-9A-F]{4}-[5][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;

function checkUuid(uuid?: string): string {
  if (__DEV__) {
    assert(uuid?.length === 36, `Invalid uuid length: ${uuid}`);
    assert(!regexExp.test(uuid), `Invalid uuid: ${uuid}`);
  }
  return uuid!;
}

function toKeyframesBase64(keyframes?: Readonly<Json.Keyframe[]>): string {
  const array = new Uint8Array(8 * (keyframes?.length ?? 0));
  const dataView = new DataView(array.buffer);
  let byteOffset = 0;
  keyframes?.forEach((kf) => {
    dataView.setFloat32(byteOffset, kf.time ?? 0);
    byteOffset += 4;
    dataView.setUint32(
      byteOffset,
      Color32Utils.toColor32(
        kf.color?.r ?? 0,
        kf.color?.g ?? 0,
        kf.color?.b ?? 0
      )
    );
    byteOffset += 4;
  });
  return fromByteArray(array);
}

function toColor(color?: Readonly<Json.Color>): string {
  if (color) {
    const mode = getValueKeyName(color.type, ColorModeValues);
    if (!mode) {
      throw new Error(`Unsupported color mode: ${color.type}`);
    }
    switch (mode) {
      case "rgb":
        return ColorUtils.colorToString({
          r: (color.rgbColor?.r ?? 0) / 255,
          g: (color.rgbColor?.g ?? 0) / 255,
          b: (color.rgbColor?.b ?? 0) / 255,
        }).toString();
      case "face":
      case "random":
        return mode;
      default:
        assertNever(mode, `Unsupported color mode: ${mode}`);
    }
  } else {
    return ColorUtils.colorToString({ r: 0, g: 0, b: 0 });
  }
}

function toPattern(pattern: Readonly<Json.Pattern>): Serializable.PatternData {
  const gradients =
    pattern.gradients?.map((g) => ({
      keyframes: toKeyframesBase64(g.keyframes),
    })) ?? [];
  return {
    uuid: checkUuid(pattern.uuid),
    name: pattern.name ?? "",
    gradients,
  };
}

function toAnimationsAndGradients(
  animations: Readonly<Json.Animation[]> | undefined,
  patterns: Readonly<Serializable.PatternData[]>
): {
  animations: Serializable.AnimationSetData;
  animationUuids: string[];
  gradients: Serializable.GradientData[];
} {
  const gradients: Serializable.GradientData[] = [];
  const animationUuids: string[] = []; // Maps animation index to uuid
  const animSet = Serializable.createAnimationSetData();
  function register(gradient?: Json.Gradient): string | undefined {
    if (gradient?.keyframes?.length) {
      gradients.push({
        uuid: checkUuid(gradient.uuid),
        keyframes: toKeyframesBase64(gradient.keyframes),
      });
      return gradient.uuid;
    }
  }
  function push<T extends keyof Serializable.AnimationSetData>(
    type: T,
    value: NonNullable<Serializable.AnimationSetData[T]>[number]
  ) {
    animationUuids.push(value.uuid);
    if (!value.name.startsWith("(discard)")) {
      const arr = animSet[type] as (typeof value)[];
      arr.push(value);
    }
  }
  if (animations) {
    for (const anim of animations) {
      const type = getValueKeyName(anim.type, Json.AnimationTypeValues);
      if (!type) {
        throw new Error(`Unsupported animation type: ${anim.type}`);
      }
      const data = anim.data;
      if (data) {
        const anim = {
          uuid: checkUuid(data.uuid),
          name: data.name ?? "",
          duration: data.duration ?? 1,
          animFlags: [] as AnimationFlags[],
          category:
            getValueKeyName(data.category, AnimationCategoryValues) ?? "system",
          dieType:
            getValueKeyName(data.dieType, PixelDieTypeValues) ?? "unknown",
        } as const;
        switch (type) {
          case "none":
            throw new Error(`Invalid animation type: ${type}`);
          case "simple":
            push("flashes", {
              ...anim,
              faces: data.faces ?? AnimConstants.faceMaskAll,
              color: toColor(data.color),
              count: data.count ?? 1,
              fade: data.fade ?? 0,
            });
            break;
          case "rainbow":
            push(type, {
              ...anim,
              animFlags: data.traveling ? ["traveling", "useLedIndices"] : [],
              faces: data.faces ?? AnimConstants.faceMaskAll,
              count: data.count ?? 1,
              fade: data.fade ?? 0,
              intensity: data.intensity ?? 0.5,
              cycles: 1,
            });
            break;
          case "keyframed":
            push("pattern", {
              ...anim,
              animFlags: data.traveling ? ["traveling", "useLedIndices"] : [],
              patternUuid: patterns[data.patternIndex ?? -1]?.uuid,
            });
            break;
          case "gradientPattern":
            push(type, {
              ...anim,
              patternUuid: patterns[data.patternIndex ?? -1]?.uuid,
              gradientUuid: register(data.gradient),
              overrideWithFace: data.overrideWithFace ?? false,
            });
            break;
          case "gradient":
            push(type, {
              ...anim,
              faces: data.faces ?? AnimConstants.faceMaskAll,
              gradientUuid: register(data.gradient),
            });
            break;
          default:
            assertNever(type, `Unsupported animation type: ${type}`);
        }
      }
    }
  }
  return { animations: animSet, animationUuids, gradients };
}

function toAudioClips(audioClips?: Readonly<Json.AudioClip[]>): {
  audioClips: Serializable.AudioClipData[];
  audioClipsUuidsMap: Map<number, string>;
} {
  const clipsMap = new Map<number, string>(); // Maps clip id to uuid
  const filteredClips = audioClips?.filter(
    (clip): clip is Required<Json.AudioClip> => !!clip.id && !!clip.name?.length
  );
  const clips =
    filteredClips?.map((clip) => {
      const uuid = generateUuid();
      clipsMap.set(clip.id, uuid);
      return {
        uuid,
        name: clip.name,
        localId: clip.id,
      };
    }) ?? [];
  return {
    audioClips: clips,
    audioClipsUuidsMap: new Map(),
  };
}

function toCondition(
  condition: Readonly<Json.Condition>,
  inOutConditionSet: Serializable.ConditionSetData
): Serializable.RuleData["condition"] {
  function register<T extends keyof Serializable.ConditionSetData>(
    type: T,
    cond: NonNullable<Serializable.ConditionSetData[T]>[number]
  ) {
    const arr = inOutConditionSet[type] as (typeof cond)[];
    arr.push(cond);
    return {
      type,
      index: arr.length - 1,
    };
  }
  const type = getValueKeyName(condition.type, Json.ConditionTypeValues);
  if (!type) {
    throw new Error(`Unsupported condition type: ${condition.type}`);
  }
  const data = condition.data;
  switch (type) {
    case "none":
      throw new Error(`Invalid condition type: ${type}`);
    case "helloGoodbye":
      return register(type, {
        flags: valuesToKeys(bitsToFlags(data?.flags), HelloGoodbyeFlagsValues),
      });
    case "handling":
      return { type, index: -1 };
    case "rolling":
      return register(type, { recheckAfter: data?.recheckAfter ?? 0 });
    case "faceCompare":
      return register("rolled", {
        faces: Serializable.fromFaceCompare(
          data?.flags ?? 0,
          (data?.faceIndex ?? 0) + 1
        ),
      });
    case "crooked":
      return { type, index: -1 };
    case "connectionState":
      return register("connection", {
        flags: valuesToKeys(
          bitsToFlags(data?.flags),
          ConnectionStateFlagsValues
        ),
      });
    case "batteryState":
      return register("battery", {
        flags: valuesToKeys(bitsToFlags(data?.flags), BatteryStateFlagsValues),
        recheckAfter: data?.recheckAfter ?? 1,
      });
    case "idle":
      return register(type, { period: data?.period ?? 10 });
    default:
      assertNever(type, `Unsupported condition type: ${type}`);
  }
}

function toActions(
  actions: Readonly<Json.Action[]>,
  animationUuids: Readonly<string[]>,
  audioClipsUuidsMap: Readonly<Map<number, string>>,
  inOutActionSet: Serializable.ActionSetData
): Serializable.RuleData["actions"][number][] {
  function register<T extends keyof Serializable.ActionSetData>(
    type: T,
    act: NonNullable<Serializable.ActionSetData[T]>[number]
  ) {
    const arr = inOutActionSet[type] as (typeof act)[];
    arr.push(act);
    return {
      type,
      index: arr.length - 1,
    };
  }
  const validActions = actions?.filter(
    (act): act is Required<Json.Action> => !!act.type && !!act.data
  );
  return validActions?.map((action) => {
    const type = getValueKeyName(action.type, Json.ActionTypeValues);
    if (!type) {
      throw new Error(`Unknown action type: ${action.type}`);
    }
    const data = action.data;
    switch (type) {
      case "none":
        throw new Error(`Invalid action type: ${type}`);
      case "playAnimation":
        return register(type, {
          animationUuid: animationUuids[data.animationIndex ?? -1],
          face: (data.faceIndex ?? 0) + 1,
          loopCount: data.loopCount ?? 1,
          colors: [],
        });
      case "playAudioClip":
        return register("playAudioClip", {
          clipUuid: audioClipsUuidsMap.get(data.audioClipIndex ?? -1),
        });
      default:
        assertNever(type, `Unsupported action type: ${type}`);
    }
  });
}

const defaultCreationTime = new Date(2024, 0, 1).getTime();

function toProfile(
  profile: Json.Profile,
  animationUuids: Readonly<string[]>,
  audioClipsUuidsMap: Readonly<Map<number, string>>
): Serializable.ProfileData {
  const conditions = Serializable.createConditionSetData();
  const actions = Serializable.createActionSetData();
  const filteredRules =
    profile.rules?.filter(
      (r): r is Required<Json.Rule> => !!r.condition && !!r.actions
    ) ?? [];
  return {
    uuid: checkUuid(profile.uuid),
    name: profile.name ?? "",
    description: profile.description ?? "",
    dieType: "d20",
    hash: 0,
    creationDate: defaultCreationTime,
    lastChanged: defaultCreationTime,
    lastUsed: 0,
    conditions,
    actions,
    rules: filteredRules.map((r) => ({
      condition: toCondition(r.condition, conditions),
      actions: toActions(
        r.actions,
        animationUuids,
        audioClipsUuidsMap,
        actions
      ),
    })),
  };
}

export function jsonConvert(dataSet: Json.DataSet): LibraryData {
  const patterns = dataSet.patterns?.map(toPattern) ?? [];
  const { animations, animationUuids, gradients } = toAnimationsAndGradients(
    dataSet.animations,
    patterns
  );
  const { audioClips, audioClipsUuidsMap } = toAudioClips(dataSet.audioClips);
  const profiles =
    dataSet.behaviors?.map((p) =>
      toProfile(p, animationUuids, audioClipsUuidsMap)
    ) ?? [];
  return {
    profiles,
    animations,
    patterns,
    gradients,
    audioClips,
  };
}
