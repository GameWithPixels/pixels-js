import { UniqueNamedData } from "./unique";

export interface AnimationSetData {
  simple: AnimationSimpleData[];
  rainbow: AnimationRainbowData[];
  keyframed: AnimationKeyframedData[];
  gradientPattern: AnimationGradientPatternData[];
  gradient: AnimationGradientData[];
  noise: AnimationNoiseData[];
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
  faces: number;
  blinkDuration: number;
  blinkGradientUuid?: string;
  blinkCount: number;
  fade: number;
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
  };
}
