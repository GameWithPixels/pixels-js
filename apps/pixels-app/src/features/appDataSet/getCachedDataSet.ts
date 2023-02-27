import {
  EditProfile,
  DataSet,
  EditAnimation,
  createDataSetForProfile,
  createDataSetForAnimation,
} from "@systemic-games/pixels-edit-animation";

const profilesDataSet: Map<
  Readonly<EditProfile> | Readonly<EditAnimation>,
  DataSet
> = new Map();

export default function (
  profileOrAnim: Readonly<EditProfile> | Readonly<EditAnimation>
): DataSet {
  let animData = profilesDataSet.get(profileOrAnim);
  if (!animData) {
    // Remove any previous profile or animation with uuid
    if (profileOrAnim.uuid) {
      const oldEdit = [...profilesDataSet.keys()].find(
        (k) => k.uuid === profileOrAnim.uuid
      );
      if (oldEdit) {
        profilesDataSet.delete(oldEdit);
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
