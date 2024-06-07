/* eslint-disable @typescript-eslint/no-unused-vars */
import { assert } from "@systemic-games/pixels-core-utils";
import {
  Profiles,
  Serializable,
} from "@systemic-games/react-native-pixels-connect";
import { runInAction } from "mobx";

import { log } from "./log";

import { LibraryState } from "~/app/store";
import { makeObservable } from "~/features/utils";

const loadedAudioClips = new Map<string, Profiles.AudioClip>();

function create(uuid: string): Profiles.AudioClip {
  log("create", "audioClip", uuid);
  const audioClip = makeObservable(new Profiles.AudioClip({ uuid }));
  loadedAudioClips.set(uuid, audioClip);
  return audioClip;
}

export function readAudioClip(
  uuid: string,
  library: LibraryState
): Profiles.AudioClip {
  throw new Error("Not implemented");
  // const audioClip = loadedAudioClips.get(uuid) ?? create(uuid);
  // const audioClipData = library.audioClips.find((ac) => ac.uuid === uuid);
  // assert(audioClipData, `AudioClip ${uuid} not found`);
  // runInAction(() => (audioClip.localId = audioClipData.localId));
  // return audioClip;
}
