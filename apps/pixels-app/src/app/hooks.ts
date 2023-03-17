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

import { RootState, AppDispatch } from "./store";

import DataMap from "~/features/DataMap";
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

const profilesCache = new DataMap<
  Serializable.ProfileData,
  Readonly<EditProfile>
>();

export function useAppProfiles(): Readonly<EditProfile>[] {
  const profilesSet = useAppSelector((state) => state.profilesSet);
  const animations = useAppAnimations();
  return useMemo(
    () =>
      profilesSet.profiles.map((profileData) =>
        profilesCache.getOrCreate(profileData, () =>
          Serializable.toProfile(
            profileData,
            (animUuid) =>
              animations.find((a) => a.uuid === animUuid) as EditAnimation, // TODO readonly
            (clipUuid) => new EditAudioClip({ uuid: clipUuid })
          )
        )
      ),
    [animations, profilesSet.profiles]
  );
}

export function useAppAddProfile(): (
  profile: Readonly<EditProfile>,
  insertAfter?: Readonly<EditProfile>
) => void {
  const dispatch = useAppDispatch();
  return useCallback(
    (profile: Readonly<EditProfile>, insertAfter?: Readonly<EditProfile>) => {
      assert(profile.uuid, "useAppAddProfile(): Profile doesn't have a uuid");
      dispatch(
        addProfile({
          profile: Serializable.fromProfile(profile),
          afterUuid: insertAfter?.uuid,
        })
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
      profilesCache.deleteValue(profile);
      dispatch(removeProfile(profile.uuid));
    },
    [dispatch]
  );
}

//
// Animations
//

const animCache = new DataMap<
  Serializable.AnimationData,
  Readonly<EditAnimation>
>();

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
            animCache.getOrCreate(
              animData,
              // TODO animData typing
              () =>
                Serializable.toAnimation(
                  entry[0] as keyof Serializable.AnimationSetData,
                  animData,
                  (patternUuid) =>
                    patterns.find((p) => p.uuid === patternUuid) as EditPattern, // TODO readonly
                  (gradientUuid) =>
                    gradients.find(
                      (g) => g.uuid === gradientUuid
                    ) as EditRgbGradient // TODO readonly
                )
            )
          )
        )
        .flat(),
    [animations, gradients, patterns]
  );
}

export function useAppAddAnimation(): (
  animation: Readonly<EditAnimation>,
  insertAfter?: Readonly<EditAnimation>
) => void {
  const dispatch = useAppDispatch();
  return useCallback(
    (
      animation: Readonly<EditAnimation>,
      insertAfter?: Readonly<EditAnimation>
    ) => {
      assert(
        animation.uuid,
        "useAppAddAnimation(): animation doesn't have a uuid"
      );
      dispatch(
        addAnimation({
          ...Serializable.fromAnimation(animation),
          afterUuid: insertAfter?.uuid,
        })
      );
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
      animCache.deleteValue(animation);
      dispatch(removeAnimation(animation.uuid));
    },
    [dispatch]
  );
}

//
// Patterns
//

const patternsCache = new DataMap<
  Serializable.PatternData,
  Readonly<EditPattern>
>();

export function useAppPatterns(): Readonly<EditPattern>[] {
  const patternsData = useAppSelector((state) => state.profilesSet.patterns);
  return useMemo(
    () =>
      patternsData.map((p) =>
        patternsCache.getOrCreate(p, () => Serializable.toPattern(p))
      ),
    [patternsData]
  );
}

export function useAppAddPattern(): (
  pattern: Readonly<EditPattern>,
  insertAfter?: Readonly<EditPattern>
) => void {
  const dispatch = useAppDispatch();
  return useCallback(
    (pattern: Readonly<EditPattern>, insertAfter?: Readonly<EditPattern>) => {
      assert(pattern.uuid, "useAppAddPattern(): pattern doesn't have a uuid");
      dispatch(
        addPattern({
          pattern: Serializable.fromPattern(pattern),
          afterUuid: insertAfter?.uuid,
        })
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
      patternsCache.deleteValue(pattern);
      dispatch(removePattern(pattern.uuid));
    },
    [dispatch]
  );
}

//
// Gradients
//

const gradientsCache = new DataMap<
  Serializable.GradientData,
  Readonly<EditRgbGradient>
>();
export function useAppGradients(): Readonly<EditRgbGradient>[] {
  const gradientsData = useAppSelector((state) => state.profilesSet.gradients);
  return useMemo(
    () =>
      gradientsData.map((g) =>
        gradientsCache.getOrCreate(g, () => Serializable.toGradient(g))
      ),
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
