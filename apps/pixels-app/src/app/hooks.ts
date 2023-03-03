import { assert } from "@systemic-games/pixels-core-utils";
import {
  EditAnimation,
  EditAudioClip,
  EditPattern,
  EditProfile,
  EditRgbGradient,
  Serializable,
} from "@systemic-games/pixels-edit-animation";
import { useCallback, useMemo } from "react";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

import { RootState, AppDispatch, store } from "./store";

import {
  addProfile,
  updateProfile,
  removeProfile,
  addAnimation,
  updateAnimation,
  removeAnimation,
  addPattern,
  updatePattern,
  removePattern,
} from "~/features/appDataSet/profilesSetSlice";
import {
  DieInfo,
  removePairedDie,
  updatePairedDie,
} from "~/features/pairedDiceSlice";

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Paired dice
export function useAppPairedDice(): DieInfo[] {
  return useAppSelector((state) => state.pairedDice.dice);
}

export function useAppUpdatePairedDie(): (die: DieInfo) => void {
  const dispatch = useAppDispatch();
  return useCallback(
    (die: DieInfo) => {
      dispatch(updatePairedDie(die));
    },
    [dispatch]
  );
}

export function useAppRemovePairedDie(): (pixelId: number) => void {
  const dispatch = useAppDispatch();
  return useCallback(
    (pixelId: number) => {
      dispatch(removePairedDie(pixelId));
    },
    [dispatch]
  );
}

//
// Profiles
//

function createProfileFromUuid(uuid: string): EditProfile {
  const profilesSet = store.getState().profilesSet;
  const profile = profilesSet.profiles.find((p) => p.uuid === uuid);
  assert(profile, `createProfileFromUuid(): No profile with uuid ${uuid}`);
  return Serializable.toProfile(
    profile,
    createStandaloneAnimationFromUuid,
    (audioClipUuid) => {
      if (audioClipUuid) {
        return new EditAudioClip({ uuid: audioClipUuid });
      }
    }
  );
}

let tempProfile: EditProfile | undefined;

export function getTempProfileFromUuid(uuid: string): EditProfile {
  if (tempProfile?.uuid !== uuid) {
    tempProfile = createProfileFromUuid(uuid);
  }
  return tempProfile;
}

export function useAppProfiles(): Readonly<EditProfile>[] {
  const profilesSet = useAppSelector((state) => state.profilesSet);
  const animations = useAppAnimations();
  return useMemo(
    () =>
      profilesSet.profiles.map((data) =>
        Serializable.toProfile(
          data,
          (animUuid) => {
            if (animUuid) {
              const anim = animations.find((a) => a.uuid === animUuid);
              assert(
                anim,
                `useAppProfiles(): No animation with uuid ${animUuid}`
              );
              return anim as EditAnimation; // TODO readonly
            }
          },
          (audioClipUuid) => {
            if (audioClipUuid) {
              return new EditAudioClip({ uuid: audioClipUuid });
            }
          }
        )
      ),
    [animations, profilesSet.profiles]
  );
}

export function useAppAddProfile(): (
  profile: Readonly<EditProfile>,
  insertIndex?: number
) => void {
  const dispatch = useAppDispatch();
  return useCallback(
    (profile: Readonly<EditProfile>, insertIndex?: number) => {
      assert(profile.uuid, "useAppAddProfile(): Profile doesn't have a uuid");
      dispatch(
        addProfile({ profile: Serializable.fromProfile(profile), insertIndex })
      );
    },
    [dispatch]
  );
}

export function useAppUpdateProfile(): (
  profile: Readonly<EditProfile>
) => void {
  const dispatch = useAppDispatch();
  return useCallback(
    (profile: Readonly<EditProfile>) => {
      assert(
        profile.uuid,
        "useAppUpdateProfile(): Profile doesn't have a uuid"
      );
      dispatch(updateProfile(Serializable.fromProfile(profile)));
    },
    [dispatch]
  );
}

