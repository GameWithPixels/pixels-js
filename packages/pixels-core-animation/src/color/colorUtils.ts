/**
 * @category Color
 */
export interface IColor {
  r: number; // Normalized floating point value
  g: number; // Normalized floating point value
  b: number; // Normalized floating point value
}

/**
 * @category Color
 */
export interface IColorHsv {
  h: number; // Normalized floating point value
  s: number; // Normalized floating point value
  v: number; // Normalized floating point value
}

/**
 * @category Color
 */
export function hsvToRgb({ h, s, v }: IColorHsv): IColor {
  // Adapted from https://gist.github.com/mjackson/5311256
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0:
      return { r: v, g: t, b: p };
    case 1:
      return { r: q, g: v, b: p };
    case 2:
      return { r: p, g: v, b: t };
    case 3:
      return { r: p, g: q, b: v };
    case 4:
      return { r: t, g: p, b: v };
    case 5:
      return { r: v, g: p, b: q };
    default:
      return { r: 0, g: 0, b: 0 };
  }
}

/**
 * @category Color
 */
export function rgbToHsv({ r, g, b }: IColor): IColorHsv {
  // Adapted from https://gist.github.com/mjackson/5311256
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) {
    // achromatic
    return { h: 0, s: 0, v: 0 };
  } else {
    let h = 0;
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    return { h: h / 6, s: d / max, v: max };
  }
}

function colorByteToHex(byte: number): string {
  return byte.toString(16).padStart(2, "0");
}

/**
 * @category Color
 */
export function colorBytesToString(
  rByte: number,
  gByte: number,
  bByte: number
): string {
  return (
    "#" + colorByteToHex(rByte) + colorByteToHex(gByte) + colorByteToHex(bByte)
  );
}

/**
 * @category Color
 */
export function colorComponentToByte(c: number): number {
  return Math.round(255 * Math.min(1, Math.max(0, c)));
}

/**
 * @category Color
 */
export function colorToString({ r, g, b }: Readonly<IColor>): string {
  return colorBytesToString(
    colorComponentToByte(r),
    colorComponentToByte(g),
    colorComponentToByte(b)
  );
}

export function desaturate(color: IColor): number {
  return (
    (Math.min(color.r, Math.min(color.g, color.b)) +
      Math.max(color.r, Math.max(color.g, color.b))) *
    0.5
  );
}

export function sqrDistance(color1: IColor, color2: IColor): number {
  const dr = color1.r - color2.r;
  const dg = color1.g - color2.g;
  const db = color1.b - color2.b;
  return dr * dr + dg * dg + db * db;
}

export function lerp(color1: IColor, color2: IColor, t: number): IColor {
  t = Math.min(1, Math.max(0, t));
  return {
    r: color1.r + (color2.r - color1.r) * t,
    g: color1.g + (color2.g - color1.g) * t,
    b: color1.b + (color2.b - color1.b) * t,
  };
}
