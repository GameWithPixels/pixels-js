import { PixelDieType } from "@systemic-games/react-native-pixels-connect";

export const AvailableDieTypeValues = [
  "d20",
  "d12",
  "d00",
  "d10",
  "d8",
  "d6pipped",
  "d6",
  "d4",
] as const;

// Check that every die type is a PixelDieType
const _: readonly PixelDieType[] = AvailableDieTypeValues;

export type AvailableDieType = (typeof AvailableDieTypeValues)[number];
