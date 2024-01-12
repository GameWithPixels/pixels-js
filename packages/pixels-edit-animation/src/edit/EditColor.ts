import {
  Constants,
  Color,
  GammaUtils,
} from "@systemic-games/pixels-core-animation";
import { assertNever } from "@systemic-games/pixels-core-utils";

import { ColorMode } from "./ColorMode";
import { observable } from "./decorators";

export default class EditColor {
  @observable
  mode: ColorMode;

  @observable
  color: Color; // Used when type is "rgb"

  constructor(colorOrMode: Color | Exclude<ColorMode, "rgb"> = Color.black) {
    if (typeof colorOrMode === "string") {
      this.mode = colorOrMode;
      this.color = new Color();
    } else {
      this.mode = "rgb";
      this.color = colorOrMode.duplicate();
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
    if (colorIndex < 0) {
      colorIndex = refPalette.length;
      refPalette.push(colorGamma);
    }
    return colorIndex;
  }

  duplicate(): EditColor {
    return this.mode === "rgb"
      ? new EditColor(this.color)
      : new EditColor(this.mode);
  }
}
