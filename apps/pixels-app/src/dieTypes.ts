import {
  PixelDieTypeValues,
  PixelDieType,
} from "@systemic-games/pixels-core-connect";

export const dieTypes = (
  Object.keys(PixelDieTypeValues) as PixelDieType[]
).filter((dt) => dt !== "unknown" && dt !== "d6pipped" && dt !== "d6fudge");
