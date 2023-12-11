import { assert } from "@systemic-games/pixels-core-utils";
import { Profiles } from "@systemic-games/react-native-pixels-connect";
import { runInAction } from "mobx";

import { LibraryState } from "./profilesLibrarySlice";
import { storeLog } from "./storeLog";

import { makeObservable } from "~/features/makeObservable";

const loadedAudioClips = new Map<string, Profiles.AudioClip>();

function create(uuid: string): Profiles.AudioClip {
  storeLog("create", "audioClip", uuid);
  const audioClip = makeObservable(new Profiles.AudioClip({ uuid }));
  loadedAudioClips.set(uuid, audioClip);
  return audioClip;
}

export function readAudioClip(
  uuid: string,
  library: LibraryState
): Profiles.AudioClip {
  const audioClip = loadedAudioClips.get(uuid) ?? create(uuid);
  const audioClipData = library.audioClips.find((ac) => ac.uuid === uuid);
  assert(audioClipData, `AudioClip ${uuid} not found`);
  runInAction(() => (audioClip.localId = audioClipData.localId));
  return audioClip;
}
