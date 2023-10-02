import { PixelColorway } from "@systemic-games/react-native-pixels-connect";
import { Image } from "react-native";

export function ColorwayImage({ colorway }: { colorway: PixelColorway }) {
  switch (colorway) {
    default:
      return <Image source={require("!images/colorways/unknown.png")} />;
    case "onyxBlack":
      return <Image source={require("!images/colorways/onyxBlack.png")} />;
    case "hematiteGrey":
      return <Image source={require("!images/colorways/hematiteGrey.png")} />;
    case "midnightGalaxy":
      return <Image source={require("!images/colorways/midnightGalaxy.png")} />;
    case "auroraSky":
      return <Image source={require("!images/colorways/auroraSky.png")} />;
    case "auroraClear":
      return <Image source={require("!images/colorways/auroraClear.png")} />;
  }
}
