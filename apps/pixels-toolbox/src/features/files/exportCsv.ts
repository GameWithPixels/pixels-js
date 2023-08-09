import FileSystem, { StorageAccessFramework } from "expo-file-system";
import { Platform } from "react-native";

import Pathname from "./Pathname";
import { requestUserFileAsync } from "./requestUserFileAsync";

import { shareFileAsync } from "~/features/shareFileAsync";

export async function exportCsv<
  T extends Record<string, number | boolean | string>
>(filename: string, data: readonly T[]): Promise<void> {
  if (data.length) {
    const keys = Object.keys(data[0]);
    const header = keys.join(",");
    const lines = data.map((d) => keys.map((k) => d[k].toString()).join(","));
    const contents = header + "\n" + lines.join("\n");
    if (Platform.OS === "android") {
      const uri = await requestUserFileAsync(filename);
      console.log(
        `About to write ${contents.length} characters to ${filename}`
      );
      await StorageAccessFramework.writeAsStringAsync(uri, contents);
    } else {
      const uri = await Pathname.generateTempPathnameAsync(".csv");
      try {
        await FileSystem.writeAsStringAsync(uri, contents);
        await shareFileAsync(uri);
      } finally {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      }
    }
  }
}
