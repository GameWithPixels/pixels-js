import {
  AnimationFlagsValues,
  Color,
  EditAnimationCycle,
  EditAnimationNoise,
  EditAnimationNormals,
  EditAnimationRainbow,
  EditRgbGradient,
  EditRgbKeyframe,
  getFaceMask,
  NoiseColorOverrideTypeValues,
  NormalsColorOverrideTypeValues,
} from "@systemic-games/pixels-edit-animation";

export const PrebuildAnimations = {
  rainbow: new EditAnimationRainbow({
    duration: 5,
    animFlags:
      AnimationFlagsValues.traveling | AnimationFlagsValues.useLedIndices,
    count: 4,
    fade: 0.1,
    intensity: 1,
    cycles: 1,
  }),
  rainbow_as: new EditAnimationRainbow({
    duration: 5,
    animFlags:
      AnimationFlagsValues.traveling | AnimationFlagsValues.useLedIndices,
    count: 4,
    fade: 0.1,
    intensity: 0.2,
    cycles: 1,
  }),
  rainbow_fast: new EditAnimationRainbow({
    duration: 3,
    animFlags:
      AnimationFlagsValues.traveling | AnimationFlagsValues.useLedIndices,
    count: 9,
    fade: 0.1,
    intensity: 1,
    cycles: 3,
  }),
  rainbowAllFaces: new EditAnimationRainbow({
    duration: 5,
    count: 4,
    intensity: 1,
    fade: 0.1,
  }),
  rainbowAllFaces_as: new EditAnimationRainbow({
    duration: 5,
    count: 4,
    intensity: 0.2,
    fade: 0.1,
  }),
  rainbowAllFaces_fast: new EditAnimationRainbow({
    duration: 3,
    count: 9,
    intensity: 1,
    fade: 0.1,
  }),
  fixedRainbow: new EditAnimationRainbow({
    duration: 5,
    animFlags:
      AnimationFlagsValues.traveling | AnimationFlagsValues.useLedIndices,
    count: 0,
    fade: 0.1,
    cycles: 2,
  }),
  fixedRainbowD4: new EditAnimationRainbow({
    duration: 10,
    faces: getFaceMask([1, 4, 5, 6], "d6"),
    animFlags:
      AnimationFlagsValues.traveling | AnimationFlagsValues.useLedIndices,
    count: 0,
    fade: 0.05,
    cycles: 3.67,
    intensity: 0.1,
  }),
  cycle_fire: new EditAnimationCycle({
    duration: 3,
    animFlags: AnimationFlagsValues.useLedIndices,
    count: 5,
    fade: 0.5,
    intensity: 1,
    cycles: 1.5,
    gradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: new Color(1.0, 0.5, 0) }),
        new EditRgbKeyframe({ time: 0.1, color: new Color(1.0, 0.8, 0) }),
        new EditRgbKeyframe({ time: 0.2, color: Color.black }),
        new EditRgbKeyframe({ time: 0.3, color: new Color(1.0, 0.8, 0.7) }),
        new EditRgbKeyframe({ time: 0.5, color: new Color(1.0, 0.8, 0) }),
        new EditRgbKeyframe({ time: 0.8, color: new Color(1.0, 0.5, 0) }),
      ],
    }),
  }),
  cycle_water: new EditAnimationCycle({
    duration: 3,
    animFlags: AnimationFlagsValues.useLedIndices,
    count: 6,
    fade: 0.5,
    intensity: 1,
    cycles: 1,
    gradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: new Color(0.0, 0.0, 0.0) }),
        new EditRgbKeyframe({ time: 0.1, color: new Color(0.3, 0.3, 1.0) }),
        new EditRgbKeyframe({ time: 0.3, color: new Color(0.7, 0.7, 1.0) }),
        new EditRgbKeyframe({ time: 0.5, color: new Color(0.5, 0.5, 1.0) }),
        new EditRgbKeyframe({ time: 0.8, color: new Color(0.0, 0.0, 0.0) }),
      ],
    }),
  }),
  cycle_magic: new EditAnimationCycle({
    duration: 3,
    animFlags: AnimationFlagsValues.useLedIndices,
    count: 5,
    fade: 0.5,
    intensity: 1,
    cycles: 5,
    gradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: new Color(0, 0, 1) }),
        new EditRgbKeyframe({ time: 0.4, color: new Color(0, 0.8, 1) }),
        new EditRgbKeyframe({ time: 0.5, color: new Color(0.5, 0, 1) }),
        new EditRgbKeyframe({ time: 0.7, color: new Color(0.8, 0, 1) }),
        new EditRgbKeyframe({ time: 1.0, color: new Color(0, 0, 1) }),
      ],
    }),
  }),
  red_blue_worm: new EditAnimationCycle({
    duration: 5,
    animFlags: AnimationFlagsValues.useLedIndices,
    count: 6,
    fade: 0.5,
    intensity: 1,
    cycles: 0.8,
    gradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: new Color(0.0, 0.0, 0.0) }),
        new EditRgbKeyframe({ time: 0.05, color: new Color(1.0, 0.0, 0.0) }),
        new EditRgbKeyframe({ time: 0.1, color: new Color(0.3, 0.3, 1.0) }),
        new EditRgbKeyframe({ time: 0.8, color: new Color(0.0, 0.0, 0.0) }),
      ],
    }),
  }),
  green_red_worm: new EditAnimationCycle({
    duration: 5,
    animFlags: AnimationFlagsValues.useLedIndices,
    count: 6,
    fade: 0.5,
    intensity: 1,
    cycles: 0.8,
    gradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: new Color(0.0, 0.0, 0.0) }),
        new EditRgbKeyframe({ time: 0.05, color: new Color(0.0, 1.0, 0.0) }),
        new EditRgbKeyframe({ time: 0.1, color: new Color(1.0, 0.3, 0.3) }),
        new EditRgbKeyframe({ time: 0.8, color: new Color(0.0, 0.0, 0.0) }),
      ],
    }),
  }),
  pink_worm: new EditAnimationCycle({
    duration: 5,
    animFlags: AnimationFlagsValues.useLedIndices,
    count: 6,
    fade: 0.5,
    intensity: 1,
    cycles: 0.8,
    gradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: new Color(0.0, 0.0, 0.0) }),
        new EditRgbKeyframe({ time: 0.05, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 0.15, color: new Color(1.0, 0.5, 0.5) }),
        new EditRgbKeyframe({ time: 0.8, color: new Color(0.0, 0.0, 0.0) }),
      ],
    }),
  }),
  waterfall: new EditAnimationNormals({
    duration: 2,
    animFlags: AnimationFlagsValues.none,
    gradient: new EditRgbGradient({
      keyframes: [new EditRgbKeyframe({ time: 0.0, color: Color.black })],
    }),
    axisGradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.black }),
        new EditRgbKeyframe({ time: 0.5, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 1, color: Color.black }),
      ],
    }),
    axisScale: 2,
    axisOffset: -0.5,
    axisScrollSpeed: 2,
    angleGradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 1.0, color: Color.brightWhite }),
      ],
    }),
    angleScrollSpeed: 0,
    fade: 0.1,
    gradientColorType: NormalsColorOverrideTypeValues.faceToRainbowWheel,
    gradientColorVar: 0.1,
  }),
  waterfallRedGreen: new EditAnimationNormals({
    duration: 2,
    animFlags: AnimationFlagsValues.none,
    gradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.1, color: Color.brightRed }),
        new EditRgbKeyframe({ time: 0.5, color: Color.brightYellow }),
        new EditRgbKeyframe({ time: 0.9, color: Color.brightGreen }),
      ],
    }),
    axisGradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.black }),
        new EditRgbKeyframe({ time: 0.5, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 1, color: Color.black }),
      ],
    }),
    axisScale: 2,
    axisOffset: -0.5,
    axisScrollSpeed: 2,
    angleGradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 1.0, color: Color.brightWhite }),
      ],
    }),
    angleScrollSpeed: 0,
    fade: 0.1,
    gradientColorType: NormalsColorOverrideTypeValues.faceToGradient,
    gradientColorVar: 0.2,
  }),
  waterfallRainbow: new EditAnimationNormals({
    duration: 2,
    animFlags: AnimationFlagsValues.none,
    gradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 0.5, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 1.0, color: Color.black }),
      ],
    }),
    axisGradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0, color: new Color(1, 0, 0) }),
        new EditRgbKeyframe({ time: 0.2, color: new Color(1, 1, 0) }),
        new EditRgbKeyframe({ time: 0.4, color: new Color(0, 1, 0) }),
        new EditRgbKeyframe({ time: 0.6, color: new Color(0, 1, 1) }),
        new EditRgbKeyframe({ time: 0.8, color: new Color(0, 0, 1) }),
        new EditRgbKeyframe({ time: 1, color: new Color(1, 0, 1) }),
      ],
    }),
    axisScale: 2,
    axisOffset: -0.5,
    axisScrollSpeed: 2,
    angleGradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 1.0, color: Color.brightWhite }),
      ],
    }),
    angleScrollSpeed: 0,
    fade: 0.5,
    gradientColorType: NormalsColorOverrideTypeValues.none,
    gradientColorVar: 0,
  }),
  spinning_rainbow: new EditAnimationNormals({
    duration: 5,
    animFlags: AnimationFlagsValues.none,
    gradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.black }),
        new EditRgbKeyframe({ time: 0.1, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 0.9, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 1.0, color: Color.black }),
      ],
    }),
    axisGradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.black }),
        new EditRgbKeyframe({ time: 0.5, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 1.0, color: Color.black }),
      ],
    }),
    axisScrollSpeed: 0,
    angleGradient: new EditRgbGradient({
      keyframes: [
        // new EditRgbKeyframe({ time: 0.0, color: Color.brightWhite}),
        // new EditRgbKeyframe({ time: 1.0, color: Color.brightWhite}),
        new EditRgbKeyframe({ time: 0.0, color: Color.brightRed }),
        new EditRgbKeyframe({ time: 0.333, color: Color.brightGreen }),
        new EditRgbKeyframe({ time: 0.666, color: Color.brightBlue }),
        new EditRgbKeyframe({ time: 1.0, color: Color.brightRed }),
      ],
    }),
    angleScrollSpeed: 10,
  }),
  spinning_rainbow_as: new EditAnimationNormals({
    duration: 5,
    animFlags: AnimationFlagsValues.none,
    gradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.black }),
        new EditRgbKeyframe({ time: 0.1, color: new Color(0.7, 0.7, 0.7) }),
        new EditRgbKeyframe({ time: 0.9, color: new Color(0.7, 0.7, 0.7) }),
        new EditRgbKeyframe({ time: 1.0, color: Color.black }),
      ],
    }),
    axisGradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.black }),
        new EditRgbKeyframe({ time: 0.5, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 1.0, color: Color.black }),
      ],
    }),
    axisScrollSpeed: 0,
    angleGradient: new EditRgbGradient({
      keyframes: [
        // new EditRgbKeyframe({ time: 0.0, color: Color.brightWhite}),
        // new EditRgbKeyframe({ time: 1.0, color: Color.brightWhite}),
        new EditRgbKeyframe({ time: 0.0, color: Color.brightRed }),
        new EditRgbKeyframe({ time: 0.333, color: Color.brightGreen }),
        new EditRgbKeyframe({ time: 0.666, color: Color.brightBlue }),
        new EditRgbKeyframe({ time: 1.0, color: Color.brightRed }),
      ],
    }),
    angleScrollSpeed: 10,
  }),
  white_rose: new EditAnimationNormals({
    duration: 5,
    animFlags: AnimationFlagsValues.none,
    gradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.black }),
        new EditRgbKeyframe({ time: 0.1, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 0.9, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 1.0, color: Color.black }),
      ],
    }),
    axisGradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: new Color(1, 0, 0.2) }),
        new EditRgbKeyframe({ time: 0.5, color: new Color(1, 0.5, 0.5) }),
        new EditRgbKeyframe({ time: 1, color: Color.brightWhite }),
        //new EditRgbKeyframe({ time: 1.0, color: new Color(1, 0, 0.2)}),
      ],
    }),
    axisScrollSpeed: 0,
    angleGradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 0.5, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 1.0, color: Color.brightWhite }),
      ],
    }),
    angleScrollSpeed: 0,
  }),
  fire_violet: new EditAnimationNormals({
    duration: 5,
    animFlags: AnimationFlagsValues.none,
    gradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.black }),
        new EditRgbKeyframe({ time: 0.1, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 0.9, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 1.0, color: Color.black }),
      ],
    }),
    axisGradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.3, color: new Color(0.5, 0.2, 1) }),
        new EditRgbKeyframe({ time: 0.5, color: new Color(1, 0.5, 0) }),
        new EditRgbKeyframe({ time: 0.8, color: new Color(1, 0.8, 0.5) }),
        new EditRgbKeyframe({ time: 0.92, color: new Color(1, 0.8, 0.5) }),
      ],
    }),
    axisScrollSpeed: 0,
    angleGradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 0.5, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 1.0, color: Color.brightWhite }),
      ],
    }),
    angleScrollSpeed: 0,
  }),
  quickGreen: new EditAnimationNormals({
    duration: 1,
    animFlags: AnimationFlagsValues.none,
    gradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.black }),
        new EditRgbKeyframe({ time: 0.1, color: Color.brightBlue }),
        new EditRgbKeyframe({ time: 0.9, color: Color.brightCyan }),
        new EditRgbKeyframe({ time: 1.0, color: Color.black }),
      ],
    }),
    axisGradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.3, color: Color.brightGreen }),
        new EditRgbKeyframe({ time: 0.6, color: Color.brightCyan }),
        new EditRgbKeyframe({ time: 0.9, color: Color.blue }),
      ],
    }),
    axisScrollSpeed: -2,
    axisOffset: 0,
    angleGradient: new EditRgbGradient({
      keyframes: [new EditRgbKeyframe({ time: 0.5, color: Color.brightWhite })],
    }),
    angleScrollSpeed: 10,
    fade: 0.5,
  }),
  quickRed: new EditAnimationNormals({
    duration: 1,
    animFlags: AnimationFlagsValues.none,
    gradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.black }),
        new EditRgbKeyframe({ time: 0.1, color: Color.brightMagenta }),
        new EditRgbKeyframe({ time: 0.9, color: Color.brightRed }),
        new EditRgbKeyframe({ time: 1.0, color: Color.black }),
      ],
    }),
    axisGradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.3, color: Color.brightRed }),
        new EditRgbKeyframe({ time: 0.6, color: Color.brightPurple }),
        new EditRgbKeyframe({ time: 0.9, color: Color.brightBlue }),
      ],
    }),
    axisScrollSpeed: -2,
    axisOffset: 0,
    angleGradient: new EditRgbGradient({
      keyframes: [new EditRgbKeyframe({ time: 0.5, color: Color.brightWhite })],
    }),
    angleScrollSpeed: 10,
    fade: 0.5,
  }),
  redGreenAlarm: new EditAnimationNormals({
    duration: 2,
    animFlags: AnimationFlagsValues.none,
    gradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.brightRed }),
        new EditRgbKeyframe({ time: 0.4, color: Color.brightRed }),
        new EditRgbKeyframe({ time: 0.6, color: Color.brightGreen }),
        new EditRgbKeyframe({ time: 1.0, color: Color.brightGreen }),
      ],
    }),
    axisGradient: new EditRgbGradient({
      keyframes: [new EditRgbKeyframe({ time: 0, color: Color.brightWhite })],
    }),
    axisScale: 1,
    axisOffset: 0,
    axisScrollSpeed: 0,
    angleGradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.white }),
        new EditRgbKeyframe({ time: 0.2, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 0.4, color: Color.white }),
        new EditRgbKeyframe({ time: 0.5, color: Color.white }),
        new EditRgbKeyframe({ time: 0.7, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 0.9, color: Color.white }),
      ],
    }),
    angleScrollSpeed: 5,
    fade: 0.2,
    gradientColorType: NormalsColorOverrideTypeValues.faceToGradient,
    gradientColorVar: 0,
  }),
  rainbowAlarm: new EditAnimationNormals({
    duration: 2,
    animFlags: AnimationFlagsValues.none,
    gradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 1.0, color: Color.brightWhite }),
      ],
    }),
    axisGradient: new EditRgbGradient({
      keyframes: [
        // new EditRgbKeyframe({ time: 0, color: Color.brightWhite }),
        // new EditRgbKeyframe({ time: 1, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 0, color: new Color(1, 0, 0) }),
        new EditRgbKeyframe({ time: 0.2, color: new Color(1, 1, 0) }),
        new EditRgbKeyframe({ time: 0.4, color: new Color(0, 1, 0) }),
        new EditRgbKeyframe({ time: 0.6, color: new Color(0, 1, 1) }),
        new EditRgbKeyframe({ time: 0.8, color: new Color(0, 0, 1) }),
        new EditRgbKeyframe({ time: 1, color: new Color(1, 0, 1) }),
      ],
    }),
    axisScale: 2,
    axisOffset: -0.5,
    axisScrollSpeed: 2,
    angleGradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.black }),
        new EditRgbKeyframe({ time: 0.5, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 1, color: Color.black }),
      ],
    }),
    angleScrollSpeed: 5,
    fade: 0.1,
    gradientColorType: NormalsColorOverrideTypeValues.none,
  }),
  spiralUp: new EditAnimationNormals({
    duration: 4,
    animFlags: AnimationFlagsValues.none,
    gradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 1.0, color: Color.brightWhite }),
      ],
    }),
    axisGradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.2, color: Color.black }),
        new EditRgbKeyframe({ time: 0.45, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 0.55, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 0.8, color: Color.black }),
      ],
    }),
    axisScale: 1,
    axisOffset: 1.1,
    axisScrollSpeed: -2.2,
    angleGradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.black }),
        new EditRgbKeyframe({ time: 0.4, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 0.8, color: Color.black }),
      ],
    }),
    angleScrollSpeed: 6,
    fade: 0.2,
    gradientColorType: NormalsColorOverrideTypeValues.faceToRainbowWheel,
    gradientColorVar: 0.1,
  }),
  rainbowUp: new EditAnimationNormals({
    duration: 4,
    animFlags: AnimationFlagsValues.none,
    gradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 1.0, color: Color.brightWhite }),
      ],
    }),
    axisGradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0, color: new Color(1, 0, 0) }),
        new EditRgbKeyframe({ time: 0.2, color: new Color(1, 1, 0) }),
        new EditRgbKeyframe({ time: 0.4, color: new Color(0, 1, 0) }),
        new EditRgbKeyframe({ time: 0.6, color: new Color(0, 1, 1) }),
        new EditRgbKeyframe({ time: 0.8, color: new Color(0, 0, 1) }),
        new EditRgbKeyframe({ time: 1, color: new Color(1, 0, 1) }),
      ],
    }),
    axisScale: 1,
    axisOffset: 0.8,
    axisScrollSpeed: -2.2,
    angleGradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.white }),
        new EditRgbKeyframe({ time: 0.4, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 0.8, color: Color.white }),
      ],
    }),
    angleScrollSpeed: 6,
    fade: 0.2,
    gradientColorType: NormalsColorOverrideTypeValues.none,
    gradientColorVar: 0.1,
  }),
  noise: new EditAnimationNoise({
    duration: 2,
    animFlags: AnimationFlagsValues.none,
    gradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.brightRed }),
        new EditRgbKeyframe({ time: 0.333, color: Color.brightGreen }),
        new EditRgbKeyframe({ time: 0.666, color: Color.brightBlue }),
        new EditRgbKeyframe({ time: 1.0, color: Color.brightRed }),
      ],
    }),
    blinkGradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.black }),
        new EditRgbKeyframe({ time: 0.1, color: new Color(1, 1, 1) }),
        new EditRgbKeyframe({ time: 0.2, color: new Color(0.5, 0.5, 0.5) }),
        new EditRgbKeyframe({ time: 1, color: new Color(0.1, 0.1, 0.1) }),
      ],
    }),
    blinkFrequency: 50,
    blinkFrequencyVar: 0,
    blinkDuration: 2,
    fade: 0.5,
    gradientColorType: NoiseColorOverrideTypeValues.faceToRainbowWheel,
    gradientColorVar: 0.1,
  }),
  noise_blue_slow: new EditAnimationNoise({
    duration: 10,
    animFlags: AnimationFlagsValues.none,
    gradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 1.0, color: Color.brightGreen }),
      ],
    }),
    blinkGradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.black }),
        new EditRgbKeyframe({ time: 0.5, color: Color.brightBlue }),
        new EditRgbKeyframe({ time: 1, color: Color.black }),
      ],
    }),
    blinkFrequency: 20,
    blinkFrequencyVar: 0,
    blinkDuration: 3,
  }),
  red_blue_noise: new EditAnimationNoise({
    duration: 2,
    animFlags: AnimationFlagsValues.none,
    gradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.brightRed }),
        new EditRgbKeyframe({ time: 1.0, color: Color.brightBlue }),
      ],
    }),
    blinkGradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.black }),
        new EditRgbKeyframe({ time: 0.5, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 1, color: Color.black }),
      ],
    }),
    blinkFrequency: 40,
    blinkFrequencyVar: 1,
    blinkDuration: 3,
    fade: 0.1,
    gradientColorType: NoiseColorOverrideTypeValues.faceToGradient,
    gradientColorVar: 0.6,
  }),
  rainbow_noise: new EditAnimationNoise({
    duration: 5,
    animFlags: AnimationFlagsValues.none,
    gradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0, color: new Color(1, 0, 0) }),
        new EditRgbKeyframe({ time: 0.2, color: new Color(1, 1, 0) }),
        new EditRgbKeyframe({ time: 0.4, color: new Color(0, 1, 0) }),
        new EditRgbKeyframe({ time: 0.6, color: new Color(0, 1, 1) }),
        new EditRgbKeyframe({ time: 0.8, color: new Color(0, 0, 1) }),
        new EditRgbKeyframe({ time: 1, color: new Color(1, 0, 1) }),
      ],
    }),
    blinkGradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.black }),
        new EditRgbKeyframe({ time: 0.1, color: new Color(1, 1, 1) }),
        new EditRgbKeyframe({ time: 0.2, color: new Color(0.5, 0.5, 0.5) }),
        new EditRgbKeyframe({ time: 1, color: new Color(0.1, 0.1, 0.1) }),
      ],
    }),
    blinkFrequency: 50,
    blinkFrequencyVar: 0,
    blinkDuration: 2,
    fade: 0.1,
    gradientColorType: NoiseColorOverrideTypeValues.randomFromGradient,
    gradientColorVar: 0,
  }),
  white_blue_noise: new EditAnimationNoise({
    duration: 5,
    animFlags: AnimationFlagsValues.none,
    gradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0, color: new Color(0, 1, 1) }),
        new EditRgbKeyframe({ time: 1, color: new Color(1, 1, 1) }),
      ],
    }),
    blinkGradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.black }),
        new EditRgbKeyframe({ time: 0.1, color: new Color(0.5, 0.5, 0.5) }),
        new EditRgbKeyframe({ time: 1, color: new Color(0.1, 0.1, 0.1) }),
      ],
    }),
    blinkFrequency: 10,
    blinkFrequencyVar: 0,
    blinkDuration: 5,
    fade: 0.1,
    gradientColorType: NoiseColorOverrideTypeValues.randomFromGradient,
    gradientColorVar: 0.5,
  }),
} as const;
