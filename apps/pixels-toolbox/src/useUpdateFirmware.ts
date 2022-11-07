import { DfuState } from "@systemic-games/react-native-nordic-nrf5-dfu";
import { useCallback, useRef, useEffect, useState } from "react";

import getDfuFileInfo from "./getDfuFileInfo";
import toLocaleDateTimeString from "./toLocaleDateTimeString";
import updateFirmware from "./updateFirmware";
import useDfuFiles from "./useDfuFiles";

// The returned function is stable
export default function (
  dfuFilesModuleId: string
): [(address: number) => Promise<void>, DfuState | undefined, number] {
  // DFU files
  const [bootloaderPath, firmwarePath] = useDfuFiles(dfuFilesModuleId);
  useEffect(() => {
    if (bootloaderPath.length) {
      console.log(
        "DFU files loaded, version is",
        toLocaleDateTimeString(getDfuFileInfo(firmwarePath).date ?? new Date())
      );
    }
  }, [bootloaderPath, firmwarePath]);

  // DFU state and progress
  const [dfuState, setDfuState] = useState<DfuState>();
  const [dfuProgress, setDfuProgress] = useState(-1);

  // Reset progress when DFU completes
  useEffect(() => {
    if (dfuState === "dfuCompleted" || dfuState === "dfuAborted") {
      setDfuState(undefined);
      setDfuProgress(-1);
    }
  }, [dfuState]);

  // Store results in a reference to be used by the update function
  const pathsRef = useRef<[string, string]>(["", ""]);
  pathsRef.current = [bootloaderPath, firmwarePath];

  // Start DFU function
  const updateFirmwareFunc = useCallback((address: number): Promise<void> => {
    // TODO DFU files might not be loaded yet
    return updateFirmware(
      address,
      pathsRef.current[0],
      pathsRef.current[1],
      setDfuState,
      setDfuProgress
    );
  }, []);

  return [updateFirmwareFunc, dfuState, dfuProgress];
}
