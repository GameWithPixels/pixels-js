export interface IColor {
  r: number; // Normalized floating point value
  g: number; // Normalized floating point value
  b: number; // Normalized floating point value
}

export interface IColorHsv {
  h: number; // Normalized floating point value
  s: number; // Normalized floating point value
  v: number; // Normalized floating point value
}

// Adapted from https://gist.github.com/mjackson/5311256
export function hsvToRgb({ h, s, v }: IColorHsv): IColor {
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

// Adapted from https://gist.github.com/mjackson/5311256
export function rgbToHsv({ r, g, b }: IColor): IColorHsv {
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

export function colorComponentToByte(c: number): number {
  return Math.round(255 * Math.min(1, Math.max(0, c)));
}

export function colorComponentToHex(v: number) {
  return ("0" + colorComponentToByte(v).toString(16)).slice(-2);
}

export function colorToString(color: IColor): string {
  return (
    "#" +
    colorComponentToHex(color.r) +
    colorComponentToHex(color.g) +
    colorComponentToHex(color.b)
  );
}
