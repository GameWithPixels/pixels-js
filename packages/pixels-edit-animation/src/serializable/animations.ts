import { UniqueNamedData } from "./unique";

export interface AnimationSetData {
  simple: AnimationSimpleData[];
  rainbow: AnimationRainbowData[];
  keyframed: AnimationKeyframedData[];
  gradientPattern: AnimationGradientPatternData[];
  gradient: AnimationGradientData[];
  noise: AnimationNoiseData[];
  normals: AnimationNormalsData[];
  sequence: AnimationSequenceData[];
}

export interface AnimationData extends UniqueNamedData {
  duration: number;
}

export interface AnimationSimpleData extends AnimationData {
  faces: number;
  color: string;
  count: number;
  fade: number;
}

export interface AnimationRainbowData extends AnimationData {
  faces: number;
  count: number;
  fade: number;
  animFlags: number;
  intensity: number;
  cycles: number;
}

export interface AnimationKeyframedData extends AnimationData {
  patternUuid?: string;
  animFlags: number;
}

export interface AnimationGradientPatternData extends AnimationData {
  patternUuid?: string;
  gradientUuid?: string;
  overrideWithFace: boolean;
}

export interface AnimationGradientData extends AnimationData {
  faces: number;
  gradientUuid?: string;
}

export interface AnimationNoiseData extends AnimationData {
  gradientUuid?: string;
  blinkGradientUuid?: string;
  blinkFrequency: number;
  blinkFrequencyVar: number;
  blinkDuration: number;
  fade: number;
  gradientColorType: number;
  gradientColorVar: number;
}

export interface AnimationNormalsData extends AnimationData {
  gradientUuid?: string;
  axisGradientUuid?: string;
  axisScrollSpeed: number;
  axisScale: number;
  axisOffset: number;
  angleGradientUuid?: string;
  angleScrollSpeed: number;
  fade: number;
  gradientColorType: number;
  gradientColorVar: number;
}

export interface AnimationSequenceData extends AnimationData {
  animations: {
    uuid: string;
    delay: number;
  }[];
}

//
// Helpers
//

export function createAnimationSetData(): AnimationSetData {
  return {
    simple: [],
    rainbow: [],
    keyframed: [],
    gradientPattern: [],
    gradient: [],
    noise: [],
    normals: [],
    sequence: [],
  };
}
