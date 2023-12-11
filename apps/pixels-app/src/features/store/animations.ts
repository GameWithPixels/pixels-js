import { combineFlags, keysToValues } from "@systemic-games/pixels-core-utils";
import { Serializable } from "@systemic-games/pixels-edit-animation";
import {
  AnimationFlagsValues,
  Profiles,
} from "@systemic-games/react-native-pixels-connect";
import { runInAction } from "mobx";

import { readGradient } from "./gradients";
import { readPattern } from "./patterns";
import { LibraryState } from "./profilesLibrarySlice";
import { storeLog } from "./storeLog";

import { makeObservable } from "~/features/makeObservable";

const loadedAnimations = new Map<string, Profiles.Animation>();

function create(
  uuid: string,
  library: LibraryState,
  skipStore: boolean
): Profiles.Animation {
  storeLog("create", "animation", uuid);
  const anim = makeObservable(createAnimation(uuid, library));
  if (!skipStore) {
    loadedAnimations.set(uuid, anim);
  }
  return anim;
}

export function readAnimation(
  uuid: string,
  library: LibraryState,
  newInstance = false
): Profiles.Animation {
  const anim = newInstance
    ? create(uuid, library, newInstance)
    : loadedAnimations.get(uuid) ?? create(uuid, library, newInstance);
  runInAction(() => updateAnimation(anim, library));
  return anim;
}

// TODO use Profiles.createAnimation
function createAnimation(
  uuid: string,
  library: LibraryState
): Profiles.Animation {
  const flashesData = library.animations.flashes.find((a) => a.uuid === uuid);
  if (flashesData) {
    return new Profiles.AnimationFlashes({ uuid });
  }
  const rainbowData = library.animations.rainbow.find((a) => a.uuid === uuid);
  if (rainbowData) {
    return new Profiles.AnimationRainbow({ uuid });
  }
  const patternData = library.animations.pattern.find((a) => a.uuid === uuid);
  if (patternData) {
    return new Profiles.AnimationPattern({ uuid });
  }
  const gradientPatternData = library.animations.gradientPattern.find(
    (a) => a.uuid === uuid
  );
  if (gradientPatternData) {
    return new Profiles.AnimationGradientPattern({ uuid });
  }
  const gradientData = library.animations.gradient.find((a) => a.uuid === uuid);
  if (gradientData) {
    return new Profiles.AnimationGradient({ uuid });
  }
  const noiseData = library.animations.noise.find((a) => a.uuid === uuid);
  if (noiseData) {
    return new Profiles.AnimationNoise({ uuid });
  }
  throw new Error(`Animation ${uuid} not found`);
}

function updateAnimation(
  anim: Profiles.Animation,
  library: LibraryState
): void {
  const uuid = anim.uuid;
  const flashesData = library.animations.flashes.find((a) => a.uuid === uuid);
  if (flashesData) {
    const flashes = anim as Profiles.AnimationFlashes;
    flashes.name = flashesData.name;
    flashes.duration = flashesData.duration;
    flashes.animFlags = combineFlags(
      keysToValues(flashesData.animFlags, AnimationFlagsValues)
    );
    updateColor(flashes.color, flashesData.color);
    flashes.count = flashesData.count;
    flashes.fade = flashesData.fade;
    flashes.faces = flashesData.faces;
    return;
  }
  const rainbowData = library.animations.rainbow.find((a) => a.uuid === uuid);
  if (rainbowData) {
    const rainbow = anim as Profiles.AnimationRainbow;
    rainbow.name = rainbowData.name;
    rainbow.duration = rainbowData.duration;
    rainbow.animFlags = combineFlags(
      keysToValues(rainbowData.animFlags, AnimationFlagsValues)
    );
    rainbow.count = rainbowData.count;
    rainbow.cycles = rainbowData.cycles;
    rainbow.fade = rainbowData.fade;
    rainbow.intensity = rainbowData.intensity;
    rainbow.faces = rainbowData.faces;
    return;
  }
  const patternData = library.animations.pattern.find((a) => a.uuid === uuid);
  if (patternData) {
    const pattern = anim as Profiles.AnimationPattern;
    pattern.name = patternData.name;
    pattern.duration = patternData.duration;
    pattern.animFlags = combineFlags(
      keysToValues(patternData.animFlags, AnimationFlagsValues)
    );
    pattern.pattern = patternData.patternUuid
      ? readPattern(patternData.patternUuid, library)
      : undefined;
    return;
  }
  const gradientPatternData = library.animations.gradientPattern.find(
    (a) => a.uuid === uuid
  );
  if (gradientPatternData) {
    const gradientPattern = anim as Profiles.AnimationGradientPattern;
    gradientPattern.name = gradientPatternData.name;
    gradientPattern.duration = gradientPatternData.duration;
    gradientPattern.animFlags = combineFlags(
      keysToValues(gradientPatternData.animFlags, AnimationFlagsValues)
    );
    gradientPattern.pattern = gradientPatternData.patternUuid
      ? readPattern(gradientPatternData.patternUuid, library)
      : undefined;
    gradientPattern.gradient = gradientPatternData.gradientUuid
      ? readGradient(gradientPatternData.gradientUuid, library)
      : undefined;
    gradientPattern.overrideWithFace = gradientPatternData.overrideWithFace;
    return;
  }
  const gradientData = library.animations.gradient.find((a) => a.uuid === uuid);
  if (gradientData) {
    const gradient = anim as Profiles.AnimationGradient;
    gradient.name = gradientData.name;
    gradient.duration = gradientData.duration;
    gradient.animFlags = combineFlags(
      keysToValues(gradientData.animFlags, AnimationFlagsValues)
    );
    gradient.gradient = gradientData.gradientUuid
      ? readGradient(gradientData.gradientUuid, library)
      : undefined;
    gradient.faces = gradientData.faces;
    return;
  }
  const noiseData = library.animations.noise.find((a) => a.uuid === uuid);
  if (noiseData) {
    const noise = anim as Profiles.AnimationNoise;
    noise.name = noiseData.name;
    noise.duration = noiseData.duration;
    noise.animFlags = combineFlags(
      keysToValues(noiseData.animFlags, AnimationFlagsValues)
    );
    noise.gradient = noiseData.gradientUuid
      ? readGradient(noiseData.gradientUuid, library)
      : undefined;
    noise.blinkDuration = noiseData.blinkDuration;
    noise.blinkGradient = noiseData.blinkGradientUuid
      ? readGradient(noiseData.blinkGradientUuid, library)
      : undefined;
    noise.blinkCount = noiseData.blinkCount;
    noise.fade = noiseData.fade;
    noise.faces = noiseData.faces;
    return;
  }
  throw new Error(`Animation ${uuid} not found`);
}

function updateColor(color: Profiles.Color, colorData: string) {
  const newColor = Serializable.toColor(colorData);
  color.mode = newColor.mode;
  color.color = newColor.color;
}
