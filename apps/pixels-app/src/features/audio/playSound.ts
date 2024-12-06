import { Audio, AudioMode, AVPlaybackSource } from "expo-av";
import { Platform } from "react-native";

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

export async function playSoundAsync(
  source: AVPlaybackSource,
  volume = 1
): Promise<void> {
  const sound = await getSound(source);
  await sound.setPositionAsync(0);
  await sound.setVolumeAsync(volume);
  return new Promise((resolve, reject) => {
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        resolve();
      } else if (!status.isLoaded) {
        reject(new Error(status.error));
      }
    });
    sound.playAsync();
  });
}

export async function playAudioFileAsync(
  filename: string,
  volume = 1
): Promise<void> {
  const uri = getAudioClipPathname(filename);
  if (!uri) {
    logError("Failed to play audio clip: audio clips directory not valid");
    return;
  }
  try {
    playSoundAsync({ uri }, volume);
  } catch (e) {
    logError(`Error playing audio clip ${uri}: ${e}`);
  }
}

export function setAudioSettingsAsync(
  settings: Readonly<
    Pick<AudioMode, "staysActiveInBackground" | "playsInSilentModeIOS">
  >
): Promise<void> {
  if (Platform.OS === "ios") {
    settings = {
      ...settings,
      staysActiveInBackground: false,
    };
  }
  return Audio.setAudioModeAsync(settings);
}
