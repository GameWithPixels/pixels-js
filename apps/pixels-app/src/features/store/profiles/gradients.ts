import { assert } from "@systemic-games/pixels-core-utils";
import { Serializable } from "@systemic-games/pixels-edit-animation";
import { Profiles } from "@systemic-games/react-native-pixels-connect";
import { runInAction } from "mobx";

import { LibraryState } from "../profilesLibrarySlice";
import { storeLog } from "../storeLog";

import { makeObservable } from "~/features/makeObservable";

interface GradientCache {
  gradient: Profiles.RgbGradient;
  keyframesCache?: {
    data: string;
    keyframes: Profiles.RgbKeyframe[];
  };
}

const loadedGradients = new Map<string, GradientCache>();

function create(uuid: string): GradientCache {
  storeLog("create", "gradient", uuid);
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
  const gradientData = library.gradients.find((p) => p.uuid === gradient.uuid);
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
  }
}
