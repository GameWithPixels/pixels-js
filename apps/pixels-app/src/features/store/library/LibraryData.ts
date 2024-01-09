import { Serializable } from "@systemic-games/react-native-pixels-connect";

export interface LibraryData {
  profiles: Serializable.ProfileData[];
  templates: Serializable.ProfileData[];
  animations: Serializable.AnimationSetData;
  patterns: Serializable.PatternData[];
  gradients: Serializable.GradientData[];
  audioClips: Serializable.AudioClipData[];
}
