import {
  PixelColorway,
  PixelDieType,
} from "@systemic-games/react-native-pixels-connect";

import { DiceSetType } from "~/features/set";

export type ProductInfo =
  | {
      kind: "die";
      type: PixelDieType;
      colorway: PixelColorway;
    }
  | {
      kind: "set";
      type: DiceSetType;
      colorway: PixelColorway;
    };
