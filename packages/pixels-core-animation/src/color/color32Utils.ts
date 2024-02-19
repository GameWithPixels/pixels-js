/// <summary>
/// Helper static class that implements various color operations with the color information
/// being stored as an unsigned 32 bits value.
/// In related methods, the intensity is a byte value between 0 (black) and 255 (white).
/// </summary>

import Color from "./Color";

/// <summary>
/// Converts a (red, green, blue) bytes triplets to a 32 bits color value.
/// </summary>
/// <param name="red">The red component as a byte value.</param>
/// <param name="green">The green component as a byte value.</param>
/// <param name="blue">The blue component as a byte value.</param>
/// <returns>A 32 bits color value.</returns>

/**
 * @category Color32
 */
export function toColor32(
  redOrColor: number | Color,
  green = 0,
  blue = 0
): number {
  if (typeof redOrColor !== "number") {
    green = redOrColor.g * 255;
    blue = redOrColor.b * 255;
    redOrColor = redOrColor.r * 255;
  }
  return (redOrColor << 16) | (green << 8) | (blue & 0xff);
}

/// <summary>
/// Extracts the red component of a 32 bits color value.
/// </summary>
/// <param name="color32">The 32 bits color value.</param>
/// <returns>The red component of the color.</returns>

/**
 * @category Color32
 */
export function getRed(color32: number): number {
  return (color32 >> 16) & 0xff;
}

/// <summary>
/// Extracts the green component of a 32 bits color value.
/// </summary>
/// <param name="color32">The 32 bits color value.</param>
/// <returns>The green component of the color.</returns>

/**
 * @category Color32
 */
export function getGreen(color32: number): number {
  return (color32 >> 8) & 0xff;
}

/// <summary>
/// Extracts the blue component of a 32 bits color value.
/// </summary>
/// <param name="color32">The 32 bits color value.</param>
/// <returns>The blue component of the color.</returns>

/**
 * @category Color32
 */
export function getBlue(color32: number): number {
  return color32 & 0xff;
}

export function mulColors(a: number, b: number): number {
  const red = (getRed(a) * getRed(b)) / 255;
  const green = (getGreen(a) * getGreen(b)) / 255;
  const blue = (getBlue(a) * getBlue(b)) / 255;
  return toColor32(red, green, blue);
}

/// <summary>
/// Combines the two colors by selecting the highest value for each component.
/// </summary>
/// <param name="color32">The first color to combine.</param>
/// <param name="otherColor32">The second color to combine.</param>
/// <returns></returns>

/**
 * @category Color32
 */
export function combineColors(color32: number, secondColor32: number): number {
  const red = Math.max(getRed(color32), getRed(secondColor32));
  const green = Math.max(getGreen(color32), getGreen(secondColor32));
  const blue = Math.max(getBlue(color32), getBlue(secondColor32));
  return toColor32(red, green, blue);
}

/// <summary>
/// Interpolates linearly between two colors each given for a specific timestamp.
/// </summary>
/// <param name="color32">The first color.</param>
/// <param name="timestamp">The timestamp for the first color.</param>
/// <param name="secondColor32">The second color.</param>
/// <param name="secondTimestamp">The timestamp for the second color.</param>
/// <param name="time">The time for which to calculate the color.</param>
/// <returns>The color for the given time.</returns>

/**
 * @category Color32
 */
export function interpolateColors(
  color32: number,
  timestamp: number,
  secondColor32: number,
  secondTimestamp: number,
  time: number
): number {
  // To stick to integer math, we'll scale the values
  const scaler = 1024;
  const scaledPercent =
    ((time - timestamp) * scaler) / (secondTimestamp - timestamp);
  const scaledRed =
    getRed(color32) * (scaler - scaledPercent) +
    getRed(secondColor32) * scaledPercent;
  const scaledGreen =
    getGreen(color32) * (scaler - scaledPercent) +
    getGreen(secondColor32) * scaledPercent;
  const scaledBlue =
    getBlue(color32) * (scaler - scaledPercent) +
    getBlue(secondColor32) * scaledPercent;
  return toColor32(
    scaledRed / scaler,
    scaledGreen / scaler,
    scaledBlue / scaler
  );
}

/// <summary>
/// Interpolates linearly the two intensities each given for a specific timestamp.
/// </summary>
/// <param name="intensity1">The first intensity value.</param>
/// <param name="timestamp1">The timestamp for the first intensity.</param>
/// <param name="intensity2">The second intensity value.</param>
/// <param name="timestamp2">The timestamp for the second intensity.</param>
/// <param name="time">The time for which to calculate the intensity.</param>
/// <returns>The intensity for the given time.</returns>

/**
 * @category Color32
 */
export function interpolateIntensity(
  intensity1: number,
  timestamp1: number,
  intensity2: number,
  timestamp2: number,
  time: number
): number {
  const scaler = 1024;
  const scaledPercent =
    ((time - timestamp1) * scaler) / (timestamp2 - timestamp1);
  return Math.floor(
    (intensity1 * (scaler - scaledPercent) + intensity2 * scaledPercent) /
      scaler
  );
}

/// <summary>
/// Modulates the color with the given intensity. The later is a value
/// between 0 (black) and (white).
/// </summary>
/// <param name="color">The color to modulate.</param>
/// <param name="intensity">The intensity to apply.</param>
/// <returns></returns>

/**
 * @category Color32
 */
export function modulateColor(color32: number, intensity: number): number {
  const red = (getRed(color32) * intensity) / 255;
  const green = (getGreen(color32) * intensity) / 255;
  const blue = (getBlue(color32) * intensity) / 255;
  return toColor32(red, green, blue);
}

/// <summary>
/// Returns a color along the following looped color blending:
/// [position = 0] red -> green -> blue -> red [position = 255].
/// </summary>
/// <param name="position">Position on the rainbow wheel.</param>
/// <param name="intensity">Intensity of the returned color.</param>
/// <returns>A color.</returns>

/**
 * @category Color32
 */
export function rainbowWheel(position: number, intensity = 255): number {
  if (position < 85) {
    return toColor32(
      (position * 3 * intensity) / 255,
      ((255 - position * 3) * intensity) / 255,
      0
    );
  } else if (position < 170) {
    position -= 85;
    return toColor32(
      ((255 - position * 3) * intensity) / 255,
      0,
      (position * 3 * intensity) / 255
    );
  } else {
    position -= 170;
    return toColor32(
      0,
      (position * 3 * intensity) / 255,
      ((255 - position * 3) * intensity) / 255
    );
  }
}

export function faceWheel(face: number, count: number): number {
  return rainbowWheel((face * 256) / count);
}
