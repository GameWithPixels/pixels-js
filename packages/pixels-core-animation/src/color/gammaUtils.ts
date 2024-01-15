/// <summary>
/// Helper static class that implements various gamma operations on colors.
/// </summary>
import Color from "./Color";
import * as Color32Utils from "./color32Utils";

function toByte(n: number) {
  return n < 0 ? 0 : n > 255 ? 255 : Math.floor(n);
}

/// <summary>
/// Returns the gamma of the given intensity.
/// </summary>
/// <param name="intensity"></param>
/// <returns>The gamma value.</returns>

/**
 * @category Color Gamma
 */
export function gamma8(intensity: number): number {
  return _gammaTable[toByte(intensity)]; // 0-255 in, 0-255 out
}

/// <summary>
/// Returns the gamma transformation of the given color.
/// </summary>
/// <param name="color32">The color to transform.</param>
/// <returns>The gamma transformed color.</returns>

/**
 * @category Color Gamma
 */
export function gamma32(color32: number): number {
  const r = gamma8(Color32Utils.getRed(color32));
  const g = gamma8(Color32Utils.getGreen(color32));
  const b = gamma8(Color32Utils.getBlue(color32));
  return Color32Utils.toColor32(r, g, b);
}

/// <summary>
/// Returns the gamma transformation of the given color.
/// </summary>
/// <param name="color">The color to transform.</param>
/// <returns>The gamma transformed color.</returns>

/**
 * @category Color Gamma
 */
export function gamma(color: Readonly<Color>): Color {
  const r = gamma8(color.rByte);
  const g = gamma8(color.gByte);
  const b = gamma8(color.bByte);
  return Color.fromBytes(r, g, b);
}

/// <summary>
/// Returns the intensity corresponding to the given gamma value.
/// </summary>
/// <param name="gamma">A gamma value.</param>
/// <returns>The intensity for the gamma value.</returns>

/**
 * @category Color Gamma
 */
export function reverseGamma8(gamma: number): number {
  return _reverseGammaTable[toByte(gamma)]; // 0-255 in, 0-255 out
}

/// <summary>
/// Returns the reverse gamma transformation of the given color.
/// </summary>
/// <param name="color">The color to transform.</param>
/// <returns>The reverse gamma transformed color.</returns>

/**
 * @category Color Gamma
 */
export function reverseGamma(color: Readonly<Color>): Color {
  const r = reverseGamma8(color.rByte);
  const g = reverseGamma8(color.gByte);
  const b = reverseGamma8(color.bByte);
  return Color.fromBytes(r, g, b);
}

const _gammaTable = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2,
  2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 6, 7, 7,
  7, 8, 8, 8, 8, 9, 9, 9, 10, 10, 10, 11, 11, 12, 12, 12, 13, 13, 14, 14, 14,
  15, 15, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 22, 22, 23, 23, 24, 25,
  25, 26, 27, 27, 28, 29, 29, 30, 31, 32, 32, 33, 34, 35, 35, 36, 37, 38, 39,
  40, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57,
  58, 60, 61, 62, 63, 64, 65, 67, 68, 69, 70, 72, 73, 74, 76, 77, 78, 80, 81,
  82, 84, 85, 87, 88, 90, 91, 93, 94, 96, 97, 99, 101, 102, 104, 105, 107, 109,
  111, 112, 114, 116, 118, 119, 121, 123, 125, 127, 129, 131, 132, 134, 136,
  138, 140, 142, 144, 147, 149, 151, 153, 155, 157, 159, 162, 164, 166, 168,
  171, 173, 175, 178, 180, 182, 185, 187, 190, 192, 195, 197, 200, 202, 205,
  207, 210, 213, 215, 218, 221, 223, 226, 229, 232, 235, 237, 240, 243, 246,
  249, 252, 255,
];

const _reverseGammaTable = [
  0, 70, 80, 87, 92, 97, 101, 105, 108, 112, 114, 117, 119, 122, 124, 126, 128,
  130, 132, 134, 135, 137, 138, 140, 141, 143, 144, 146, 147, 148, 149, 151,
  152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166,
  167, 168, 169, 170, 170, 171, 172, 173, 174, 174, 175, 176, 177, 177, 178,
  179, 180, 180, 181, 182, 182, 183, 184, 184, 185, 186, 186, 187, 188, 188,
  189, 189, 190, 191, 191, 192, 192, 193, 194, 194, 195, 195, 196, 196, 197,
  197, 198, 198, 199, 200, 200, 201, 201, 202, 202, 203, 203, 204, 204, 204,
  205, 205, 206, 206, 207, 207, 208, 208, 209, 209, 210, 210, 210, 211, 211,
  212, 212, 213, 213, 214, 214, 214, 215, 215, 216, 216, 216, 217, 217, 218,
  218, 218, 219, 219, 220, 220, 220, 221, 221, 222, 222, 222, 223, 223, 223,
  224, 224, 224, 225, 225, 226, 226, 226, 227, 227, 227, 228, 228, 228, 229,
  229, 229, 230, 230, 230, 231, 231, 231, 232, 232, 232, 233, 233, 233, 234,
  234, 234, 235, 235, 235, 236, 236, 236, 237, 237, 237, 237, 238, 238, 238,
  239, 239, 239, 240, 240, 240, 241, 241, 241, 241, 242, 242, 242, 243, 243,
  243, 243, 244, 244, 244, 245, 245, 245, 245, 246, 246, 246, 247, 247, 247,
  247, 248, 248, 248, 248, 249, 249, 249, 249, 250, 250, 250, 251, 251, 251,
  251, 252, 252, 252, 252, 253, 253, 253, 253, 254, 254, 254, 254, 255,
];
