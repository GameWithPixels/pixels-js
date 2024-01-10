import { assertNever } from "@systemic-games/pixels-core-utils";
import { Serializable } from "@systemic-games/react-native-pixels-connect";

import * as Flashes from "./flashesSlice";
import * as GradientPattern from "./gradientPatternSlice";
import * as Gradient from "./gradientSlice";
import * as Noise from "./noiseSlice";
import * as Pattern from "./patternSlice";
import * as Rainbow from "./rainbowSlice";

export { Flashes, Rainbow, Pattern, GradientPattern, Gradient, Noise };

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
    default:
      assertNever(type, `Unsupported animation type ${type}`);
  }
}
