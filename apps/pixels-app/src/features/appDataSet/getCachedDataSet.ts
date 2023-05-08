import {
  EditProfile,
  DataSet,
  EditAnimation,
  createDataSetForProfile,
  createDataSetForAnimation,
  EditPattern,
  EditAnimationKeyframed,
} from "@systemic-games/pixels-edit-animation";

const profilesDataSet: Map<
  Readonly<EditProfile> | Readonly<EditAnimation>,
  DataSet
> = new Map();

export default function getCachedDataSet(
  profileOrAnim: Readonly<EditProfile> | Readonly<EditAnimation>
): DataSet {
  let animData = profilesDataSet.get(profileOrAnim);
  if (!animData) {
    // Remove previous profile or animation with same uuid
    if (profileOrAnim.uuid) {
      const prev = [...profilesDataSet.keys()].find(
        (k) => k.uuid === profileOrAnim.uuid
      );
      if (prev) {
        profilesDataSet.delete(prev);
      }
    }
    // Remove readonly
    const pOrA = profileOrAnim as EditProfile | EditAnimation;
    animData = (
      pOrA instanceof EditProfile
        ? createDataSetForProfile(pOrA)
        : createDataSetForAnimation(pOrA)
    ).toDataSet();
    profilesDataSet.set(profileOrAnim, animData);
  }
  return animData;
}

const patternAnims = new Map<Readonly<EditPattern>, EditAnimation>();

export function getPatternRenderData(pattern: Readonly<EditPattern>) {
  let anim = patternAnims.get(pattern);
  if (!anim) {
    anim = new EditAnimationKeyframed({
      name: pattern.name,
      duration: pattern.duration,
      pattern: pattern as EditPattern, // TODO pattern is readonly
    });
    patternAnims.set(pattern, anim);
  }
  return getCachedDataSet(anim);
}
