import {
  AnimationBits,
  AnimationPreset,
  AnimationNormals,
  NormalsColorOverrideTypeValues,
} from "@systemic-games/pixels-core-animation";
import { safeAssign } from "@systemic-games/pixels-core-utils";

import EditAnimation, { EditAnimationParams } from "./EditAnimation";
import EditDataSet from "./EditDataSet";
import EditRgbGradient from "./EditRgbGradient";
import EditRgbTrack from "./EditRgbTrack";
import { widget, name, observable, range, values } from "./decorators";

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
  @values(NormalsColorOverrideTypeValues)
  @observable
  mainGradientColorType: number;

  @widget("slider")
  @range(0, 1)
  @name("Override color variance")
  @observable
  mainGradientColorVar: number;

  constructor(
    opt?: EditAnimationParams & {
      gradient?: EditRgbGradient;
      gradientAlongAxis?: EditRgbGradient;
      axisScrollSpeed?: number;
      axisScale?: number;
      axisOffset?: number;
      gradientAlongAngle?: EditRgbGradient;
      angleScrollSpeed?: number;
      fade?: number;
      mainGradientColorType?: number;
      mainGradientColorVar?: number;
    }
  ) {
    super(opt);
    this.gradient = opt?.gradient;
    this.gradientAlongAxis = opt?.gradientAlongAxis;
    this.axisScale = opt?.axisScale ?? 1;
    this.axisOffset = opt?.axisOffset ?? 0;
    this.axisScrollSpeed = opt?.axisScrollSpeed ?? 0;
    this.gradientAlongAngle = opt?.gradientAlongAngle;
    this.angleScrollSpeed = opt?.angleScrollSpeed ?? 0;
    this.fade = opt?.fade ?? 0;
    this.mainGradientColorType =
      opt?.mainGradientColorType ?? NormalsColorOverrideTypeValues.none;
    this.mainGradientColorVar = opt?.mainGradientColorVar ?? 0;
  }

  toAnimation(editSet: EditDataSet, bits: AnimationBits): AnimationPreset {
    // Add gradient
    const gradientOverTime = bits.rgbTracks.length;
    if (this.gradient) {
      bits.rgbTracks.push(
        new EditRgbTrack({ gradient: this.gradient }).toTrack(editSet, bits)
      );
    }

    const gradientAlongAxis = bits.rgbTracks.length;
    if (this.gradientAlongAxis) {
      bits.rgbTracks.push(
        new EditRgbTrack({ gradient: this.gradientAlongAxis }).toTrack(
          editSet,
          bits
        )
      );
    }

    const gradientAlongAngle = bits.rgbTracks.length;
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
      gradientOverTime,
      gradientAlongAxis,
      gradientAlongAngle,
      axisScaleTimes1000: this.axisScale * 1000,
      axisOffsetTimes1000: this.axisOffset * 1000,
      axisScrollSpeedTimes1000: this.axisScrollSpeed * 1000,
      angleScrollSpeedTimes1000: this.angleScrollSpeed * 1000,
      fade: this.fade * 255,
      mainGradientColorType: this.mainGradientColorType,
      mainGradientColorVar: this.mainGradientColorVar * 1000,
    });
  }

  duplicate(uuid?: string): EditAnimation {
    return new EditAnimationNormals({
      ...this,
      uuid,
      gradient: this.gradient?.duplicate(),
      gradientAlongAxis: this.gradientAlongAxis?.duplicate(),
      gradientAlongAngle: this.gradientAlongAngle?.duplicate(),
    });
  }

  collectGradients(): EditRgbGradient[] {
    const gradients = [];
    this.gradient && gradients.push(this.gradient);
    this.gradientAlongAxis && gradients.push(this.gradientAlongAxis);
    this.gradientAlongAngle && gradients.push(this.gradientAlongAngle);
    return gradients;
  }
}
