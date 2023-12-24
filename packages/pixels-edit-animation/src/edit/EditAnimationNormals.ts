import {
  AnimationBits,
  AnimationPreset,
  AnimationNormals,
} from "@systemic-games/pixels-core-animation";
import { NormalsColorOverrideTypeValues } from "@systemic-games/pixels-core-animation/src/animations/AnimationNormals";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditAnimation from "./EditAnimation";
import EditDataSet from "./EditDataSet";
import EditRgbGradient from "./EditRgbGradient";
import EditRgbTrack from "./EditRgbTrack";
import { widget, name, observable, range } from "./decorators";

export default class EditAnimationNormals extends EditAnimation {
  readonly type = "normals";

  @widget("gradient")
  @name("Gradient Over Time")
  @observable
  gradient?: EditRgbGradient;

  @widget("gradient")
  @name("Gradient Along Axis")
  @observable
  gradientAlongAxis?: EditRgbGradient;

  @widget("slider")
  @range(-10, 10)
  @name("Scroll Speed Along Axis")
  @observable
  axisScrollSpeed: number;

  @widget("slider")
  @range(-10, 10)
  @name("Axis Scale")
  @observable
  axisScale: number;

  @widget("slider")
  @range(-10, 10)
  @name("Axis Offset")
  @observable
  axisOffset: number;

  @widget("gradient")
  @name("Gradient Along Angle")
  @observable
  gradientAlongAngle?: EditRgbGradient;

  @widget("slider")
  @range(-10, 10)
  @name("Scroll Speed Along Angle")
  @observable
  angleScrollSpeed: number;

  @widget("slider")
  @range(0, 1)
  @name("Fading Sharpness")
  @observable
  fade: number;

  @widget("toggle")
  @name("Override color based on face")
  @observable
  overallGradientColorType: number;

  @widget("slider")
  @range(0, 1)
  @name("Override color variance")
  @observable
  overallGradientColorVar: number;

  constructor(opt?: {
    uuid?: string;
    name?: string;
    duration?: number;
    animFlags?: number;
    gradient?: EditRgbGradient;
    gradientAlongAxis?: EditRgbGradient;
    axisScale?: number;
    axisOffset?: number;
    axisScrollSpeed?: number;
    gradientAlongAngle?: EditRgbGradient;
    angleScrollSpeed?: number;
    fade?: number;
    overallGradientColorType?: number;
    overallGradientColorVar?: number;
  }) {
    super(opt);
    this.gradient = opt?.gradient;
    this.gradientAlongAxis = opt?.gradientAlongAxis;
    this.axisScale = opt?.axisScale ?? 1;
    this.axisOffset = opt?.axisOffset ?? 0;
    this.axisScrollSpeed = opt?.axisScrollSpeed ?? 0;
    this.gradientAlongAngle = opt?.gradientAlongAngle;
    this.angleScrollSpeed = opt?.angleScrollSpeed ?? 0;
    this.fade = opt?.fade ?? 0;
    this.overallGradientColorType =
      opt?.overallGradientColorType ?? NormalsColorOverrideTypeValues.none;
    this.overallGradientColorVar = opt?.overallGradientColorVar ?? 0;
  }

  toAnimation(editSet: EditDataSet, bits: AnimationBits): AnimationPreset {
    // Add gradient
    const gradientTrackOffset = bits.rgbTracks.length;
    if (this.gradient) {
      bits.rgbTracks.push(
        new EditRgbTrack({ gradient: this.gradient }).toTrack(editSet, bits)
      );
    }

    const axisGradientTrackOffset = bits.rgbTracks.length;
    if (this.gradientAlongAxis) {
      bits.rgbTracks.push(
        new EditRgbTrack({ gradient: this.gradientAlongAxis }).toTrack(
          editSet,
          bits
        )
      );
    }

    const angleGradientTrackOffset = bits.rgbTracks.length;
    if (this.gradientAlongAngle) {
      bits.rgbTracks.push(
        new EditRgbTrack({ gradient: this.gradientAlongAngle }).toTrack(
          editSet,
          bits
        )
      );
    }

    return safeAssign(new AnimationNormals(), {
      animFlags: this.animFlags,
      duration: this.duration * 1000,
      gradient: gradientTrackOffset,
      gradientAlongAxis: axisGradientTrackOffset,
      gradientAlongAngle: angleGradientTrackOffset,
      axisScaleTimes1000: this.axisScale * 1000,
      axisOffsetTimes1000: this.axisOffset * 1000,
      axisScrollSpeedTimes1000: this.axisScrollSpeed * 1000,
      angleScrollSpeedTimes1000: this.angleScrollSpeed * 1000,
      fade: this.fade * 255,
      overallGradientColorType: this.overallGradientColorType,
      overallGradientColorVar: this.overallGradientColorVar * 1000,
    });
  }

  duplicate(uuid?: string): EditAnimation {
    return new EditAnimationNormals({ ...this, uuid });
  }
}
