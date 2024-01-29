import {
  AnimationBits,
  AnimationPreset,
  AnimationCycle,
  Constants,
  AnimationCategory,
  PixelDieType,
} from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditAnimation from "./EditAnimation";
import EditDataSet from "./EditDataSet";
import EditRgbGradient from "./EditRgbGradient";
import EditRgbTrack from "./EditRgbTrack";
import { widget, range, name, observable } from "./decorators";

export default class EditAnimationCycle extends EditAnimation {
  readonly type = "cycle";

  @widget("count")
  @range(0, 10)
  @name("Repeat Count")
  @observable
  count: number;

  @widget("slider")
  @range(1, 10)
  @name("Cycle Count")
  @observable
  cycles: number;

  @widget("slider")
  @range(0, 1)
  @name("Fading Sharpness")
  @observable
  fade: number;

  @widget("slider")
  @range(0, 1)
  @name("Intensity")
  @observable
  intensity: number;

  @widget("faceMask")
  @name("Face Mask")
  @observable
  faces: number;

  @widget("gradient")
  @name("Gradient")
  @observable
  gradient?: EditRgbGradient;

  constructor(opt?: {
    uuid?: string;
    name?: string;
    animFlags?: number;
    duration?: number;
    category?: AnimationCategory;
    dieType?: PixelDieType;
    faces?: number;
    count?: number;
    fade?: number;
    intensity?: number;
    cycles?: number;
    gradient?: EditRgbGradient;
  }) {
    super(opt);
    this.faces = opt?.faces ?? Constants.faceMaskAll;
    this.count = opt?.count ?? 1;
    this.fade = opt?.fade ?? 0;
    this.intensity = opt?.intensity ?? 0.5;
    this.cycles = opt?.cycles ?? 1;
    this.gradient = opt?.gradient;
  }

  toAnimation(_editSet: EditDataSet, _bits: AnimationBits): AnimationPreset {
    // Add gradient
    const gradientTrackOffset = _bits.rgbTracks.length;
    if (this.gradient) {
      _bits.rgbTracks.push(
        new EditRgbTrack({ gradient: this.gradient }).toTrack(_editSet, _bits)
      );
    }
    return safeAssign(new AnimationCycle(), {
      animFlags: this.animFlags,
      duration: this.duration * 1000,
      faceMask: this.faces,
      fade: this.fade * 255,
      count: this.count,
      intensity: this.intensity * 255,
      cyclesTimes10: this.cycles * 10,
      gradientTrackOffset,
    });
  }

  duplicate(uuid?: string): EditAnimation {
    return new EditAnimationCycle({ ...this, uuid });
  }
}
