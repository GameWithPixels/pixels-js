import {
  getBlue,
  getGreen,
  getRed,
  toColor32 as convertToColor32,
} from "./color32Utils";
import { IColor, colorToString, colorComponentToByte } from "./colorUtils";

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
  constructor(color24: number);
  constructor(hexColor: string);
  constructor(rOrHexColor?: number | string, g?: number, b?: number) {
    if (rOrHexColor !== undefined) {
      if (typeof rOrHexColor === "string") {
        this.setWithHex(rOrHexColor);
      } else if (g === undefined) {
        this.setWithValue(rOrHexColor);
      } else {
        this.set(rOrHexColor, g, b ?? 0);
      }
    }
  }

  equals(other: Color): boolean {
    return this.r === other.r && this.g === other.g && this.b === other.b;
  }

  duplicate(): Color {
    return new Color(this.r, this.g, this.b);
  }

  desaturate(): number {
    return (
      (Math.min(this.r, Math.min(this.g, this.b)) +
        Math.max(this.r, Math.max(this.g, this.b))) *
      0.5
    );
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

  // Black is LED off
  static black = new Color(0, 0, 0);

  // Bright colors
  static brightRed = new Color(1, 0, 0);
  static brightGreen = new Color(0, 1, 0);
  static brightBlue = new Color(0, 0, 1);
  static brightWhite = new Color(1, 1, 1);
  static brightCyan = new Color(0, 1, 1);
  static brightMagenta = new Color(1, 0, 1);
  static brightYellow = new Color(1, 0.922, 0.016);
  static brightOrange = new Color(1, 0.647, 0);

  // Moderately bright colors
  static red = new Color(0.7, 0, 0);
  static green = new Color(0, 0.7, 0);
  static blue = new Color(0, 0, 0.7);
  static white = new Color(0.7, 0.7, 0.7);
  static cyan = new Color(0, 0.7, 0.7);
  static magenta = new Color(0.7, 0, 0.7);
  static yellow = new Color(0.7, 0.6, 0.01);
  static orange = new Color(0.7, 0.453, 0);

  // Dimmed colors
  static dimRed = new Color(0.35, 0, 0);
  static dimGreen = new Color(0, 0.35, 0);
  static dimBlue = new Color(0, 0, 0.35);
  static dimWhite = new Color(0.35, 0.35, 0.35);
  static dimCyan = new Color(0, 0.35, 0.35);
  static dimMagenta = new Color(0.35, 0, 0.35);
  static dimYellow = new Color(0.35, 0.3, 0.005);
  static dimOrange = new Color(0.35, 0.226, 0);
}
