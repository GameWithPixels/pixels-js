import * as Updates from "expo-updates";
import { Alert } from "react-native";

import { AppDispatch } from "~/app/store";
import { setAppUpdateResponse } from "~/features/store";

// Never throws
export async function installAppUpdateAsync(
  appDispatch: AppDispatch
): Promise<void> {
  try {
    const result = await Updates.fetchUpdateAsync();
    if (result.manifest) {
      await Updates.reloadAsync();
    }
  } catch (e) {
    const error = (e as Error)?.message ?? "Error fetching update";
    const downloadError = error.startsWith("Failed to download");
    Alert.alert(
      "Failed to download the update",
      downloadError
        ? "Please check that your device has access to the internet."
        : error
    );
    appDispatch(
      setAppUpdateResponse({
        error,
      })
    );
  }
}
