import AnimationInstance from "./AnimationInstance";
import AnimationNormals from "./AnimationNormals";
import { AnimConstants } from "./Constants";
import { NormalsColorOverrideTypeValues } from "./NormalsColorOverrideType";
import {
  Vec3,
  vec3,
  dotTimes1000,
  cross,
  normalize,
  sub,
  mulScalar,
} from "../Vec3";
import { Color32Utils } from "../color";
import { getFaceForLEDIndex } from "../faceUtils";
import { getBaseNormals } from "../normals";

const _asinTable = [
  63, 68, 70, 72, 73, 75, 76, 77, 78, 79, 79, 80, 81, 82, 82, 83, 84, 84, 85,
  86, 86, 87, 87, 88, 89, 89, 90, 90, 91, 91, 92, 92, 93, 93, 94, 94, 95, 95,
  95, 96, 96, 97, 97, 98, 98, 98, 99, 99, 100, 100, 100, 101, 101, 102, 102,
  102, 103, 103, 104, 104, 104, 105, 105, 105, 106, 106, 107, 107, 107, 108,
  108, 108, 109, 109, 109, 110, 110, 110, 111, 111, 112, 112, 112, 113, 113,
  113, 114, 114, 114, 115, 115, 115, 116, 116, 116, 117, 117, 117, 118, 118,
  118, 119, 119, 119, 119, 120, 120, 120, 121, 121, 121, 122, 122, 122, 123,
  123, 123, 124, 124, 124, 125, 125, 125, 126, 126, 126, 127, 127, 127, 127,
  128, 128, 128, 129, 129, 129, 130, 130, 130, 131, 131, 131, 132, 132, 132,
  133, 133, 133, 134, 134, 134, 135, 135, 135, 135, 136, 136, 136, 137, 137,
  137, 138, 138, 138, 139, 139, 139, 140, 140, 140, 141, 141, 141, 142, 142,
  142, 143, 143, 144, 144, 144, 145, 145, 145, 146, 146, 146, 147, 147, 147,
  148, 148, 149, 149, 149, 150, 150, 150, 151, 151, 152, 152, 152, 153, 153,
  154, 154, 154, 155, 155, 156, 156, 156, 157, 157, 158, 158, 159, 159, 159,
  160, 160, 161, 161, 162, 162, 163, 163, 164, 164, 165, 165, 166, 167, 167,
  168, 168, 169, 170, 170, 171, 172, 172, 173, 174, 175, 175, 176, 177, 178,
  179, 181, 182, 184, 186, 191,
];

// in: 0 => -1, 255 => +1
// out: 0 => -pi, 255 => pi
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function asin8(x: number): number {
  return _asinTable[x & 0xff]; // 0-255 in, 0-255 out
}

// in: 0 => -1, 255 => +1
// out: 0 => -pi, 255 => pi
function acos8(x: number): number {
  return 64 + _asinTable[x & 0xff]; // 0-255 in, 0-255 out
}

/**
 * @category Animation Instance
 */
export default class AnimationInstanceNormals extends AnimationInstance {
  private normals: readonly Readonly<Vec3>[] = [];
  private faceNormal = vec3();
  private backVector = vec3();
  private baseColorParam = 0;

  get preset(): AnimationNormals {
    return this.animationPreset as AnimationNormals;
  }

  start(startTime: number): void {
    super.start(startTime);
    const preset = this.preset;
    const faceCount = this.die.faceCount;

    // Grab the die normals
    this.normals = getBaseNormals(this.die.dieType);

    // Grab the orientation normal, based on the current face
    const face = this.die.topFace;
    this.faceNormal = this.normals[face];

    let backFaceOffset = 1;
    let backVectorNormal = this.normals[(face + backFaceOffset) % faceCount];
    while (
      Math.abs(dotTimes1000(this.faceNormal, backVectorNormal)) > 800 &&
      backFaceOffset < faceCount
    ) {
      backFaceOffset += 1;
      backVectorNormal = {
        ...this.normals[(face + backFaceOffset) % faceCount],
      };
    }

    // Compute our base vectors, up is aligned with current face, and
    // a back is at 90 degrees from that.
    const cross_ = cross(this.faceNormal, backVectorNormal);
    normalize(cross_);
    this.backVector = cross(cross_, this.faceNormal);

    // For color override, precompute parameter
    switch (preset.mainGradientColorType) {
      case NormalsColorOverrideTypeValues.faceToGradient:
        this.baseColorParam = (this.die.currentFace * 1000) / faceCount;
        break;
      case NormalsColorOverrideTypeValues.faceToRainbowWheel:
        this.baseColorParam = (this.die.currentFace * 256) / faceCount;
        break;
      case NormalsColorOverrideTypeValues.none:
      default:
        this.baseColorParam = 0;
        break;
    }
  }

