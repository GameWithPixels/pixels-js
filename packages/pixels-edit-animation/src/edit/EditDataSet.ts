import { DataSet } from "@systemic-games/pixels-core-animation";

import EditAnimation from "./EditAnimation";
import EditPattern from "./EditPattern";
import EditProfile from "./EditProfile";
import Editable from "./Editable";

export default class EditDataSet extends Editable {
  readonly patterns: EditPattern[];
  readonly rgbPatterns: EditPattern[];
  readonly animations: EditAnimation[];
  readonly profile: EditProfile;

  constructor(options?: {
    patterns?: EditPattern[];
    rgbPatterns?: EditPattern[];
    animations?: EditAnimation[];
    profile?: EditProfile;
  }) {
    super();
    this.patterns = options?.patterns ?? [];
    this.rgbPatterns = options?.rgbPatterns ?? [];
    this.animations = options?.animations ?? [];
    this.profile = options?.profile ?? new EditProfile();
  }

  getPatternTrackOffset(pattern: EditPattern): number {
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

  getPatternRGBTrackOffset(pattern?: EditPattern): number {
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
    this.patterns.forEach((editPattern) => {
      if (editPattern) {
        const tracks = editPattern.toTracks(this, set.animationBits);
        set.animationBits.tracks.push(...tracks);
      }
    });

    this.rgbPatterns.forEach((editPattern) => {
      if (editPattern) {
        const tracks = editPattern.toRgbTracks(this, set.animationBits);
        set.animationBits.rgbTracks.push(...tracks);
      }
    });

    // Add animations
    this.animations.forEach((editAnim) => {
      if (editAnim) {
        const anim = editAnim.toAnimation(this, set.animationBits);
        set.animations.push(anim);
      }
    });

    // Now convert
    set.profile = this.profile.toProfile(this, set);

    return set;
  }
}
