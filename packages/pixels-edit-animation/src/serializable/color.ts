import { Color, ColorUtils } from "@systemic-games/pixels-core-animation";
import { assertNever } from "@systemic-games/pixels-core-utils";

import { EditColor } from "../edit";

export function toColor(data: string): EditColor {
  if (data === "face" || data === "random") {
    return new EditColor(data);
  } else {
    return new EditColor(new Color(data));
  }
}

export function fromColor(color: EditColor): string {
  const mode = color.mode;
  switch (mode) {
    case "rgb":
      return ColorUtils.colorToString(color.color ?? Color.black).toString();
    case "face":
    case "random":
      return mode;
    default:
      assertNever(mode, `Unsupported color mode: ${mode}`);
  }
}
