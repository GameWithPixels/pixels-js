import { combineFlags, keysToValues } from "@systemic-games/pixels-core-utils";
import {
  NoiseColorOverrideTypeValues,
  NormalsColorOverrideTypeValues,
  Profiles,
  Serializable,
} from "@systemic-games/react-native-pixels-connect";
import { runInAction } from "mobx";

import { readGradient } from "./gradients";
import { log } from "./log";
import { readPattern } from "./patterns";

import { LibraryState } from "~/app/store";
import { makeObservable } from "~/features/utils";

const loadedAnimations = new Map<string, Profiles.Animation>();

function create(
  uuid: string,
  library: LibraryState,
  skipStore: boolean
): Profiles.Animation {
  log("create", "animation", uuid);
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
  const existing = !newInstance && loadedAnimations.get(uuid);
  const anim = existing ? existing : create(uuid, library, newInstance);
  runInAction(() => updateAnimation(anim, library));
  return anim;
}

// TODO use Profiles.createAnimation
function createAnimation(
  uuid: string,
  library: LibraryState
): Profiles.Animation {
  const flashesData = library.animations.flashes.entities[uuid];
  if (flashesData) {
    return new Profiles.AnimationFlashes({ uuid });
  }
  const rainbowData = library.animations.rainbow.entities[uuid];
  if (rainbowData) {
    return new Profiles.AnimationRainbow({ uuid });
  }
  const patternData = library.animations.pattern.entities[uuid];
  if (patternData) {
    return new Profiles.AnimationPattern({ uuid });
  }
  const gradientPatternData = library.animations.gradientPattern.entities[uuid];
  if (gradientPatternData) {
    return new Profiles.AnimationGradientPattern({ uuid });
  }
  const gradientData = library.animations.gradient.entities[uuid];
  if (gradientData) {
    return new Profiles.AnimationGradient({ uuid });
  }
  const noiseData = library.animations.noise.entities[uuid];
  if (noiseData) {
    return new Profiles.AnimationNoise({ uuid });
  }
  const normalsData = library.animations.normals.entities[uuid];
  if (normalsData) {
    return new Profiles.AnimationNormals({ uuid });
  }
  const cycleData = library.animations.cycle.entities[uuid];
  if (cycleData) {
    return new Profiles.AnimationCycle({ uuid });
  }
  throw new Error(`Animation ${uuid} not found`);
}

