import { IColor, colorToString, colorComponentToByte } from "./colorUtils";

/**
 * Represents an RGB color using values between O and 1
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

  constructor(r: number, g: number, b: number) {
    this.r = r;
    this.g = g;
    this.b = b;
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

  static fromBytes(rByte: number, gByte: number, bByte: number): Color {
    return new Color(rByte / 255, gByte / 255, bByte / 255);
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
