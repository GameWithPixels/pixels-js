import { NoiseColorOverrideTypeValues } from "@systemic-games/pixels-core-animation/src/animations/AnimationNoise";
import { NormalsColorOverrideTypeValues } from "@systemic-games/pixels-core-animation/src/animations/AnimationNormals";
import {
  AnimationFlagsValues,
  EditAnimationNoise,
  EditAnimationNormals,
  EditAnimationRainbow,
  EditRgbGradient,
  EditRgbKeyframe,
  getFaceMask,
} from "@systemic-games/pixels-edit-animation";
import { Color } from "@systemic-games/react-native-pixels-connect";

export const PrebuildAnimations = {
  rainbow: new EditAnimationRainbow({
    duration: 5,
    animFlags:
      AnimationFlagsValues.traveling | AnimationFlagsValues.useLedIndices,
    count: 4,
    fade: 0.5,
    intensity: 1,
    cycles: 1,
  }),
  rainbow_as: new EditAnimationRainbow({
    duration: 5,
    animFlags:
      AnimationFlagsValues.traveling | AnimationFlagsValues.useLedIndices,
    count: 4,
    fade: 0.1,
    intensity: 0.5,
    cycles: 1,
  }),
  rainbowAllFaces: new EditAnimationRainbow({
    duration: 5,
    count: 4,
    intensity: 1,
    fade: 0.5,
  }),
  rainbowAllFaces_as: new EditAnimationRainbow({
    duration: 5,
    count: 4,
    intensity: 0.6,
    fade: 0.5,
  }),
  rainbowAllFaces_as20: new EditAnimationRainbow({
    duration: 5,
    count: 4,
    intensity: 0.2,
    fade: 0.5,
  }),
  fixedRainbow: new EditAnimationRainbow({
    duration: 5,
    animFlags:
      AnimationFlagsValues.traveling | AnimationFlagsValues.useLedIndices,
    count: 0,
    fade: 0.05,
    cycles: 3.67,
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
  waterfall: new EditAnimationNormals({
    duration: 2,
    animFlags: AnimationFlagsValues.none,
    gradient: new EditRgbGradient({
      keyframes: [new EditRgbKeyframe({ time: 0.0, color: Color.black })],
    }),
    gradientAlongAxis: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.black }),
        new EditRgbKeyframe({ time: 0.5, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 1, color: Color.black }),
      ],
    }),
    axisScale: 2,
    axisOffset: -0.5,
    axisScrollSpeed: 2,
    gradientAlongAngle: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 1.0, color: Color.brightWhite }),
      ],
    }),
    angleScrollSpeed: 0,
    fade: 0.1,
    overallGradientColorType: NormalsColorOverrideTypeValues.faceToRainbowWheel,
    overallGradientColorVar: 0.1,
  }),
  waterfallRedGreen: new EditAnimationNormals({
    duration: 2,
    animFlags: AnimationFlagsValues.none,
    gradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.brightRed }),
        new EditRgbKeyframe({ time: 0.5, color: Color.brightYellow }),
        new EditRgbKeyframe({ time: 1, color: Color.brightGreen }),
      ],
    }),
    gradientAlongAxis: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.black }),
        new EditRgbKeyframe({ time: 0.5, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 1, color: Color.black }),
      ],
    }),
    axisScale: 2,
    axisOffset: -0.5,
    axisScrollSpeed: 2,
    gradientAlongAngle: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 1.0, color: Color.brightWhite }),
      ],
    }),
    angleScrollSpeed: 0,
    fade: 0.1,
    overallGradientColorType: NormalsColorOverrideTypeValues.faceToGradient,
    overallGradientColorVar: 0.2,
  }),
  normals: new EditAnimationNormals({
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
    gradientAlongAxis: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.black }),
        new EditRgbKeyframe({ time: 0.5, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 1.0, color: Color.black }),
      ],
    }),
    axisScrollSpeed: 0,
    gradientAlongAngle: new EditRgbGradient({
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
  normals_as: new EditAnimationNormals({
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
    gradientAlongAxis: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.black }),
        new EditRgbKeyframe({ time: 0.5, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 1.0, color: Color.black }),
      ],
    }),
    axisScrollSpeed: 0,
    gradientAlongAngle: new EditRgbGradient({
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
  normals2: new EditAnimationNormals({
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
    gradientAlongAxis: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: new Color(1, 0, 0.2) }),
        new EditRgbKeyframe({ time: 0.5, color: new Color(1, 0.5, 0.5) }),
        new EditRgbKeyframe({ time: 1, color: Color.brightWhite }),
        //new EditRgbKeyframe({ time: 1.0, color: new Color(1, 0, 0.2)}),
      ],
    }),
    axisScrollSpeed: 0,
    gradientAlongAngle: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 0.5, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 1.0, color: Color.brightWhite }),
      ],
    }),
    angleScrollSpeed: 0,
  }),
  normals3: new EditAnimationNormals({
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
    gradientAlongAxis: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.3, color: new Color(0.5, 0.2, 1) }),
        new EditRgbKeyframe({ time: 0.5, color: new Color(1, 0.5, 0) }),
        new EditRgbKeyframe({ time: 0.8, color: new Color(1, 0.8, 0.5) }),
        //new EditRgbKeyframe({ time: 1.0, color: new Color(1, 0, 0.2)}),
      ],
    }),
    axisScrollSpeed: 0,
    gradientAlongAngle: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 0.5, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 1.0, color: Color.brightWhite }),
      ],
    }),
    angleScrollSpeed: 0,
  }),
  normals4: new EditAnimationNormals({
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
    gradientAlongAxis: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.3, color: new Color(0.2, 0.2, 1) }),
        new EditRgbKeyframe({ time: 0.5, color: new Color(1, 0.2, 0) }),
        new EditRgbKeyframe({ time: 0.8, color: new Color(1, 0.8, 0.5) }),
        //new EditRgbKeyframe({ time: 1.0, color: new Color(1, 0, 0.2)}),
      ],
    }),
    axisScrollSpeed: 0,
    gradientAlongAngle: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 0.5, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 1.0, color: Color.brightWhite }),
      ],
    }),
    angleScrollSpeed: 0,
  }),
  upDownSpinning: new EditAnimationNormals({
    duration: 2,
    animFlags: AnimationFlagsValues.none,
    gradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 1.0, color: Color.brightWhite }),
      ],
    }),
    gradientAlongAxis: new EditRgbGradient({
      keyframes: [new EditRgbKeyframe({ time: 0, color: Color.brightWhite })],
    }),
    axisScale: 1,
    axisOffset: 0,
    axisScrollSpeed: 0,
    gradientAlongAngle: new EditRgbGradient({
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
    fade: 0.1,
    overallGradientColorType: NormalsColorOverrideTypeValues.faceToRainbowWheel,
    overallGradientColorVar: 0.3,
  }),
  redGreenSpinning: new EditAnimationNormals({
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
    gradientAlongAxis: new EditRgbGradient({
      keyframes: [new EditRgbKeyframe({ time: 0, color: Color.brightWhite })],
    }),
    axisScale: 1,
    axisOffset: 0,
    axisScrollSpeed: 0,
    gradientAlongAngle: new EditRgbGradient({
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
    overallGradientColorType: NormalsColorOverrideTypeValues.faceToGradient,
    overallGradientColorVar: 0,
  }),
  upDownRainbowWithSpinning: new EditAnimationNormals({
    duration: 2,
    animFlags: AnimationFlagsValues.none,
    gradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 1.0, color: Color.brightWhite }),
      ],
    }),
    gradientAlongAxis: new EditRgbGradient({
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
    gradientAlongAngle: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.black }),
        new EditRgbKeyframe({ time: 0.5, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 1, color: Color.black }),
      ],
    }),
    angleScrollSpeed: 5,
    fade: 0.1,
    overallGradientColorType: NormalsColorOverrideTypeValues.none,
  }),
  spiralUp: new EditAnimationNormals({
    duration: 2,
    animFlags: AnimationFlagsValues.none,
    gradient: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 1.0, color: Color.brightWhite }),
      ],
    }),
    gradientAlongAxis: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.2, color: Color.black }),
        new EditRgbKeyframe({ time: 0.45, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 0.55, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 0.8, color: Color.black }),
        // new EditRgbKeyframe({ time: 0, color: new Color(1, 0, 0) }),
        // new EditRgbKeyframe({ time: 0.2, color: new Color(1, 1, 0) }),
        // new EditRgbKeyframe({ time: 0.4, color: new Color(0, 1, 0) }),
        // new EditRgbKeyframe({ time: 0.6, color: new Color(0, 1, 1) }),
        // new EditRgbKeyframe({ time: 0.8, color: new Color(0, 0, 1) }),
        // new EditRgbKeyframe({ time: 1, color: new Color(1, 0, 1) }),
      ],
    }),
    axisScale: 1,
    axisOffset: 1.1,
    axisScrollSpeed: -2.2,
    gradientAlongAngle: new EditRgbGradient({
      keyframes: [
        new EditRgbKeyframe({ time: 0.0, color: Color.black }),
        new EditRgbKeyframe({ time: 0.4, color: Color.brightWhite }),
        new EditRgbKeyframe({ time: 0.8, color: Color.black }),
      ],
    }),
    angleScrollSpeed: 6,
    fade: 0.2,
    overallGradientColorType: NormalsColorOverrideTypeValues.faceToRainbowWheel,
    overallGradientColorVar: 0.1,
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
    overallGradientColorType: NoiseColorOverrideTypeValues.faceToRainbowWheel,
    overallGradientColorVar: 0.1,
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
    overallGradientColorType: NoiseColorOverrideTypeValues.faceToGradient,
    overallGradientColorVar: 0.6,
  }),
  rainbow_noise: new EditAnimationNoise({
    duration: 2,
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
    fade: 0.5,
    overallGradientColorType: NoiseColorOverrideTypeValues.randomFromGradient,
    overallGradientColorVar: 0,
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
    overallGradientColorType: NoiseColorOverrideTypeValues.randomFromGradient,
    overallGradientColorVar: 0.5,
  }),
} as const;
