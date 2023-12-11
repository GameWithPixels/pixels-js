import { assert } from "@systemic-games/pixels-core-utils";
import { Serializable } from "@systemic-games/pixels-edit-animation";
import { Profiles } from "@systemic-games/react-native-pixels-connect";
import { runInAction } from "mobx";

import { LibraryState } from "./profilesLibrarySlice";
import { storeLog } from "./storeLog";

import { makeObservable } from "~/features/makeObservable";

interface PatternCache {
  pattern: Profiles.Pattern;
  keyframesCache?: KeyframesCache[];
}

interface KeyframesCache {
  data: string;
  keyframes: Profiles.RgbKeyframe[];
}

const loadedPatterns = new Map<string, PatternCache>();

export function create(uuid: string): PatternCache {
  storeLog("create", "pattern", uuid);
  const patternCache = {
    pattern: makeObservable(new Profiles.Pattern({ uuid })),
  };
  loadedPatterns.set(uuid, patternCache);
  return patternCache;
}

export function readPattern(
  uuid: string,
  library: LibraryState
): Profiles.Pattern {
  const patternCache = loadedPatterns.get(uuid) ?? create(uuid);
  runInAction(() => updatePattern(patternCache, library));
  return patternCache.pattern;
}

function updatePattern(
  patternCache: PatternCache,
  library: LibraryState
): void {
  const { pattern } = patternCache;
  const patternData = library.patterns.find((p) => p.uuid === pattern.uuid);
  assert(patternData, `Pattern ${pattern.uuid} not found`);
  pattern.name = patternData.name;
  const gradientsCount = patternData.gradients.length;
  pattern.gradients.length = gradientsCount;
  let changed = false;
  for (let i = 0; i < gradientsCount; ++i) {
    if (!pattern.gradients[i]) {
      pattern.gradients[i] = makeObservable(new Profiles.RgbGradient());
    }
    let keyframes = patternCache.keyframesCache?.find(
      (e) => e.data === patternData.gradients[i].keyframes
    )?.keyframes;
    if (keyframes) {
      pattern.gradients[i].keyframes = keyframes;
    } else {
      changed = true;
      keyframes = Serializable.toKeyframes(patternData.gradients[i].keyframes);
    }
  }
  if (changed) {
    const cache = new Array(gradientsCount) as KeyframesCache[];
    for (let i = 0; i < gradientsCount; ++i) {
      cache[i] = {
        data: patternData.gradients[i].keyframes,
        keyframes: pattern.gradients[i].keyframes,
      };
    }
    patternCache.keyframesCache = cache;
  }
}
