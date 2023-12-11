import { AnimationSetData } from "./animations";
import { AudioClipData } from "./audioClip";
import { GradientData } from "./gradient";
import { PatternData } from "./pattern";
import { ProfileData } from "./profile";

export interface LibraryData {
  // TODO add indices list
  // allProfiles: { [uuid: string]: number };
  // allPatterns: { [uuid: string]: number };
  // allGradients: { [uuid: string]: number };
  // allAudioClips: { [uuid: string]: number };
  profiles: ProfileData[];
  animations: AnimationSetData;
  patterns: PatternData[];
  gradients: GradientData[];
  audioClips: AudioClipData[];
}
