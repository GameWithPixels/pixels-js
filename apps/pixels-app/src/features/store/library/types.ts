import { Serializable } from "@systemic-games/react-native-pixels-connect";

export type AppProfileData = Serializable.ProfileData & {
  hash: number;
  sourceUuid?: string;
};

export interface LibraryData {
  compositeProfiles: Serializable.CompositeProfileData[];
  profiles: AppProfileData[];
  animations: Serializable.AnimationSetData;
  patterns: Serializable.PatternData[];
  gradients: Serializable.GradientData[];
  audioClips: Serializable.AudioClipData[];
}