function updateAnimation(
  anim: Profiles.Animation,
  library: LibraryState
): void {
  const uuid = anim.uuid;
  const flashesData = library.animations.flashes.entities[uuid];
  if (flashesData) {
    if (anim instanceof Profiles.AnimationFlashes) {
      updateAnimBase(anim, flashesData);
      updateColor(anim.color, flashesData.color);
      anim.count = flashesData.count;
      anim.fade = flashesData.fade;
      anim.faces = flashesData.faces;
      return;
    }
  }
  const rainbowData = library.animations.rainbow.entities[uuid];
  if (rainbowData) {
    if (anim instanceof Profiles.AnimationRainbow) {
      updateAnimBase(anim, rainbowData);
      anim.count = rainbowData.count;
      anim.cycles = rainbowData.cycles;
      anim.fade = rainbowData.fade;
      anim.intensity = rainbowData.intensity;
      anim.faces = rainbowData.faces;
      return;
    }
  }
  const patternData = library.animations.pattern.entities[uuid];
  if (patternData) {
    if (anim instanceof Profiles.AnimationPattern) {
      updateAnimBase(anim, patternData);
      anim.pattern = patternData.patternUuid
        ? readPattern(patternData.patternUuid, library)
        : undefined;
      return;
    }
  }
  const gradientPatternData = library.animations.gradientPattern.entities[uuid];
  if (gradientPatternData) {
    if (anim instanceof Profiles.AnimationGradientPattern) {
      updateAnimBase(anim, gradientPatternData);
      anim.pattern = gradientPatternData.patternUuid
        ? readPattern(gradientPatternData.patternUuid, library)
        : undefined;
      anim.gradient = gradientPatternData.gradientUuid
        ? readGradient(gradientPatternData.gradientUuid, library)
        : undefined;
      anim.overrideWithFace = gradientPatternData.overrideWithFace;
      return;
    }
  }
  const gradientData = library.animations.gradient.entities[uuid];
  if (gradientData) {
    if (anim instanceof Profiles.AnimationGradient) {
      updateAnimBase(anim, gradientData);
      anim.gradient = gradientData.gradientUuid
        ? readGradient(gradientData.gradientUuid, library)
        : undefined;
      anim.faces = gradientData.faces;
      return;
    }
  }
  const noiseData = library.animations.noise.entities[uuid];
  if (noiseData) {
    if (anim instanceof Profiles.AnimationNoise) {
      updateAnimBase(anim, noiseData);
      anim.gradient = noiseData.gradientUuid
        ? readGradient(noiseData.gradientUuid, library)
        : undefined;
      anim.blinkGradient = noiseData.blinkGradientUuid
        ? readGradient(noiseData.blinkGradientUuid, library)
        : undefined;
      anim.blinkFrequency = noiseData.blinkFrequency;
      anim.blinkFrequencyVar = noiseData.blinkFrequencyVar;
      anim.blinkDuration = noiseData.blinkDuration;
      anim.fade = noiseData.fade;
      anim.mainGradientColorType =
        NoiseColorOverrideTypeValues[noiseData.mainGradientColorType];
      anim.mainGradientColorVar = noiseData.mainGradientColorVar;
      return;
    }
  }
  const normalsData = library.animations.normals.entities[uuid];
  if (normalsData) {
    if (anim instanceof Profiles.AnimationNormals) {
      updateAnimBase(anim, normalsData);
      anim.gradient = normalsData.gradientUuid
        ? readGradient(normalsData.gradientUuid, library)
        : undefined;
      anim.gradientAlongAxis = normalsData.gradientAlongAxisUuid
        ? readGradient(normalsData.gradientAlongAxisUuid, library)
        : undefined;
      anim.axisScrollSpeed = normalsData.axisScrollSpeed;
      anim.axisScale = normalsData.axisScale;
      anim.axisOffset = normalsData.axisOffset;
      anim.gradientAlongAngle = normalsData.gradientAlongAngleUuid
        ? readGradient(normalsData.gradientAlongAngleUuid, library)
        : undefined;
      anim.axisScrollSpeed = normalsData.axisScrollSpeed;
      anim.fade = normalsData.fade;
      anim.mainGradientColorType =
        NormalsColorOverrideTypeValues[normalsData.mainGradientColorType];
      anim.mainGradientColorVar = normalsData.mainGradientColorVar;
      return;
    }
  }
  const cycleData = library.animations.cycle.entities[uuid];
  if (cycleData) {
    if (anim instanceof Profiles.AnimationCycle) {
      updateAnimBase(anim, cycleData);
      anim.gradient = cycleData.gradientUuid
        ? readGradient(cycleData.gradientUuid, library)
        : undefined;
      anim.count = cycleData.count;
      anim.cycles = cycleData.cycles;
      anim.fade = cycleData.fade;
      anim.intensity = cycleData.intensity;
      anim.faces = cycleData.faces;
      return;
    }
  }
  throw new Error(`Animation ${uuid} not found`);
}

function updateAnimBase(
  anim: Profiles.Animation,
  data: Serializable.AnimationData
): void {
  anim.name = data.name;
  anim.duration = data.duration;
  anim.animFlags = combineFlags(
    keysToValues(data.animFlags, Profiles.AnimationFlagsValues)
  );
  anim.category = data.category;
  anim.dieType = data.dieType;
}

function updateColor(color: Profiles.FaceColor, colorData: string): void {
  const newColor = Serializable.toColor(colorData);
  color.mode = newColor.mode;
  if (!newColor.color) {
    color.color = undefined;
  } else if (!color.color?.equals(newColor.color)) {
    color.color = newColor.color;
  }
}
