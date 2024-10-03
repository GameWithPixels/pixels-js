import { useAppSelector } from "~/app/hooks";

export function useDebugMode() {
  return useAppSelector((state) => state.appSettings.enableDebugMode);
}
