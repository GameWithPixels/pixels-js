import {
  PixelColorway,
  PixelDieType,
} from "@systemic-games/react-native-pixels-connect";

export interface PairedDie {
  systemId: string;
  pixelId: number;
  name: string;
  dieType: PixelDieType;
  colorway: PixelColorway;
  firmwareTimestamp: number;
  profileUuid: string;
}
