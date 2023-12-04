import { ColorDesign } from "@systemic-games/pixels-core-connect";

export function useColorDesign(design: ColorDesign): {
  name: string;
} {
  return { name: design.name };
}
