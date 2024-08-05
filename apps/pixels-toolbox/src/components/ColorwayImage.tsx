import { PixelColorway } from "@systemic-games/react-native-pixels-connect";
import { Image, ImageProps } from "react-native";

export function ColorwayImage({
  colorway,
  ...props
}: { colorway: PixelColorway } & Omit<ImageProps, "source">) {
  let source;
  switch (colorway) {
    case "onyxBlack":
      source = require("!images/colorways/onyxBlack.png");
      break;
    case "hematiteGrey":
      source = require("!images/colorways/hematiteGrey.png");
      break;
    case "midnightGalaxy":
      source = require("!images/colorways/midnightGalaxy.png");
      break;
    case "auroraSky":
      source = require("!images/colorways/auroraSky.png");
      break;
    case "clear":
      source = require("!images/colorways/clear.png");
      break;
    case "whiteAurora":
      source = require("!images/colorways/whiteAurora.png");
      break;
    default:
      source = require("!images/colorways/unknown.png");
  }
  return <Image source={source} {...props} />;
}
