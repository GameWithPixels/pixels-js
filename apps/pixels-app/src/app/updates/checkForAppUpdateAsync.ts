import * as Updates from "expo-updates";

import { AppDispatch } from "../store";

import { setAppUpdateResponse } from "~/features/store/appUpdateSlice";
import { isErrorNoUpdatePublished } from "~/fixes";

// Never throws
export async function checkForAppUpdateAsync(
  appDispatch: AppDispatch
): Promise<void> {
  const check = async () => {
    try {
      const { isAvailable, manifest } = await Updates.checkForUpdateAsync();
      if (isAvailable && manifest) {
        const { id, createdAt } = manifest;
        return { id, createdAt };
      }
    } catch (e) {
      const error = (e as Error)?.message ?? String(e);
      if (!isErrorNoUpdatePublished(error)) {
        return { error };
      }
    }
    return {};
  };
  appDispatch(setAppUpdateResponse(await check()));
}
