import {
  EditProfile,
  DataSet,
  loadAppDataSet,
  EditAnimationRainbow,
  EditAnimation,
  AnimationPreset,
  AnimationBits,
  EditDataSet,
} from "@systemic-games/pixels-edit-animation";

import StandardProfilesJson from "!/profiles/standard-profiles.json";

export const MyAppDataSet = loadAppDataSet(StandardProfilesJson);
const profilesDataSet = new Map<EditProfile, DataSet>();

export function extractDataSet(profile: EditProfile): DataSet {
  let animData = profilesDataSet.get(profile);
  if (!animData) {
    animData = MyAppDataSet.extractForProfile(profile).toDataSet();
    profilesDataSet.set(profile, animData);
  }
  return animData;
}

const defaultAnim = new EditAnimationRainbow();
const animDataMap = new Map<
  EditAnimation,
  {
    animations: AnimationPreset;
    animationBits: AnimationBits;
  }
>();

export function getAnimData(anim?: EditAnimation) {
  if (!anim) {
    anim = defaultAnim;
  }
  let data = animDataMap.get(anim);
  if (!data) {
    const animationBits = new AnimationBits();
    data = {
      animationBits,
      animations: anim.toAnimation(new EditDataSet(), animationBits),
    };
    animDataMap.set(anim, data);
  }
  return data;
}
