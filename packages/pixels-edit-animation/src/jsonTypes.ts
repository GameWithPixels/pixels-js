export interface RgbColor {
  r?: number;
  g?: number;
  b?: number;
}

export interface Keyframe {
  time?: number;
  color?: RgbColor;
}

export interface Gradient {
  //TODO empty, duration, firstTime, lastTime not needed
  keyframes?: Keyframe[];
}

export interface Pattern {
  name?: string;
  gradients?: Gradient[];
  //TODO not needed duration?: number;
}

export interface AudioClip {
  name?: string;
  id?: number;
}

export interface PreviewSettings {
  design?: number;
}

export interface Color {
  type: number;
  rgbColor: RgbColor;
}

export interface AnimationData {
  name?: string;
  duration?: number;
  count?: number;
  fade?: number;
  faces?: number;
  patternIndex?: number;
  traveling?: boolean;
  overrideWithFace?: boolean;
  color?: Color;
  gradient?: Gradient;
  defaultPreviewSettings?: PreviewSettings;
}

export interface Animation {
  type?: number;
  data?: AnimationData;
}

export interface ConditionData {
  flags?: number;
  faceIndex?: number;
  recheckAfter?: number;
  period?: number;
}

export interface Condition {
  type?: number;
  data?: ConditionData;
}

export interface ActionData {
  animationIndex?: number;
  faceIndex?: number;
  loopCount?: number;
  audioClipIndex?: number;
}

export interface Action {
  type?: number;
  data?: ActionData;
}

export interface Rule {
  condition?: Condition;
  actions?: Action[];
}

export interface Profile {
  name?: string | null; //TODO remove null
  description?: string | null; //TODO remove null
  rules?: Rule[];
  defaultPreviewSettings?: PreviewSettings;
}

export interface DataSet {
  jsonVersion?: number;
  patterns?: Pattern[];
  animations?: Animation[];
  audioClips?: AudioClip[]; //TODO Moved after animations
  behaviors?: Profile[]; //TODO rename to profiles
  defaultBehavior?: Profile; //TODO rename to defaultProfile
}
