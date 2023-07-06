import { StorageAccessFramework } from "expo-file-system";

import { requestUserFileAsync } from "./requestUserFileAsync";

export async function exportCsv<T extends Record<string, number>>(
  filename: string,
  data: readonly T[]
): Promise<void> {
  if (data.length) {
    const uri = await requestUserFileAsync(filename);
    const keys = Object.keys(data[0]);
    const header = keys.join(",");
    const lines = data.map((d) => keys.map((k) => d[k].toString()).join(","));
    const contents = header + "\n" + lines.join("\n");
    console.log(`About to write ${contents.length} characters to ${filename}`);
    await StorageAccessFramework.writeAsStringAsync(uri, contents);
  }
}
