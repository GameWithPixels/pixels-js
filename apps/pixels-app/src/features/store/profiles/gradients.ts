import { assert } from "@systemic-games/pixels-core-utils";
import {
  Profiles,
  Serializable,
} from "@systemic-games/react-native-pixels-connect";
import { runInAction } from "mobx";

import { log } from "./log";

import { LibraryState } from "~/app/store";
import { makeObservable } from "~/features/utils";

interface GradientCache {
  gradient: Profiles.RgbGradient;
  keyframesCache?: {
    data: string;
    keyframes: Profiles.RgbKeyframe[];
  };
}

const loadedGradients = new Map<string, GradientCache>();

function create(uuid: string): GradientCache {
  log("create", "gradient", uuid);
  const gradientCache = {
    gradient: makeObservable(new Profiles.RgbGradient({ uuid })),
  };
  loadedGradients.set(uuid, gradientCache);
  return gradientCache;
}

export function readGradient(
  uuid: string,
  library: LibraryState
): Profiles.RgbGradient {
  const gradientCache = loadedGradients.get(uuid) ?? create(uuid);
  runInAction(() => updateGradient(gradientCache, library));
  return gradientCache.gradient;
}

function updateGradient(
  gradientCache: GradientCache,
  library: LibraryState
): void {
  const { gradient } = gradientCache;
  const gradientData = library.gradients.entities[gradient.uuid];
  assert(gradientData, `Gradient ${gradient.uuid} not found`);
  if (gradientCache.keyframesCache?.data === gradientData.keyframes) {
    gradient.keyframes = gradientCache.keyframesCache.keyframes;
  } else {
    const cache = {
      data: gradientData.keyframes,
      keyframes: Serializable.toKeyframes(gradientData.keyframes),
    };
    gradientCache.keyframesCache = cache;
    gradient.keyframes = cache.keyframes;
    console.log("updateGradient => " + gradient.keyframes.length);
  }
}
