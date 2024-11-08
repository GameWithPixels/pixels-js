import * as FileSystem from "expo-file-system";

export function getAudioClipsDirectory(): string | undefined {
  const dir = FileSystem.documentDirectory;
  return dir ? `${dir}audioClips/` : undefined;
}

export function getAudioClipPathname(filename: string): string | undefined {
  const dir = getAudioClipsDirectory();
  return dir ? dir + filename : undefined;
}
