import { assert } from "@systemic-games/pixels-core-utils";
import { Profiles } from "@systemic-games/react-native-pixels-connect";

export function useAnimation(
  animOrUuid: Profiles.Animation | string,
  animations?: Profiles.Animation[]
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
