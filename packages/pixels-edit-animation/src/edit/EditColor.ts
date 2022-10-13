import { Constants, Color, gamma } from "@systemic-games/pixels-core-animation";
import { ColorType, ColorTypeValues } from "./ColorType";
import Editable from "./Editable";

export default class EditColor extends Editable {
  type: ColorType;
  color: Color; // Used when type is ColorType.RGB

  constructor(type: ColorType = ColorTypeValues.Rgb, color = Color.black) {
    super();
    this.type = type;
    this.color = color;
  }

  static fromColor(color: Color): EditColor {
    return new EditColor(ColorTypeValues.Rgb, color);
  }

  toColorIndex(refPalette: Color[]): number {
    switch (this.type) {
      case ColorTypeValues.Rgb:
        return EditColor.toColorIndex(refPalette, this.color);
      case ColorTypeValues.Face:
        return Constants.paletteColorFromFace;
      case ColorTypeValues.Random:
        return Constants.paletteColorFromRandom;
      default:
        throw new Error(`Unsupported EditColor type: ${this.type}`);
    }
  }

  static toColorIndex(refPalette: Color[], color: Color): number {
    const colorGamma = gamma(color);
    let colorIndex = refPalette.findIndex((c) => colorGamma.equals(c));
    if (colorIndex === -1) {
      colorIndex = refPalette.length;
      refPalette.push(colorGamma);
    }
    return colorIndex;
  }

  duplicate(): EditColor {
    return new EditColor(this.type, this.color.duplicate());
  }
}
