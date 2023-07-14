import * as Sharing from "expo-sharing";

/** Ask user to share file. */
export async function shareFileAsync(uri: string): Promise<void> {
  await Sharing.shareAsync(uri);
}
