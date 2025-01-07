import {
  PixelColorway,
  PixelDieType,
} from "@systemic-games/react-native-pixels-connect";

import { DiceSetType } from "~/features/set";

export type ProductInfo =
  | {
      kind: "dieWithId";
      type: PixelDieType;
      colorway: PixelColorway;
      name: string;
      pixelId: number;
    }
  | {
      kind: "die";
      type: PixelDieType;
      colorway: PixelColorway;
    }
  | {
      kind: "lcc";
      type: DiceSetType;
      colorway: PixelColorway;
    };
