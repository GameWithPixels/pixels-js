import { assertNever } from "@systemic-games/pixels-core-utils";
import { Serializable } from "@systemic-games/react-native-pixels-connect";

import * as Cycle from "./cycleSlice";
import * as Flashes from "./flashesSlice";
import * as GradientPattern from "./gradientPatternSlice";
import * as Gradient from "./gradientSlice";
import * as Noise from "./noiseSlice";
import * as Normals from "./normalsSlice";
import * as Pattern from "./patternSlice";
import * as Rainbow from "./rainbowSlice";
import * as Sequence from "./sequenceSlice";

export {
  Cycle,
  Flashes,
  Rainbow,
  Pattern,
  GradientPattern,
  Gradient,
  Noise,
  Normals,
  Sequence,
};

export function add({
  type,
  data,
}: {
  type: keyof Serializable.AnimationSetData;
  data: Serializable.AnimationData;
}) {
  switch (type) {
    case "flashes":
      return Flashes.add(data as Serializable.AnimationFlashesData);
    case "rainbow":
      return Rainbow.add(data as Serializable.AnimationRainbowData);
    case "pattern":
      return Pattern.add(data as Serializable.AnimationRainbowData);
    case "gradientPattern":
      return GradientPattern.add(
        data as Serializable.AnimationGradientPatternData
      );
    case "gradient":
      return Gradient.add(data as Serializable.AnimationGradientData);
    case "noise":
      return Noise.add(data as Serializable.AnimationNoiseData);
    case "normals":
      return Normals.add(data as Serializable.AnimationNormalsData);
    case "cycle":
      return Cycle.add(data as Serializable.AnimationCycleData);
    case "sequence":
      return Sequence.add(data as Serializable.AnimationSequenceData);
    default:
      assertNever(type, `Unsupported animation type ${type}`);
  }
}
