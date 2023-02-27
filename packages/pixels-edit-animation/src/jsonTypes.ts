export type RgbColor = Partial<{
  r: number;
  g: number;
  b: number;
}>;

export type Keyframe = Partial<{
  time: number;
  color: RgbColor;
}>;

export type Gradient = Partial<{
  //TODO empty, duration, firstTime, lastTime not needed
  keyframes: Keyframe[];
}>;

export type Pattern = Partial<{
  name: string;
  gradients: Gradient[];
  //TODO not needed duration?: number;
}>;

export type AudioClip = Partial<{
  name: string;
  id: number;
}>;

export type PreviewSettings = Partial<{
  design: number;
}>;

export type Color = Partial<{
  type: number;
  rgbColor: RgbColor;
}>;

export type AnimationData = Partial<{
  name: string;
  duration: number;
  count: number;
  fade: number;
  faces: number;
  patternIndex: number;
  traveling: boolean;
  overrideWithFace: boolean;
  color: Color;
  gradient: Gradient;
  defaultPreviewSettings: PreviewSettings;
}>;

export type Animation = Partial<{
  type: number;
  data: AnimationData;
}>;

export type ConditionData = Partial<{
  flags: number;
  faceIndex: number;
  recheckAfter: number;
  period: number;
}>;

export type Condition = Partial<{
  type: number;
  data: ConditionData;
}>;

export type ActionData = Partial<{
  animationIndex: number;
  faceIndex: number;
  loopCount: number;
  audioClipIndex: number;
}>;

export type Action = Partial<{
  type: number;
  data: ActionData;
}>;

export type Rule = Partial<{
  condition: Condition;
  actions: Action[];
}>;

export type Profile = Partial<{
  name: string;
  description: string;
  rules: Rule[];
  defaultPreviewSettings: PreviewSettings;
}>;

export type DataSet = Partial<{
  jsonVersion: number;
  behaviors: Profile[]; // profiles
  animations: Animation[];
  patterns: Pattern[];
  audioClips: AudioClip[];
  defaultBehavior: Profile; // defaultProfile
}>;
