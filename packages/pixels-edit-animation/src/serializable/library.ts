import { AnimationSetData } from "./animations";
import { AudioClipData } from "./audioClip";
import { GradientData } from "./gradient";
import { PatternData } from "./pattern";
import { ProfileData } from "./profile";

export interface LibraryData {
  profiles: ProfileData[];
  animations: AnimationSetData;
  patterns: PatternData[];
  gradients: GradientData[];
  audioClips: AudioClipData[];
}