export function useAppRemoveProfile(): (
  profile: Readonly<EditProfile>
) => void {
  const dispatch = useAppDispatch();
  return useCallback(
    (profile: Readonly<EditProfile>) => {
      assert(
        profile.uuid,
        "useAppRemoveProfile(): Profile doesn't have a uuid"
      );
      dispatch(removeProfile(profile.uuid));
    },
    [dispatch]
  );
}

//
// Animations
//

let tempAnim: EditAnimation | undefined;

function createStandaloneAnimation<
  T extends keyof Serializable.AnimationSetData
>(
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
      if (patternUuid) {
        const pattern = patternsMap.get(patternUuid);
        if (pattern) {
          return pattern;
        } else {
          const patternData = patterns.find((p) => p.uuid === patternUuid);
          assert(
            patternData,
            `createStandaloneAnimation(): No pattern with uuid ${patternUuid}`
          );
          const pattern = Serializable.toPattern(patternData);
          patternsMap.set(patternUuid, pattern);
          return pattern;
        }
      }
    },
    (gradientUuid) => {
      if (gradientUuid) {
        const gradient = gradientsMap.get(gradientUuid);
        if (gradient) {
          return gradient;
        } else {
          const gradientData = gradients.find((g) => g.uuid === gradientUuid);
          assert(
            gradientData,
            `createStandaloneAnimation(): No gradient with uuid ${gradientUuid}`
          );
          const gradient = Serializable.toGradient(gradientData);
          gradientsMap.set(gradientUuid, gradient);
          return gradient;
        }
      }
    }
  );
}

function createStandaloneAnimationFromUuid(
  uuid?: string
): EditAnimation | undefined {
  if (uuid) {
    const profilesSet = store.getState().profilesSet;
    // Get all animation arrays
    const animArrays = Object.entries(profilesSet.animations).filter(
      Array.isArray
    );
    // And search for our animation
    for (let i = 0; i < animArrays.length; ++i) {
      const animData = animArrays[i][1].find(
        (a: Serializable.AnimationData) => a.uuid === uuid
      );
      if (animData) {
        // Create a new EditAnimation instance
        return createStandaloneAnimation(
          animArrays[i][0] as keyof Serializable.AnimationSetData,
          animData,
          profilesSet.patterns,
          profilesSet.gradients
        );
      }
    }
    throw new Error(
      `createStandaloneAnimationFromUuid: No animation with uuid ${uuid}`
    );
  }
}

export function getTempAnimationFromUuid(uuid: string): EditAnimation {
  if (tempAnim?.uuid !== uuid) {
    tempAnim = createStandaloneAnimationFromUuid(uuid);
    assert(tempAnim);
  }
  return tempAnim;
}

export function useAppAnimations(): Readonly<EditAnimation>[] {
  const animations = useAppSelector((state) => state.profilesSet.animations);
  const patterns = useAppPatterns();
  const gradients = useAppGradients();
  // Get all animation arrays
  return useMemo(
    () =>
      Object.entries(animations)
        .filter(Array.isArray)
        .map((entry) =>
          entry[1].map((animData: any) =>
            // TODO animData typing
            Serializable.toAnimation(
              entry[0] as keyof Serializable.AnimationSetData,
              animData,
              (patternUuid) => {
                if (patternUuid) {
                  const pattern = patterns.find((p) => p.uuid === patternUuid);
                  assert(
                    pattern,
                    `useAppAnimations(): No pattern with uuid ${patternUuid}`
                  );
                  return pattern as EditPattern; // TODO readonly
                }
              },
              (gradientUuid) => {
                if (gradientUuid) {
                  const gradient = gradients.find(
                    (g) => g.uuid === gradientUuid
                  );
                  assert(
                    gradient,
                    `useAppAnimations(): No gradient with uuid ${gradientUuid}`
                  );
                  return gradient as EditRgbGradient; // TODO readonly
                }
              }
            )
          )
        )
        .flat(),
    [animations, gradients, patterns]
  );
}

