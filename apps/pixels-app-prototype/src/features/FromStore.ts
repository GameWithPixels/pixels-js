import { assert } from "@systemic-games/pixels-core-utils";
import {
  EditAnimation,
  EditAudioClip,
  EditPattern,
  EditProfile,
  EditRgbGradient,
  Serializable,
} from "@systemic-games/pixels-edit-animation";

import { store } from "~/app/store";

function deserializeAnimation<T extends keyof Serializable.AnimationSetData>(
  type: T,
  data: Readonly<Serializable.AnimationSetData[T][number]>,
  patterns: Serializable.PatternData[],
  gradients: Serializable.GradientData[]
): EditAnimation {
  const patternsMap = new Map<string, EditPattern>();
  const gradientsMap = new Map<string, EditRgbGradient>();
  return Serializable.toAnimation(
    type,
    data,
    (patternUuid) => {
      let pattern = patternsMap.get(patternUuid);
      if (!pattern) {
        const patternData = patterns.find((p) => p.uuid === patternUuid);
        if (patternData) {
          pattern = Serializable.toPattern(patternData);
          patternsMap.set(patternUuid, pattern);
        }
      }
      return pattern;
    },
    (gradientUuid) => {
      let gradient = gradientsMap.get(gradientUuid);
      if (!gradient) {
        const gradientData = gradients.find((g) => g.uuid === gradientUuid);
        if (gradientData) {
          gradient = Serializable.toGradient(gradientData);
          gradientsMap.set(gradientUuid, gradient);
        }
      }
      return gradient;
    }
  );
}

export const FromStore = {
  loadProfile(uuid: string): EditProfile {
    const profilesLibrary = store.getState().profilesLibrary;
    const profile = profilesLibrary.profiles.find((p) => p.uuid === uuid);
    assert(profile, `getProfileFromUuid(): No profile with uuid ${uuid}`);
    return Serializable.toProfile(
      profile,
      FromStore.loadAnimation,
      (audioClipUuid) => new EditAudioClip({ uuid: audioClipUuid })
    );
  },

  loadAnimation(uuid: string): EditAnimation {
    const profilesLibrary = store.getState().profilesLibrary;
    // Get all animation arrays
    const animArrays = Object.entries(profilesLibrary.animations).filter(
      Array.isArray
    );
    // And search for our animation
    for (let i = 0; i < animArrays.length; ++i) {
      const animData = animArrays[i][1].find(
        (a: Serializable.AnimationData) => a.uuid === uuid
      );
      if (animData) {
        // Create a new EditAnimation instance
        return deserializeAnimation(
          animArrays[i][0] as keyof Serializable.AnimationSetData,
          animData,
          profilesLibrary.patterns,
          profilesLibrary.gradients
        );
      }
    }
    throw new Error(`retrieveAnimation: No animation with uuid ${uuid}`);
  },
} as const;
