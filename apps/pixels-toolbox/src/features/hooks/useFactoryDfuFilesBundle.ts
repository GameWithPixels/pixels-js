import React from "react";

import { useAppDfuFilesBundles } from "./useAppDfuFilesBundles";
import { selectCustomFirmwareAndProfile } from "../store/validationSelectors";

import { useAppSelector } from "~/app/hooks";
import { FactoryDfuFilesBundle } from "~/components/ValidationTestsComponents";

const bootloaderError = new Error(
  "Validation DFU bootloader file not found or problematic"
);
const firmwareError = new Error(
  "Validation DFU firmware file not found or problematic"
);

export function useFactoryDfuFilesBundle(): [
  FactoryDfuFilesBundle | undefined,
  boolean | undefined,
  Error | undefined
] {
  const [selectedBundle, availableBundles, bundlesError] =
    useAppDfuFilesBundles();
  const useCustomFirmware = useAppSelector(selectCustomFirmwareAndProfile);
  const pickedBundle = useCustomFirmware
    ? selectedBundle
    : availableBundles.find((b) => b.kind === "factory");
  const pickError =
    !useCustomFirmware && availableBundles.length && !pickedBundle?.bootloader
      ? bootloaderError
      : pickedBundle && !pickedBundle.firmware
      ? firmwareError
      : undefined;
  const factoryBundle = React.useMemo(
    () =>
      pickedBundle?.firmware && !pickError
        ? {
            firmware: pickedBundle.firmware,
            bootloader: pickedBundle.bootloader,
            date: pickedBundle.date,
            isFactory: pickedBundle.kind === "factory",
          }
        : undefined,
    [pickError, pickedBundle]
  );
  return [
    factoryBundle,
    pickedBundle?.kind === "factory",
    bundlesError ?? pickError,
  ];
}
