import { Color, ColorUtils } from "@systemic-games/pixels-core-animation";

import { EditRgbKeyframe } from "./edit";

const KeyframeTimeResolutionMs = 2;

export function extractKeyframes(
  pixels: Color[],
  maxInterpolationError = Math.sqrt(0.2)
): EditRgbKeyframe[] {
  const ret: EditRgbKeyframe[] = [];

  const computeInterpolationError = (
    firstIndex: number,
    lastIndex: number
  ): number => {
    const startColor = pixels[firstIndex];
    const endColor = pixels[lastIndex];
    let sumError = 0;
    for (let i = firstIndex; i <= lastIndex; ++i) {
      const pct = (i - firstIndex) / (lastIndex - firstIndex);
      sumError += ColorUtils.sqrDistance(
        pixels[i],
        ColorUtils.lerp(startColor, endColor, pct)
      );
    }
    return sumError;
  };

  const computePixelTime = (pixelIndex: number): number => {
    // KeyframeTimeResolutionMs is the smallest time increment in the keyframe data
    return pixelIndex * KeyframeTimeResolutionMs * 0.001;
  };

  // Always add the first color
  ret.push(
    new EditRgbKeyframe({
      time: 0,
      color: pixels[0],
    })
  );

  const sqrEpsilon = maxInterpolationError * maxInterpolationError;
  let first = 0;
  let last = 1;
  while (last < pixels.length) {
    // Move forward until we accumulate too much interpolation error
    while (
      last < pixels.length &&
      computeInterpolationError(first, last) < sqrEpsilon
    ) {
      ++last;
    }

    // Backtrack to previous pixel to stay within error bounds
    if (last > first + 1) {
      --last;
    }

    // Add a keyframe
    ret.push(
      new EditRgbKeyframe({
        time: computePixelTime(last),
        color: pixels[last],
      })
    );

    // Next segment
    first = last;
    ++last;
  }

  return ret;
}