  updateLEDs(ms: number, retIndices: number[], retColors32: number[]): number {
    const preset = this.preset;
    const ledCount = this.die.ledCount;
    const time = ms - this.startTime;
    const fadeTime = (preset.duration * preset.fade) / (255 * 2);

    let intensity = 255;
    if (time <= fadeTime) {
      // Ramp up
      intensity = (time * 255) / fadeTime;
    } else if (time >= preset.duration - fadeTime) {
      // Ramp down
      intensity = ((preset.duration - time) * 255) / fadeTime;
    }

    const axisScrollTime =
      (time * preset.axisScrollSpeedTimes1000) / preset.duration;
    const angleScrollTime =
      (time * preset.angleScrollSpeedTimes1000) / preset.duration;
    const gradientTime = (time * 1000) / preset.duration;

    // Figure out the color from the gradient
    const gradient = this.bits.getRgbTrack(preset.gradientTrackOffset);
    const axisGradient = this.bits.getRgbTrack(preset.axisGradientTrackOffset);
    const angleGradient = this.bits.getRgbTrack(
      preset.angleGradientTrackOffset
    );
    for (let i = 0; i < ledCount; ++i) {
      const face = getFaceForLEDIndex(this.die.dieType, i);

      // Compute color relative to up/down angle (based on the angle to axis)
      // We'll extract the angle from the dot product of the face's normal and the axis
      const dotAxisTimes1000 = dotTimes1000(
        this.faceNormal,
        this.normals[face]
      );

      // remap the [-1000, 1000] range to an 8 bit value usable by acos8
      const dotAxis8 = (dotAxisTimes1000 * 1275 + 1275000) / 10000;

      // Use lookup acos table
      const angleToAxis8 = acos8(dotAxis8);

      // remap 8 bit value to [-1000, 1000] range
      const angleToAxisNormalized = ((angleToAxis8 - 128) * 1000) / 128;

      // Scale / Offset the value so we can use a smaller subset of the gradient
      const axisGradientBaseTime =
        (angleToAxisNormalized * 1000) / preset.axisScaleTimes1000 +
        preset.axisOffsetTimes1000;

      // Add motion
      const axisGradientTime = axisGradientBaseTime + axisScrollTime;

      // Compute color along axis
      const axisColor = axisGradient.evaluateColor(
        axisGradientTime,
        this.bits,
        this.die
      );

      // Compute color relative to up/down angle (angle to axis), we'll use the dot product to the back vector

      // Start by getting a properly normalized in-plane direction vector
      const inPlaneNormal = sub(
        this.normals[face],
        mulScalar(this.faceNormal, dotAxisTimes1000)
      );
      normalize(inPlaneNormal);

      // Compute dot product and extract angle
      const dotBackTimes1000 = dotTimes1000(this.backVector, inPlaneNormal);
      const dotBack8 = (dotBackTimes1000 * 1275 + 1275000) / 10000;
      let angleToBack8 = acos8(dotBack8);

      // Oops, we need full range so check cross product with axis to swap the sign as needed
      if (
        dotTimes1000(
          cross(this.backVector, this.normals[face]),
          this.faceNormal
        ) < 0
      ) {
        // Negate the angle
        angleToBack8 = 255 - angleToBack8;
      }

      // Remap to proper range
      const angleToBackTimes1000 = ((angleToBack8 - 128) * 1000) / 128;
      const angleGradientNormalized = (angleToBackTimes1000 + 1000) / 2;

      // Angle is animated and wrapped around
      const angleGradientTime =
        (angleGradientNormalized + angleScrollTime) % 1000;

      // Compute color along angle
      const angleColor = angleGradient.evaluateColor(
        angleGradientTime,
        this.bits,
        this.die
      );

      // Compute color over time
      let gradientColor = 0;
      switch (preset.mainGradientColorType) {
        case NormalsColorOverrideTypeValues.faceToGradient:
          {
            // use the current face (set at start()) + variance
            const gradientParam =
              this.baseColorParam +
              (angleToAxisNormalized * preset.mainGradientColorVar) / 1000;
            gradientColor = gradient.evaluateColor(
              gradientParam,
              this.bits,
              this.die
            );
          }
          break;
        case NormalsColorOverrideTypeValues.faceToRainbowWheel:
          {
            // use the current face (set at start()) + variance
            const rainbowParam =
              (this.baseColorParam +
                (angleToAxisNormalized * preset.mainGradientColorVar * 256) /
                  1000000) %
              256;
            gradientColor = Color32Utils.rainbowWheel(rainbowParam);
          }
          break;
        case NormalsColorOverrideTypeValues.none:
        default:
          gradientColor = gradient.evaluateColor(
            gradientTime,
            this.bits,
            this.die
          );
          break;
      }

      retIndices[i] = i;
      retColors32[i] = Color32Utils.modulateColor(
        Color32Utils.mulColors(
          gradientColor,
          Color32Utils.mulColors(axisColor, angleColor)
        ),
        intensity
      );
    }
    return ledCount;
  }

  stop(retIndices: number[]): number {
    return this.setIndices(AnimConstants.faceMaskAll, retIndices);
  }
}
