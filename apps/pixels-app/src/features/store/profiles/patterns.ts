import { assert } from "@systemic-games/pixels-core-utils";
import {
  Profiles,
  Serializable,
} from "@systemic-games/react-native-pixels-connect";
import { runInAction } from "mobx";

import { log } from "./log";

import { LibraryState } from "~/app/store";
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

function create(uuid: string): PatternCache {
  log("create", "pattern", uuid);
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
  const patternData = library.patterns.entities[pattern.uuid];
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
    if (!keyframes) {
      changed = true;
      keyframes = Serializable.toKeyframes(patternData.gradients[i].keyframes);
    }
    pattern.gradients[i].keyframes = keyframes;
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
