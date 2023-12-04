import { assert } from "@systemic-games/pixels-core-utils";

import { PixelAnimation } from "@/temp";

export function useAnimation(
  animOrUuid: PixelAnimation | string,
  animations?: PixelAnimation[]
): {
  name: string;
} {
  const anim =
    typeof animOrUuid === "string"
      ? animations?.find((p) => p.uuid === animOrUuid)
      : animOrUuid;
  assert(anim, `Animation ${animOrUuid} not found`);
  return { name: anim.name };
}
