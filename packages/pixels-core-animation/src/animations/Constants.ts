/**
 * @category Animation
 */
const Constants = {
  /** Maximum number of LED on a die. */
  maxLEDsCount: 20,

  /** Magic number for picking a color based on the current face. */
  paletteColorFromFace: 127,

  /** Magic number for randomly picking a color. */
  paletteColorFromRandom: 126,

  /** Mask value for turning all LEDs on. */
  faceMaskAll: 0xffffffff,

  /** Time resolution of 1 animation keyframe. */
  keyframeTimeResolutionMs: 2,

  /** Magic number for the current face index. */
  currentFaceIndex: -1,
} as const;

export default Constants;
