import {
  AnimationType,
  AnimationTypeValues,
} from "@systemic-games/pixels-edit-animation";

/**
 * Return the animation type title based on the animation type.
 * @param animation The editAnimation to check type and return title.
 * @returns a string representing the animation type title.
 */
export default function getAnimationTitle(
  animationType?: AnimationType
): string {
  switch (animationType) {
    case AnimationTypeValues.simple:
      return "Simple Flashes";
    case AnimationTypeValues.rainbow:
      return "Colorful Rainbow";
    case AnimationTypeValues.gradient:
      return "Simple Gradient";
    case AnimationTypeValues.gradientPattern:
      return "Gradient LED Pattern";
    case AnimationTypeValues.keyframed:
      return "Color LED Pattern";
    case AnimationTypeValues.noise:
      return "Noise";
    default:
      return "Type";
  }
}
