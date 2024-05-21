import React from "react";

import { useAppDfuFilesBundles } from "./useAppDfuFilesBundles";

import { useAppSelector } from "~/app/hooks";
import { DfuFileInfo } from "~/features/dfu/getDfuFileInfo";
import { selectCustomFirmwareAndProfile } from "~/features/store/validationSelectors";

export interface FactoryDfuFilesBundle {
  readonly bootloader: DfuFileInfo;
  readonly firmware: DfuFileInfo;
  readonly reconfigFirmware: DfuFileInfo;
  readonly date: Date;
}

function notEmpty<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
export function useFactoryDfuFilesBundle(): [
  FactoryDfuFilesBundle | undefined,
  boolean | undefined,
  Error | undefined,
] {
  const [selectedBundle, availableBundles, bundlesError] =
    useAppDfuFilesBundles();
  const useCustomFirmware = useAppSelector(selectCustomFirmwareAndProfile);
  const pickedBundle = useCustomFirmware
    ? selectedBundle
    : availableBundles.find((b) => b.kind === "factory");
  const reconfigDfuBundle = availableBundles.find((b) =>
    b.firmware?.comment?.includes("reconfigure")
  );
  const hasBL = notEmpty(pickedBundle?.bootloader);
  const hasFW = notEmpty(pickedBundle?.firmware);
  const hasCF = notEmpty(reconfigDfuBundle?.firmware);
  const hasError = hasBL && hasFW && hasCF;
  const factoryBundle = React.useMemo(
    () =>
      hasError
        ? {
            firmware: pickedBundle.firmware,
            bootloader: pickedBundle.bootloader,
            reconfigFirmware: reconfigDfuBundle.firmware,
            date: pickedBundle!.date,
            isFactory: pickedBundle!.kind === "factory",
          }
        : undefined,
    [hasError, pickedBundle, reconfigDfuBundle]
  );
  const pickError = React.useMemo(
    () =>
      !hasBL
        ? new Error("Validation DFU bootloader file not found or problematic")
        : !hasFW
          ? new Error("Validation DFU firmware file not found or problematic")
          : !hasCF
            ? new Error(
                "Validation DFU firmware file for reconfiguration not found"
              )
            : undefined,
    [hasBL, hasCF, hasFW]
  );
  return [
    factoryBundle,
    pickedBundle?.kind === "factory",
    bundlesError ?? pickError,
  ];
}
