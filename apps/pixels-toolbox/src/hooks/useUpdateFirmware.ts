import { DfuState } from "@systemic-games/react-native-nordic-nrf5-dfu";
import React from "react";

import { DfuTarget, updateFirmware } from "~/features/dfu/updateFirmware";

/**
 * Hook to upload a bootloader & firmware.
 * @returns An array of 4 items:
 * 1. A stable function that triggers a DFU and takes the device
 *    Bluetooth address, the bootloader and firmware files paths.
 * 2. The current DFU state
 * 3. The current DFU upload progress (from 0 to 100).
 * 4. The last error that occurred (cleared when starting a new DFU)
 */
export function useUpdateFirmware(): [
  (
    target: DfuTarget,
    bootloaderPath?: string,
    firmwarePath?: string,
    isBootloaderMacAddress?: boolean
  ) => void,
  DfuState | undefined,
  number,
  Error | undefined,
] {
  // DFU state and progress
  const [dfuState, setDfuState] = React.useState<DfuState>();
  const [dfuProgress, setDfuProgress] = React.useState(0);
  const [lastError, setLastError] = React.useState<Error>();

  // Start DFU function
  const updateFirmwareFunc = React.useCallback(
    (
      target: DfuTarget,
      bootloaderPath?: string,
      firmwarePath?: string,
      isBootloaderMacAddress?: boolean
    ): void => {
      setLastError(undefined);
      setDfuProgress(0);
      updateFirmware(
        target,
        bootloaderPath,
        firmwarePath,
        setDfuState,
        setDfuProgress,
        isBootloaderMacAddress
      ).catch(setLastError);
    },
    []
  );

  return [updateFirmwareFunc, dfuState, dfuProgress, lastError];
}
