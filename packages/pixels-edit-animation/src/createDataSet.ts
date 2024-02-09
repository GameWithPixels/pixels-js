import {
  EditAnimation,
  EditDataSet,
  EditPattern,
  EditProfile,
  EditRule,
} from "./edit";

function addAnimations(
  dataSet: EditDataSet,
  animations: Readonly<EditAnimation>[]
) {
  animations.forEach((anim) => {
    dataSet.animations.push(...anim.collectAnimations());
  });

  // Add the single animation we need
  dataSet.animations.push(...animations);

  // Include all patterns used by the animations
  const patterns = new Set<EditPattern>();
  const rgbPatterns = new Set<EditPattern>();
  animations.forEach((anim) => {
    const { rgb, grayscale } = anim.collectPatterns();
    if (grayscale) {
      grayscale.forEach((p) => patterns.add(p));
    }
    if (rgb) {
      rgb.forEach((p) => rgbPatterns.add(p));
    }
  });
  dataSet.patterns.push(...patterns);
  dataSet.rgbPatterns.push(...rgbPatterns);
}

export function createDataSetForAnimation(
  animation: Readonly<EditAnimation>
): EditDataSet {
  // The EditDataSet that will only contain the given animation and its patterns
  const dataSet = new EditDataSet();

  // Add the single animation we need
  dataSet.animations.push(...animation.collectAnimations());

  // Include all patterns used by the animations
  const { rgb, grayscale } = animation.collectPatterns();
  if (grayscale) {
    dataSet.patterns.push(...grayscale);
  }
  if (rgb) {
    dataSet.rgbPatterns.push(...rgb);
  }

  return dataSet;
}

export function createDataSetForAnimations(
  animations: Readonly<EditAnimation>[]
): EditDataSet {
  // The EditDataSet that will only contain the given animation and its patterns
  const dataSet = new EditDataSet();

  // Add animation list and their patterns to the data set
  addAnimations(dataSet, animations);

  return dataSet;
}

export function createDataSetForProfile(
  profile: Readonly<EditProfile>,
  defaultProfile?: Readonly<EditProfile>
): EditDataSet {
  // The EditDataSet that will only contain the animations and their patterns
  // for the given profile
  const dataSet = new EditDataSet({
    profile: profile.duplicate(),
  });

  // And add the animations that the given profile uses
  const animations = dataSet.profile.collectAnimations() ?? [];

  // Add default rules and animations to profile / set
  if (defaultProfile) {
    // Rules that are in fact copied over
    const copiedRules: EditRule[] = [];

    defaultProfile.rules.forEach((rule) => {
      const cond = rule.condition;
      if (
        cond &&
        !dataSet.profile.rules.find((r) => r.condition?.type === cond.type)
      ) {
        const ruleCopy = rule.duplicate();
        copiedRules.push(ruleCopy);
        dataSet.profile.rules.push(ruleCopy);
      }
    });

    // Copied animations
    const copiedAnims: Map<EditAnimation, EditAnimation> = new Map();

    // Add animations used by default rules
    defaultProfile.collectAnimations().forEach((editAnim) => {
      copiedRules.forEach((copiedRule) => {
        if (copiedRule.requiresAnimation(editAnim)) {
          let copiedAnim = copiedAnims.get(editAnim);
          if (!copiedAnim) {
            copiedAnim = editAnim.duplicate();
            animations.push(copiedAnim);
            copiedAnims.set(editAnim, copiedAnim);
          }
          copiedRule.replaceAnimation(editAnim, copiedAnim);
        }
      });
    });
  }

  // Add animation list and their patterns to the data set
  addAnimations(dataSet, animations);

  return dataSet;
}
