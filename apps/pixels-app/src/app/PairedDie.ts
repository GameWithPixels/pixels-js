import {
  PixelColorway,
  PixelDieType,
} from "@systemic-games/react-native-pixels-connect";

export type PairedDie = Readonly<{
  systemId: string;
  pixelId: number;
  name: string;
  ledCount: number;
  colorway: PixelColorway;
  dieType: PixelDieType;
  firmwareTimestamp: number;
  profileUuid: string;
  profileHash: number;
}>;
