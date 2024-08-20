import React from "react";

import { usePixelsCentral } from "./usePixelsCentral";

export function useIsDieUpdatingFirmware(pixelId: number) {
  const central = usePixelsCentral();
  const [updating, setUpdating] = React.useState(
    central.pixelInDFU?.pixelId === pixelId
  );
  React.useEffect(() => {
    const onPixelInDFU = () =>
      setUpdating(central.pixelInDFU?.pixelId === pixelId);
    onPixelInDFU();
    central.addListener("pixelInDFU", onPixelInDFU);
    return () => {
      central.removeListener("pixelInDFU", onPixelInDFU);
    };
  }, [central, pixelId]);
  return updating;
}

export function useIsAppUpdatingFirmware(): boolean {
  const central = usePixelsCentral();
  const [updating, setUpdating] = React.useState(!!central.pixelInDFU);
  React.useEffect(() => {
    const onPixelInDFU = () => setUpdating(!!central.pixelInDFU);
    onPixelInDFU();
    central.addListener("pixelInDFU", onPixelInDFU);
    return () => {
      central.removeListener("pixelInDFU", onPixelInDFU);
    };
  }, [central]);
  return updating;
}
