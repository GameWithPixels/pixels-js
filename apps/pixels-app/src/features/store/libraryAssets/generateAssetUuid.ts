import { RootState } from "~/app/store";
import { generateUuid } from "~/features/utils";

export function generateAssetUuid({
  audioClips,
  images,
}: Pick<RootState["libraryAssets"], "audioClips" | "images">): string {
  let uuid: string;
  do {
    uuid = generateUuid();
  } while (audioClips.entities[uuid] || images.entities[uuid]);
  return uuid;
}
