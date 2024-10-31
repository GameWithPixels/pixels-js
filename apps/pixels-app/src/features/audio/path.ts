import * as FileSystem from "expo-file-system";

export function getAudioClipsPath(): string | undefined {
  const dir = FileSystem.documentDirectory;
  return dir ? `${dir}audioClips/` : undefined;
}

export function getAudioClipPathname(audioClipUui: string): string | undefined {
  const dir = FileSystem.documentDirectory;
  return dir ? `${dir}audioClips/${audioClipUui}` : undefined;
}
