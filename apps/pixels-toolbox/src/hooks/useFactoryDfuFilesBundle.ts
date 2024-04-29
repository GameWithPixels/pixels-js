import React from "react";

import { useAppDfuFilesBundles } from "./useAppDfuFilesBundles";

import { useAppSelector } from "~/app/hooks";
import DfuFilesBundle from "~/features/dfu/DfuFilesBundle";
import { DfuFileInfo } from "~/features/dfu/getDfuFileInfo";
import { selectCustomFirmwareAndProfile } from "~/features/store/validationSelectors";

export interface FactoryDfuFilesBundle {
  readonly bootloader?: DfuFileInfo;
  readonly firmware: DfuFileInfo;
  readonly reconfigFirmware: DfuFileInfo;
  readonly date: Date;
}

export function useFactoryDfuFilesBundle(): [
  FactoryDfuFilesBundle | undefined,
  boolean | undefined,
  Error | undefined,
] {
  const [selectedBundle, availableBundles, bundlesError] =
    useAppDfuFilesBundles();
  const useCustomFirmware = useAppSelector(selectCustomFirmwareAndProfile);
  const pickedBundle: DfuFilesBundle | undefined = useCustomFirmware
    ? selectedBundle
    : availableBundles.find((b) => b.kind === "factory");
  const reconfigDfuBundle = availableBundles.find(
    (b) => b.firmware?.comment?.includes("reconfigure")
  );
  const pickError = React.useMemo(
    () =>
      !useCustomFirmware && availableBundles.length && !pickedBundle?.bootloader
        ? new Error("Validation DFU bootloader file not found or problematic")
        : pickedBundle && !pickedBundle.firmware
          ? new Error("Validation DFU firmware file not found or problematic")
          : !reconfigDfuBundle?.firmware
            ? new Error(
                "Validation DFU firmware file for reconfiguration not found"
              )
            : undefined,
    [availableBundles, pickedBundle, reconfigDfuBundle, useCustomFirmware]
  );
  const factoryBundle = React.useMemo(
    () =>
      pickedBundle?.firmware && reconfigDfuBundle?.firmware && !pickError
        ? {
            firmware: pickedBundle.firmware,
            bootloader: pickedBundle.bootloader,
            reconfigFirmware: reconfigDfuBundle.firmware,
            date: pickedBundle.date,
            isFactory: pickedBundle.kind === "factory",
          }
        : undefined,
    [pickError, pickedBundle, reconfigDfuBundle]
  );
  return [
    factoryBundle,
    pickedBundle?.kind === "factory",
    bundlesError ?? pickError,
  ];
}
