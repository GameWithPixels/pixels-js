import {
  Constants,
  Color,
  GammaUtils,
} from "@systemic-games/pixels-core-animation";
import { assertNever } from "@systemic-games/pixels-core-utils";

import { ColorTypeNames } from "./ColorType";
import Editable from "./Editable";

export default class EditColor extends Editable {
  type: ColorTypeNames;
  color: Color; // Used when type is ColorType.RGB

  constructor(
    colorOrType: Color | Exclude<ColorTypeNames, "rgb"> = Color.black
  ) {
    super();
    if (colorOrType instanceof Color) {
      this.type = "rgb";
      this.color = colorOrType;
    } else {
      this.type = colorOrType;
      this.color = Color.black;
    }
  }

  toColorIndex(refPalette: Color[]): number {
    switch (this.type) {
      case "rgb":
        return EditColor.toColorIndex(refPalette, this.color);
      case "face":
        return Constants.paletteColorFromFace;
      case "random":
        return Constants.paletteColorFromRandom;
      default:
        assertNever(this.type, `Unsupported EditColor type: ${this.type}`);
    }
  }

  static toColorIndex(refPalette: Color[], color: Color): number {
    const colorGamma = GammaUtils.gamma(color);
    let colorIndex = refPalette.findIndex((c) => colorGamma.equals(c));
    if (colorIndex === -1) {
      colorIndex = refPalette.length;
      refPalette.push(colorGamma);
    }
    return colorIndex;
  }

  duplicate(): EditColor {
    return this.type === "rgb"
      ? new EditColor(this.color.duplicate())
      : new EditColor(this.type);
  }
}
