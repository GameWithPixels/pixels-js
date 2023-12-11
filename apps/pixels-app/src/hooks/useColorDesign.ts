import { Profiles } from "@systemic-games/react-native-pixels-connect";

export function useColorDesign(design: Profiles.ColorDesign): {
  name: string;
} {
  return { name: design.name };
}
