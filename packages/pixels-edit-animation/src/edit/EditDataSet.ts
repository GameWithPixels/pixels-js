import { DataSet } from "@systemic-games/pixels-core-animation";

import EditAnimation from "./EditAnimation";
import EditPattern from "./EditPattern";
import EditProfile from "./EditProfile";

// TODO should also include gradients
export default class EditDataSet {
  readonly patterns: Readonly<EditPattern>[];
  readonly rgbPatterns: Readonly<EditPattern>[];
  readonly animations: Readonly<EditAnimation>[];
  readonly profile: Readonly<EditProfile>;

  constructor(opt?: {
    patterns?: Readonly<EditPattern>[];
    rgbPatterns?: Readonly<EditPattern>[];
    animations?: Readonly<EditAnimation>[];
    profile?: Readonly<EditProfile>;
  }) {
    this.patterns = opt?.patterns ?? [];
    this.rgbPatterns = opt?.rgbPatterns ?? [];
    this.animations = opt?.animations ?? [];
    this.profile = opt?.profile ?? new EditProfile();
  }

  getPatternTrackOffset(pattern: Readonly<EditPattern>): number {
    let ret = 0;
    for (let i = 0; i < this.patterns.length; ++i) {
      if (this.patterns[i] === pattern) {
        return ret;
      } else {
        ret += pattern.gradients.length;
      }
    }
    return -1;
  }

  getPatternRGBTrackOffset(pattern?: Readonly<EditPattern>): number {
    let ret = 0;
    if (pattern) {
      for (let i = 0; i < this.rgbPatterns.length; ++i) {
        if (this.rgbPatterns[i] === pattern) {
          return ret;
        } else {
          ret += pattern.gradients.length;
        }
      }
    }
    return -1;
  }

  toDataSet(): DataSet {
    const set = new DataSet();

    // Add patterns
    for (const editPattern of this.patterns) {
      if (editPattern) {
        const tracks = editPattern.toTracks(this, set.animationBits);
        set.animationBits.tracks.push(...tracks);
      }
    }

    for (const editPattern of this.rgbPatterns) {
      if (editPattern) {
        const tracks = editPattern.toRgbTracks(this, set.animationBits);
        set.animationBits.rgbTracks.push(...tracks);
      }
    }

    // Add animations
    for (const editAnim of this.animations) {
      if (editAnim) {
        const anim = editAnim.toAnimation(this, set.animationBits);
        set.animations.push(anim);
      }
    }

    // Now convert
    set.profile = this.profile.toProfile(this, set);

    return set;
  }
}
