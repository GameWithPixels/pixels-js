import { LibraryAssetsState } from "~/app/store";
import { generateUuid } from "~/features/utils";

export function generateAssetUuid({
  audioClips,
  images,
}: LibraryAssetsState): string {
  let uuid: string;
  do {
    uuid = generateUuid();
  } while (audioClips.entities[uuid] || images.entities[uuid]);
  return uuid;
}
