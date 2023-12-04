import {
  PixelDieTypeValues,
  PixelDieType,
} from "@systemic-games/react-native-pixels-connect";

export const dieTypes = (
  Object.keys(PixelDieTypeValues) as PixelDieType[]
).filter((dt) => dt !== "unknown" && dt !== "d6pipped" && dt !== "d6fudge");
