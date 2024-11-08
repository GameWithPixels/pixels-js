import { Audio, AudioMode, AVPlaybackSource } from "expo-av";

import { getAudioClipPathname } from "./path";

import { logError } from "~/features/utils";

const soundMap = new Map<AVPlaybackSource, Audio.Sound>();

async function getSound(source: AVPlaybackSource): Promise<Audio.Sound> {
  let loadedSound = soundMap.get(source);
  if (!loadedSound) {
    const { sound } = await Audio.Sound.createAsync(source);
    soundMap.set(source, sound);
    loadedSound = sound;
  }
  return loadedSound;
}

export async function playAudioClipAsync(
  audioClipUuid: string,
  volume = 1
): Promise<void> {
  const uri = getAudioClipPathname(audioClipUuid);
  if (!uri) {
    logError("Failed to play audio clip: audio clips directory not valid");
    return;
  }
  try {
    const sound = await getSound({ uri });
    await sound.setPositionAsync(0);
    await sound.setVolumeAsync(volume);
    await sound.playAsync();
  } catch (e) {
    logError(`Error playing audio clip ${uri}: ${e}`);
  }
}

export function setAudioSettingsAsync(
  settings: Pick<AudioMode, "staysActiveInBackground" | "playsInSilentModeIOS">
): Promise<void> {
  return Audio.setAudioModeAsync(settings);
}
