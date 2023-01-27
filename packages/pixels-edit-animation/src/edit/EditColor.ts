import {
  Constants,
  Color,
  GammaUtils,
} from "@systemic-games/pixels-core-animation";
import { assertNever } from "@systemic-games/pixels-core-utils";

import { ColorModeNames } from "./ColorMode";
import Editable from "./Editable";

export default class EditColor extends Editable {
  mode: ColorModeNames;
  color: Color; // Used when type is ColorType.RGB

  constructor(
    colorOrMode: Color | Exclude<ColorModeNames, "rgb"> = Color.black
  ) {
    super();
    if (colorOrMode instanceof Color) {
      this.mode = "rgb";
      this.color = colorOrMode;
    } else {
      this.mode = colorOrMode;
      this.color = Color.black;
    }
  }

  toColorIndex(refPalette: Color[]): number {
    switch (this.mode) {
      case "rgb":
        return EditColor.toColorIndex(refPalette, this.color);
      case "face":
        return Constants.paletteColorFromFace;
      case "random":
        return Constants.paletteColorFromRandom;
      default:
        assertNever(this.mode, `Unsupported EditColor type: ${this.mode}`);
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
    return this.mode === "rgb"
      ? new EditColor(this.color.duplicate())
      : new EditColor(this.mode);
  }
}
