import { getValueKeyName } from "@systemic-games/pixels-core-utils";
import { Profiles } from "@systemic-games/react-native-pixels-connect";

const mainGradient: readonly string[] = [
  "5f0b1a89-98ec-42b0-a727-4a094dd8bc82", // Waterfall Gradient
  "3ac00114-1867-4b8f-97d5-86783521c48b", // Waterfall Red Green
  "0488c178-ecbb-4929-a633-e5b5ec27e39c", // Red Green Alarm
] as const;
const angleGradient: readonly string[] = [
  "c7a041f3-f9e1-448c-94d3-a7f019ced0c4", // Spinning Rainbow
  "d0e73d74-333e-4634-b30e-e078b376d789", // Spinning Rainbow Aurora
  "c6b97f93-97af-4719-a16d-85d9e9c1b71f", // Water Base Layer
  "befad69b-6b16-4a43-8ffe-243c7e0014d0", // Counter Spinning Magic
  "67d2a675-4331-4c8d-89b4-e2af001e2212", // Spinning Magic
  "b19d3448-2ec6-430f-80a6-22ea02de97b9", // Double Spinning Magic
] as const;
const noGradient: readonly string[] = [
  "ab516f76-fe89-48a6-8b11-35f997d31197", // Waterfall
  "ebfc1dd5-ec82-45ac-a653-db2fbb96e5c1", // Waterfall Top Half
  "e655e6e1-32c3-407b-a154-15ceef54c9f3", // Spinning
  "b28682d0-fffd-4a07-b723-dbb127309c23", // Spiral Up
  "17c75b18-b186-4a4e-ade0-bf94f658d6db", // Spiral Down
  "61785d78-a642-461f-8dc1-1f0fb2dddd29", // Noise
  "5575de5a-2059-48c1-a08a-99ecc19b775c", // Short Noise
  "c30e296b-422a-4713-9bb4-85c2fcee56d8", // Fountain
  "42613ce9-12fb-4973-8e38-cc0765d980f1", // Rainbow Fountain
  "2e0a5f5b-edb9-45e3-9c62-58db4d06d073", // Overlapping Quick Reds
  "b9843f94-0d51-4833-9ddb-c4b3d111b043", // Overlapping Quick Greens
  "41f5a334-16b8-4167-a69f-bbbefccf4e42", // Rose to Current Face
  "5e768705-fbf0-4f20-81b3-035f259d86ed", // Spiral Up and Down Rainbow
] as const;
const noColor: readonly string[] = [
  "12bd0c13-d2c3-4837-87e5-2f7931e42d17", // Alternating White
  "41f5a334-16b8-4167-a69f-bbbefccf4e42", // Rose to Current Face
] as const;

