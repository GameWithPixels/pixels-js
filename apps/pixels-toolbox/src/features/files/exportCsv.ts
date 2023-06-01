import { StorageAccessFramework } from "expo-file-system";

import requestUserFile from "./requestUserFile";

export default async function <T extends Record<string, number>>(
  filename: string,
  data: readonly T[]
): Promise<void> {
  if (data.length) {
    const uri = await requestUserFile(filename);
    const keys = Object.keys(data[0]);
    const header = keys.join(",");
    const lines = data.map((d) => keys.map((k) => d[k].toString()).join(","));
    const contents = header + "\n" + lines.join("\n");
    console.log(`About to write ${contents.length} characters to ${filename}`);
    await StorageAccessFramework.writeAsStringAsync(uri, contents);
  }
}
