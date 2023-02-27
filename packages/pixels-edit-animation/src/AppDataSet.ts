import EditAnimation from "./edit/EditAnimation";
import EditAudioClip from "./edit/EditAudioClip";
import EditPattern from "./edit/EditPattern";
import EditProfile from "./edit/EditProfile";

export default class AppDataSet {
  readonly _patterns: EditPattern[];
  readonly _animations: EditAnimation[];
  readonly _audioClips: EditAudioClip[];
  readonly _profiles: EditProfile[];
  readonly _defaultProfile: EditProfile;

  get patterns(): EditPattern[] {
    return this._patterns;
  }

  get animations(): EditAnimation[] {
    return this._animations;
  }

  get audioClips(): EditAudioClip[] {
    return this._audioClips;
  }

  get profiles(): EditProfile[] {
    return this._profiles;
  }

  get defaultProfile(): EditProfile {
    return this._defaultProfile;
  }

  constructor(options?: {
    patterns?: EditPattern[];
    animations?: EditAnimation[];
    audioClips?: EditAudioClip[];
    profiles?: EditProfile[];
    defaultProfile?: EditProfile;
  }) {
    this._patterns = options?.patterns ?? [];
    this._animations = options?.animations ?? [];
    this._audioClips = options?.audioClips ?? [];
    this._profiles = options?.profiles ?? [];
    this._defaultProfile = options?.defaultProfile ?? new EditProfile();
  }

  findPattern(name: string): EditPattern | undefined {
    return this._patterns.find((p) => p.name === name);
  }

  findAnimation(name: string): EditAnimation | undefined {
    return this._animations.find((p) => p.name === name);
  }

  findAudioClip(name: string): EditAudioClip | undefined {
    return this._audioClips.find((p) => p.name === name);
  }

  findProfile(name: string): EditProfile | undefined {
    return this._profiles.find((p) => p.name === name);
  }
}
