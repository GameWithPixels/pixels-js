import { Audio, AudioMode, AVPlaybackSource } from "expo-av";

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
  uri: string,
  volume = 1
): Promise<void> {
  if (!uri) {
    throw new Error(
      "Failed to play audio clip: audio clips directory not valid"
    );
  }

  const sound = await getSound({ uri });
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

export function setAudioSettingsAsync(
  settings: Readonly<
    Pick<AudioMode, "staysActiveInBackground" | "playsInSilentModeIOS">
  >
): Promise<void> {
  return Audio.setAudioModeAsync(settings);
}