export function useAppAddAnimation(): (
  animation: Readonly<EditAnimation>,
  _insertIndex?: number
) => void {
  const dispatch = useAppDispatch();
  return useCallback(
    (animation: Readonly<EditAnimation>) => {
      assert(
        animation.uuid,
        "useAppAddAnimation(): animation doesn't have a uuid"
      );
      dispatch(addAnimation(Serializable.fromAnimation(animation)));
    },
    [dispatch]
  );
}

export function useAppUpdateAnimation(): (
  animation: Readonly<EditAnimation>
) => void {
  const dispatch = useAppDispatch();
  return useCallback(
    (animation: Readonly<EditAnimation>) => {
      assert(
        animation.uuid,
        "useAppUpdateAnimation(): animation doesn't have a uuid"
      );
      dispatch(updateAnimation(Serializable.fromAnimation(animation)));
    },
    [dispatch]
  );
}

export function useAppRemoveAnimation(): (
  animation: Readonly<EditAnimation>
) => void {
  const dispatch = useAppDispatch();
  return useCallback(
    (animation: Readonly<EditAnimation>) => {
      assert(
        animation.uuid,
        "useAppRemoveAnimation(): animation doesn't have a uuid"
      );
      dispatch(removeAnimation(animation.uuid));
    },
    [dispatch]
  );
}

//
// Patterns
//

export function useAppPatterns(): Readonly<EditPattern>[] {
  const patternsData = useAppSelector((state) => state.profilesSet.patterns);
  return useMemo(
    () => patternsData.map(Serializable.toPattern),
    [patternsData]
  );
}

export function useAppAddPattern(): (
  pattern: Readonly<EditPattern>,
  insertIndex?: number
) => void {
  const dispatch = useAppDispatch();
  return useCallback(
    (pattern: Readonly<EditPattern>, insertIndex?: number) => {
      assert(pattern.uuid, "useAppAddPattern(): pattern doesn't have a uuid");
      dispatch(
        addPattern({ pattern: Serializable.fromPattern(pattern), insertIndex })
      );
    },
    [dispatch]
  );
}

export function useAppUpdatePattern(): (
  pattern: Readonly<EditPattern>
) => void {
  const dispatch = useAppDispatch();
  return useCallback(
    (pattern: Readonly<EditPattern>) => {
      assert(
        pattern.uuid,
        "useAppUpdatePattern(): pattern doesn't have a uuid"
      );
      dispatch(updatePattern(Serializable.fromPattern(pattern)));
    },
    [dispatch]
  );
}

export function useAppRemovePattern(): (
  pattern: Readonly<EditPattern>
) => void {
  const dispatch = useAppDispatch();
  return useCallback(
    (pattern: Readonly<EditPattern>) => {
      assert(
        pattern.uuid,
        "useAppRemovePattern(): pattern doesn't have a uuid"
      );
      dispatch(removePattern(pattern.uuid));
    },
    [dispatch]
  );
}

//
// Gradients
//

export function useAppGradients(): Readonly<EditRgbGradient>[] {
  const gradientsData = useAppSelector((state) => state.profilesSet.gradients);
  return useMemo(
    () => gradientsData.map(Serializable.toGradient),
    [gradientsData]
  );
}

//
// Users Texts
//

export function useAppUserTexts(): string[] {
  const profiles = useAppSelector((state) => state.profilesSet.profiles);
  return useMemo(() => {
    const texts: string[] = [];
    profiles
      .map((p) => p.actions.makeWebRequest)
      .flat()
      .forEach(({ url, value }) => {
        if (url?.length) {
          texts.push(url);
        }
        if (value?.length) {
          texts.push(value);
        }
      });
    return texts;
  }, [profiles]);
}
