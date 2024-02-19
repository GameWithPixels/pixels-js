import {
  AnimationCategory,
  AnimationFlags,
  PixelDieType,
} from "@systemic-games/pixels-core-animation";

import { UniqueNamedData } from "./unique";

export interface AnimationSetData {
  flashes: AnimationFlashesData[];
  rainbow: AnimationRainbowData[];
  pattern: AnimationPatternData[];
  gradientPattern: AnimationGradientPatternData[];
  gradient: AnimationGradientData[];
  noise: AnimationNoiseData[];
  normals: AnimationNormalsData[];
}

export interface AnimationData extends UniqueNamedData {
  duration: number;
  animFlags: AnimationFlags[];
  category: AnimationCategory;
  dieType: PixelDieType;
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
  intensity: number;
  cycles: number;
}

export interface AnimationPatternData extends AnimationData {
  patternUuid?: string;
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

export interface AnimationNormalsData extends AnimationData {
  gradientUuid?: string;
}

//
// Helpers
//

export function createAnimationSetData(): AnimationSetData {
  return {
    flashes: [],
    rainbow: [],
    gradient: [],
    pattern: [],
    gradientPattern: [],
    noise: [],
    normals: [],
  };
}
