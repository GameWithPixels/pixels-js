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
  profileHash: number; // Hash of the profile as reported by the die
  profileUuid: string; // Profile used by the die
}>;
