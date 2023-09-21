import * as FileSystem from "expo-file-system";

import { loadFileFromModuleAsync } from "./files/loadFileFromModuleAsync";

import diceNames from "!/dice-names.txt";

export async function getRandomDieNameAsync(): Promise<string> {
  const info = await loadFileFromModuleAsync(
    diceNames,
    "getRandomDieNameAsync"
  );
  const contents = await FileSystem.readAsStringAsync(info.uri);
  const names = contents
    .split(contents.includes("\r\n") ? "\r\n" : "\n")
    .filter((n) => n.length);
  return (
    names[
      Math.min(Math.floor(Math.random() * names.length), names.length - 1)
    ] ?? "Pixel"
  );
}
