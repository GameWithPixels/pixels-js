import { DfuState } from "@systemic-games/react-native-nordic-nrf5-dfu";
import React from "react";

import updateFirmware from "./updateFirmware";

/**
 * Hook to upload a bootloader & firmware.
 * @returns An array of 4 items:
 * 1. A stable function that triggers a DFU and takes the device
 *    Bluetooth address, the bootloader and firmware files paths.
 * 2. The current DFU state
 * 3. The current DFU upload progress (from 0 to 100) or -1.
 * 4. The last error that occurred (cleared when starting a new DFU)
 */
export default function (): [
  (address: number, bootloaderPath: string, firmwarePath: string) => void,
  DfuState | "initializing" | undefined,
  number,
  Error | undefined
] {
  // DFU state and progress
  const [dfuState, setDfuState] = React.useState<DfuState | "initializing">();
  const [dfuProgress, setDfuProgress] = React.useState(-1);
  const [lastError, setLastError] = React.useState<Error>();

  // Start DFU function
  const updateFirmwareFunc = React.useCallback(
    (address: number, bootloaderPath: string, firmwarePath: string): void => {
      setLastError(undefined);
      setDfuState("initializing");
      updateFirmware(
        address,
        bootloaderPath,
        firmwarePath,
        setDfuState,
        setDfuProgress
      )
        .catch((error) => {
          setLastError(error);
        })
        .finally(() => {
          setDfuState(undefined);
          setDfuProgress(-1);
        });
    },
    []
  );

  return [updateFirmwareFunc, dfuState, dfuProgress, lastError];
}
