import { StorageAccessFramework } from "expo-file-system";

import Pathname from "./Pathname";
import requestUserFile from "./requestUserFile";

import toLocaleDateTimeString from "~/features/toLocaleDateTimeString";

export default async function <T extends Record<string, number>>(
  basename: string,
  data: T[]
): Promise<void> {
  if (data.length) {
    const now = toLocaleDateTimeString(new Date());
    const filename = Pathname.replaceInvalidCharacters(
      `${basename}${now}.csv`,
      "-"
    );
    const uri = await requestUserFile(filename);
    const keys = Object.keys(data[0]);
    const header = keys.join(",");
    const lines = data.map((d) => keys.map((k) => d[k].toString()).join(","));
    const contents = header + "\n" + lines.join("\n");
    console.log(`About to write ${contents.length} characters to ${filename}`);
    await StorageAccessFramework.writeAsStringAsync(uri, contents);
  }
}
