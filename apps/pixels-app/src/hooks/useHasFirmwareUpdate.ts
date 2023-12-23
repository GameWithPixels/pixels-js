import { Pixel, PixelInfo } from "@systemic-games/react-native-pixels-connect";
import React from "react";

import { useDfuBundle } from "./useDfuBundle";

export function useHasFirmwareUpdate(pixel?: Pixel): boolean {
  const [bundle] = useDfuBundle();
  const [firmwareDate, setFirmwareDate] = React.useState<number | undefined>(
    pixel?.firmwareDate?.getTime()
  );
  React.useEffect(() => {
    if (pixel) {
      const onFirmwareDate = (pixel: PixelInfo) =>
        setFirmwareDate(pixel.firmwareDate.getTime());
      onFirmwareDate(pixel);
      pixel.addPropertyListener("firmwareDate", onFirmwareDate);
      return () => {
        pixel.removePropertyListener("firmwareDate", onFirmwareDate);
        setFirmwareDate(undefined);
      };
    }
  }, [pixel]);
  return (
    firmwareDate !== undefined && !!bundle && firmwareDate < bundle.timestamp
  );
}
