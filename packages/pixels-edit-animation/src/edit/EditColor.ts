import {
  AnimConstants,
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
  color?: Color; // Used when type is "rgb"

  constructor(colorOrMode?: Color | Exclude<ColorMode, "rgb">) {
    if (typeof colorOrMode === "string") {
      this.mode = colorOrMode;
    } else {
      this.mode = "rgb";
      this.color = colorOrMode ?? Color.black.duplicate();
    }
  }

  toColorIndex(refPalette: Readonly<Color>[]): number {
    switch (this.mode) {
      case "rgb":
        return EditColor.toColorIndex(refPalette, this.color ?? Color.black);
      case "face":
        return AnimConstants.paletteColorFromFace;
      case "random":
        return AnimConstants.paletteColorFromRandom;
      default:
        assertNever(this.mode, `Unsupported EditColor type: ${this.mode}`);
    }
  }

  static toColorIndex(
    refPalette: Readonly<Color>[],
    color: Readonly<Color>
  ): number {
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
