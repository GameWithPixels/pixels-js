import { ColorDesign } from "@/temp";

export function useColorDesign(design: ColorDesign): {
  name: string;
} {
  return { name: design.name };
}
