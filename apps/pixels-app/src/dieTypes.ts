import {
  PixelDieTypeValues,
  PixelDieType,
} from "@systemic-games/react-native-pixels-connect";

export const dieTypes = (
  Object.keys(PixelDieTypeValues) as PixelDieType[]
).filter((dt) => dt !== "unknown" && dt !== "d6fudge");

export const sortedDieTypes = [
  "d20",
  "d10",
  "d00",
  "d12",
  "d8",
  "d6pipped",
  "d6",
  "d4",
] as PixelDieType[];
