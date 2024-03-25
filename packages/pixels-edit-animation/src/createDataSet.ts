import { EditAnimation, EditDataSet, EditProfile } from "./edit";

function addAnimations(
  dataSet: EditDataSet,
  animations: readonly Readonly<EditAnimation>[]
) {
  const animStartIndex = dataSet.animations.length;

  // Add animations and their child animations
  for (const anim of animations) {
    for (const a of anim.collectAnimations()) {
      if (!dataSet.animations.includes(a)) {
        dataSet.animations.push(a);
      }
    }
  }

  // Include all patterns used by the animations
  const animEndIndex = dataSet.animations.length;
  for (let i = animStartIndex; i < animEndIndex; ++i) {
    const anim = dataSet.animations[i];
    const { rgb, grayscale } = anim.collectPatterns();
    if (grayscale) {
      for (const p of grayscale) {
        if (!dataSet.patterns.includes(p)) {
          dataSet.patterns.push(p);
        }
      }
    }
    if (rgb) {
      for (const p of rgb) {
        if (!dataSet.rgbPatterns.includes(p)) {
          dataSet.rgbPatterns.push(p);
        }
      }
    }
  }
}

export function createDataSetForAnimation(
  animation: Readonly<EditAnimation>
): EditDataSet {
  // The EditDataSet that will only contain the given animation and its patterns
  const dataSet = new EditDataSet();

  // Add the single animation we need
  addAnimations(dataSet, [animation]);

  return dataSet;
}

export function createDataSetForAnimations(
  animations: readonly Readonly<EditAnimation>[]
): EditDataSet {
  // The EditDataSet that will only contain the given animation and its patterns
  const dataSet = new EditDataSet();

  // Add animation list and their patterns to the data set
  addAnimations(dataSet, animations);

  return dataSet;
}

export function createDataSetForProfile(
  profile: Readonly<EditProfile>,
  brightnessFactor?: number
): EditDataSet {
  const brightness = (brightnessFactor ?? 1) * profile.brightness;
  const dataSet = new EditDataSet({ profile, brightness });

  // Add the animations and patterns that the profile uses
  addAnimations(dataSet, dataSet.profile.collectAnimations());

  return dataSet;
}
