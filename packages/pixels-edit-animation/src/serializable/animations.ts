import { UniqueNamedData } from "./unique";

export interface AnimationSetData {
  flashes: AnimationFlashesData[];
  rainbow: AnimationRainbowData[];
  colorDesign: AnimationColorDesignData[];
  gradientModulated: AnimationGradientModulatedData[];
  gradient: AnimationGradientData[];
  noise: AnimationNoiseData[];
}

export interface AnimationData extends UniqueNamedData {
  duration: number;
}

export interface AnimationFlashesData extends AnimationData {
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

export interface AnimationColorDesignData extends AnimationData {
  patternUuid?: string;
  animFlags: number;
}

export interface AnimationGradientModulatedData extends AnimationData {
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
    flashes: [],
    rainbow: [],
    gradient: [],
    colorDesign: [],
    gradientModulated: [],
    noise: [],
  };
}