export const AnimationUtils = {
  hasEditableFading(anim?: Readonly<Profiles.Animation>): boolean {
    anim = AnimationUtils.getMainAnimation(anim);
    return AnimationUtils.getFading(anim) !== undefined;
  },

  hasEditableIntensity(anim?: Readonly<Profiles.Animation>): boolean {
    anim = AnimationUtils.getMainAnimation(anim);
    return AnimationUtils.getIntensity(anim) !== undefined;
  },

  hasEditableFaceMask(anim?: Readonly<Profiles.Animation>): boolean {
    anim = AnimationUtils.getMainAnimation(anim);
    return AnimationUtils.getFaceMask(anim) !== undefined;
  },

  hasEditableColor(
    anim?: Readonly<Profiles.Animation>,
    animUuid?: string
  ): boolean {
    if (!noColor.includes(anim?.uuid ?? animUuid ?? "")) {
      anim = AnimationUtils.getMainAnimation(anim);
      return AnimationUtils.getColor(anim, animUuid)?.mode === "rgb";
    } else {
      return false;
    }
  },

  hasEditableGradient(
    anim?: Readonly<Profiles.Animation>,
    animUuid?: string
  ): boolean {
    const keyframes = AnimationUtils.getGradientKeyframes(anim, animUuid);
    return !!keyframes && keyframes.length > 1;
  },

  getFading(anim?: Readonly<Profiles.Animation>): number | undefined {
    anim = AnimationUtils.getMainAnimation(anim);
    return anim && "fade" in anim && typeof anim.fade === "number"
      ? anim.fade
      : undefined;
  },

  getIntensity(anim?: Readonly<Profiles.Animation>): number | undefined {
    anim = AnimationUtils.getMainAnimation(anim);
    return anim && "intensity" in anim && typeof anim.intensity === "number"
      ? anim.intensity
      : undefined;
  },

  getFaceMask(anim?: Readonly<Profiles.Animation>): number | undefined {
    anim = AnimationUtils.getMainAnimation(anim);
    return anim && "faceMask" in anim && typeof anim.faceMask === "number"
      ? anim.faceMask
      : undefined;
  },

  getColor(
    anim?: Readonly<Profiles.Animation>,
    animUuid?: string
  ): Readonly<Profiles.FaceColor> | undefined {
    if (!noColor.includes(anim?.uuid ?? animUuid ?? "")) {
      anim = AnimationUtils.getMainAnimation(anim);
      return anim && "color" in anim && anim.color instanceof Profiles.FaceColor
        ? anim.color
        : undefined;
    }
  },

  getGradientKeyframes(
    anim?: Readonly<Profiles.Animation>,
    animUuid?: string
  ): readonly Readonly<Profiles.RgbKeyframe>[] | undefined {
    if (!noGradient.includes(animUuid ?? anim?.uuid ?? "")) {
      anim = AnimationUtils.getMainAnimation(anim);
      return AnimationUtils.getEditableGradient(anim, animUuid)?.keyframes;
    }
  },

  getGradientColorType(
    anim?: Readonly<Profiles.Animation>
  ):
    | Profiles.NormalsColorOverrideType
    | Profiles.NoiseColorOverrideType
    | undefined {
    // Do not call getMainAnimation()
    const gct1 =
      anim instanceof Profiles.AnimationNormals
        ? anim.gradientColorType
        : undefined;
    const gct2 =
      anim instanceof Profiles.AnimationNoise
        ? anim.gradientColorType
        : undefined;
    return gct1
      ? (getValueKeyName(gct1, Profiles.NormalsColorOverrideTypeValues) ??
          "none")
      : gct2
        ? (getValueKeyName(gct2, Profiles.NoiseColorOverrideTypeValues) ??
          "none")
        : undefined;
  },

  getEditableGradient(
    anim?: Readonly<Profiles.Animation>,
    animUuid?: string
  ): Readonly<Profiles.RgbGradient> | undefined {
    animUuid ??= anim?.uuid ?? "";
    if (!noGradient.includes(animUuid)) {
      anim = AnimationUtils.getMainAnimation(anim);
      if (anim instanceof Profiles.AnimationGradient) {
        return anim.gradient;
      } else if (anim instanceof Profiles.AnimationGradientPattern) {
        return anim.gradient;
      } else if (anim instanceof Profiles.AnimationNormals) {
        if (mainGradient.includes(animUuid)) {
          return anim.gradient;
        } else if (angleGradient.includes(animUuid)) {
          return anim.angleGradient;
        } else {
          return anim.axisGradient;
        }
      } else if (anim instanceof Profiles.AnimationCycle) {
        return anim.gradient;
      } else if (anim instanceof Profiles.AnimationNoise) {
        return anim.gradient;
      }
    }
  },

  setEditableFading(anim?: Profiles.Animation, fade?: number): void {
    anim = AnimationUtils.getMainEditableAnimation(anim);
    if (anim && "fade" in anim && typeof anim.fade === "number") {
      anim.fade = fade;
    }
  },

  setEditableIntensity(anim?: Profiles.Animation, intensity?: number): void {
    anim = AnimationUtils.getMainEditableAnimation(anim);
    if (anim && "intensity" in anim && typeof anim.intensity === "number") {
      anim.intensity = intensity;
    }
  },

  setEditableFaceMask(anim?: Profiles.Animation, faceMask?: number): void {
    anim = AnimationUtils.getMainEditableAnimation(anim);
    if (anim && "faceMask" in anim && typeof anim.faceMask === "number") {
      anim.faceMask = faceMask;
    }
  },

  setEditableColor(
    anim?: Profiles.Animation,
    color?: Profiles.FaceColor,
    animUuid?: string
  ): void {
    if (!noColor.includes(anim?.uuid ?? animUuid ?? "")) {
      anim = AnimationUtils.getMainEditableAnimation(anim);
      if (anim && "color" in anim && anim.color instanceof Profiles.FaceColor) {
        anim.color = color;
      }
    }
  },

  setEditableGradient(
    anim?: Profiles.Animation,
    gradient?: Profiles.RgbGradient,
    animUuid?: string
  ): void {
    animUuid ??= anim?.uuid ?? "";
    if (!noGradient.includes(animUuid)) {
      anim = AnimationUtils.getMainEditableAnimation(anim);
      if (anim instanceof Profiles.AnimationGradient) {
        anim.gradient = gradient;
      } else if (anim instanceof Profiles.AnimationGradientPattern) {
        anim.gradient = gradient;
      } else if (anim instanceof Profiles.AnimationNormals) {
        if (mainGradient.includes(animUuid)) {
          anim.gradient = gradient;
        } else if (angleGradient.includes(animUuid)) {
          anim.angleGradient = gradient;
        } else {
          anim.axisGradient = gradient;
        }
      } else if (anim instanceof Profiles.AnimationNoise) {
        anim.gradient = gradient;
      } else if (anim instanceof Profiles.AnimationCycle) {
        anim.gradient = gradient;
      }
    }
  },

  getMainAnimation(
    anim?: Readonly<Profiles.Animation>
  ): Readonly<Profiles.Animation> | undefined {
    return anim instanceof Profiles.AnimationSequence &&
      anim.animations.length > 0
      ? anim.animations[0].animation
      : anim;
  },

  getMainEditableAnimation(
    anim?: Profiles.Animation
  ): Profiles.Animation | undefined {
    return anim instanceof Profiles.AnimationSequence &&
      anim.animations.length > 0
      ? anim.animations[0].animation
      : anim;
  },
};
