import { DfuState } from "@systemic-games/react-native-nordic-nrf5-dfu";
import { useCallback, useEffect, useState } from "react";

import updateFirmware from "./updateFirmware";

/**
 * Hook to upload a bootloader & firmware.
 * @returns An array of 3 items:
 * 1. A stable function that triggers a DFU and takes the device
 *    Bluetooth address, the bootloader and firmware files paths.
 * 2. The current DFU state
 * 3. The current DFU upload progress (from 0 to 100) or -1.
 */
export default function (): [
  (
    address: number,
    bootloaderPath: string,
    firmwarePath: string
  ) => Promise<void>,
  DfuState | undefined,
  number
] {
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

  // Start DFU function
  const updateFirmwareFunc = useCallback(
    (
      address: number,
      bootloaderPath: string,
      firmwarePath: string
    ): Promise<void> => {
      return updateFirmware(
        address,
        bootloaderPath,
        firmwarePath,
        setDfuState,
        setDfuProgress
      );
    },
    []
  );

  return [updateFirmwareFunc, dfuState, dfuProgress];
}
