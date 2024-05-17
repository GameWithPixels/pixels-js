import { enumValue } from "@systemic-games/pixels-core-utils";

export type RgbColor = Partial<
  Readonly<{
    r: number;
    g: number;
    b: number;
  }>
>;

export type Keyframe = Partial<
  Readonly<{
    time: number;
    color: RgbColor;
  }>
>;

export type Gradient = Partial<
  Readonly<{
    // TODO empty, duration, firstTime, lastTime not needed
    uuid: string;
    keyframes: Keyframe[];
  }>
>;

export type Pattern = Partial<
  Readonly<{
    name: string;
    uuid: string;
    gradients: Gradient[];
    // TODO not needed duration?: number;
  }>
>;

export type AudioClip = Partial<
  Readonly<{
    name: string;
    id: number;
  }>
>;

export type PreviewSettings = Partial<
  Readonly<{
    design: number;
  }>
>;

export type Color = Partial<
  Readonly<{
    type: number;
    rgbColor: RgbColor;
  }>
>;

export type AnimationData = Partial<
  Readonly<{
    name: string;
    uuid: string;
    category: number;
    dieType: number;
    duration: number;
    count: number;
    fade: number;
    faces: number;
    intensity: number;
    patternIndex: number;
    traveling: boolean;
    overrideWithFace: boolean;
    color: Color;
    gradient: Gradient;
    defaultPreviewSettings: PreviewSettings;
  }>
>;

export type Animation = Partial<
  Readonly<{
    type: number;
    data: AnimationData;
  }>
>;

export type ConditionData = Partial<
  Readonly<{
    flags: number;
    faceIndex: number;
    recheckAfter: number;
    period: number;
  }>
>;

export type Condition = Partial<
  Readonly<{
    type: number;
    data: ConditionData;
  }>
>;

export type ActionData = Partial<
  Readonly<{
    animationIndex: number;
    faceIndex: number;
    loopCount: number;
    audioClipIndex: number;
  }>
>;

export type Action = Partial<
  Readonly<{
    type: number;
    data: ActionData;
  }>
>;

export type Rule = Partial<
  Readonly<{
    condition: Condition;
    actions: Action[];
  }>
>;

export type Profile = Partial<
  Readonly<{
    name: string | null;
    uuid: string;
    description: string | null;
    rules: Rule[];
    defaultPreviewSettings: PreviewSettings;
  }>
>;

export type DataSet = Partial<
  Readonly<{
    jsonVersion: number;
    behaviors: Profile[]; // profiles
    animations: Animation[];
    patterns: Pattern[];
    audioClips: AudioClip[];
    defaultBehavior: Profile; // defaultProfile
  }>
>;

export const AnimationTypeValues = {
  none: enumValue(0),
  simple: enumValue(),
  rainbow: enumValue(),
  keyframed: enumValue(),
  gradientPattern: enumValue(),
  gradient: enumValue(),
} as const;

export const ConditionTypeValues = {
  none: enumValue(0),
  helloGoodbye: enumValue(),
  handling: enumValue(),
  rolling: enumValue(),
  faceCompare: enumValue(),
  crooked: enumValue(),
  connectionState: enumValue(),
  batteryState: enumValue(),
  idle: enumValue(),
} as const;

export const ActionTypeValues = {
  none: enumValue(0),
  playAnimation: enumValue(),
  playAudioClip: enumValue(),
} as const;
