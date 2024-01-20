import {
  getBlue,
  getGreen,
  getRed,
  toColor32 as convertToColor32,
} from "./color32Utils";
import {
  IColor,
  colorToString,
  colorComponentToByte,
  desaturate,
  lerp,
} from "./colorUtils";

/**
 * Represents an RGB color using values ranging from O and 1
 * for each color component.
 * @category Color
 */
export default class Color implements IColor {
  r = 0; // Normalized floating point value
  g = 0; // Normalized floating point value
  b = 0; // Normalized floating point value

  get rByte(): number {
    return colorComponentToByte(this.r);
  }

  get gByte(): number {
    return colorComponentToByte(this.g);
  }

  get bByte(): number {
    return colorComponentToByte(this.b);
  }

  /**
   * Create a new instance from either:
   * - a (R, G, B) triplet (values ranging from 0 to 1)
   * - a 24 bit color value
   * - an hexadecimal color string (web style)
   */
  constructor();
  constructor(r: number, g: number, b: number);
  constructor(color: IColor);
  constructor(color24: number);
  constructor(hexColor: string);
  constructor(rOrHexColor?: number | IColor | string, g?: number, b?: number) {
    if (rOrHexColor !== undefined) {
      if (typeof rOrHexColor === "string") {
        this.setWithHex(rOrHexColor);
      } else if (typeof rOrHexColor === "object") {
        this.set(rOrHexColor.r, rOrHexColor.g, rOrHexColor.b);
      } else if (g === undefined) {
        this.setWithValue(rOrHexColor);
      } else {
        this.set(rOrHexColor, g, b ?? 0);
      }
    }
  }

  equals(other: IColor): boolean {
    return this.r === other.r && this.g === other.g && this.b === other.b;
  }

  assign(other: IColor): Color {
    this.r = other.r;
    this.g = other.g;
    this.b = other.b;
    return this;
  }

  duplicate(): Color {
    return new Color(this.r, this.g, this.b);
  }

  desaturate(): number {
    return desaturate(this);
  }

  serialize(dataView: DataView, byteOffset = 0): [DataView, number] {
    dataView.setUint8(byteOffset++, this.rByte);
    dataView.setUint8(byteOffset++, this.gByte);
    dataView.setUint8(byteOffset++, this.bByte);
    return [dataView, byteOffset];
  }

  toString(): string {
    return colorToString(this);
  }

  toColor32(): number {
    return convertToColor32(this);
  }

  set(r: number, g: number, b: number): Color {
    this.r = r;
    this.g = g;
    this.b = b;
    return this;
  }

  setWithBytes(rByte: number, gByte: number, bByte: number): Color {
    this.r = rByte / 255;
    this.g = gByte / 255;
    this.b = bByte / 255;
    return this;
  }

  setWithValue(color24: number): Color {
    this.setWithBytes(getRed(color24), getGreen(color24), getBlue(color24));
    return this;
  }

  setWithHex(hexColor: string): Color {
    if (hexColor.length) {
      const i = hexColor[0] === "#" ? 1 : 0;
      if (hexColor.length === 3 + i) {
        this.set(
          parseInt(hexColor[i], 16) / 255,
          parseInt(hexColor[i + 1], 16) / 255,
          parseInt(hexColor[i + 2], 16) / 255
        );
      } else if (hexColor.length === 6 + i) {
        this.setWithValue(parseInt(i ? hexColor.slice(i) : hexColor, 16));
      } else {
        throw new Error(`Invalid hexadecimal color: ${hexColor}`);
      }
    }
    return this;
  }

  static fromBytes(rByte: number, gByte: number, bByte: number): Color {
    return new Color().setWithBytes(rByte, gByte, bByte);
  }

  static fromString(hexColor: string): Color {
    return new Color().setWithHex(hexColor);
  }

  static lerp(color1: Color, color2: Color, t: number): Color {
    return new Color(lerp(color1, color2, t));
  }

  // Black is LED off
  static readonly black = Object.freeze(new Color(0, 0, 0));

  // Bright colors
  static readonly brightRed = Object.freeze(new Color(1, 0, 0));
  static readonly brightGreen = Object.freeze(new Color(0, 1, 0));
  static readonly brightBlue = Object.freeze(new Color(0, 0, 1));
  static readonly brightWhite = Object.freeze(new Color(1, 1, 1));
  static readonly brightCyan = Object.freeze(new Color(0, 1, 1));
  static readonly brightMagenta = Object.freeze(new Color(1, 0, 1));
  static readonly brightYellow = Object.freeze(new Color(1, 1, 0));
  static readonly brightOrange = Object.freeze(new Color(1, 0.647, 0));
  static readonly brightPurple = Object.freeze(new Color(0.5, 0, 1));
  static readonly red = Object.freeze(new Color(0.7, 0, 0));
  static readonly green = Object.freeze(new Color(0, 0.7, 0));
  static readonly blue = Object.freeze(new Color(0, 0, 0.7));
  static readonly white = Object.freeze(new Color(0.7, 0.7, 0.7));
  static readonly cyan = Object.freeze(new Color(0, 0.7, 0.7));
  static readonly magenta = Object.freeze(new Color(0.7, 0, 0.7));
  static readonly yellow = Object.freeze(new Color(0.7, 0.6, 0.01));
  static readonly orange = Object.freeze(new Color(0.7, 0.453, 0));

  static readonly mediumWhite = Object.freeze(new Color(0.5, 0.5, 0.5));
  static readonly faintWhite = Object.freeze(new Color(0.1, 0.1, 0.1));

  // Dimmed colors
  static readonly dimRed = Object.freeze(new Color(0.35, 0, 0));
  static readonly dimGreen = Object.freeze(new Color(0, 0.35, 0));
  static readonly dimBlue = Object.freeze(new Color(0, 0, 0.35));
  static readonly dimWhite = Object.freeze(new Color(0.35, 0.35, 0.35));
  static readonly dimCyan = Object.freeze(new Color(0, 0.35, 0.35));
  static readonly dimMagenta = Object.freeze(new Color(0.35, 0, 0.35));
  static readonly dimYellow = Object.freeze(new Color(0.35, 0.3, 0.005));
  static readonly dimOrange = Object.freeze(new Color(0.35, 0.226, 0));
}
