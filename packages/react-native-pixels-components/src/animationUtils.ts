import {
  AnimationTypeValues,
  EditAnimation,
} from "@systemic-games/pixels-edit-animation";

/**
 * Return the animation type title based on the animation type.
 * @param animation The editAnimation to check type and return title.
 * @returns a string representing the animation type title.
 */
export function AnimationTypeToTitle(animation: EditAnimation): string {
  const animationType = animation.type;
  let animationTtitle = "Type";

  switch (animationType) {
    case AnimationTypeValues.simple:
      animationTtitle = "Simple Flashes";
      break;
    case AnimationTypeValues.rainbow:
      animationTtitle = "Colorful Rainbow";
      break;
    case AnimationTypeValues.gradient:
      animationTtitle = "Simple Gradient";
      break;
    case AnimationTypeValues.gradientPattern:
      animationTtitle = "Gradient LED Pattern";
      break;
    case AnimationTypeValues.keyframed:
      animationTtitle = "Color LED Pattern";
      break;
  }

  return animationTtitle;
}
