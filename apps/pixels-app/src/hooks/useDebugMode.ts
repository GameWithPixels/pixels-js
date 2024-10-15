import { useAppSelector } from "~/app/hooks";

export function useDebugMode(): boolean {
  return useAppSelector((state) => state.appSettings.debugMode);
}
