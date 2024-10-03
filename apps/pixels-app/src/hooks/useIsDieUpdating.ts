import React from "react";

import { usePixelsCentral } from "./usePixelsCentral";

export function useIsDieUpdatingFirmware(pixelId: number) {
  const central = usePixelsCentral();
  const [updating, setUpdating] = React.useState(
    central.pixelInDFU === pixelId
  );
  React.useEffect(() => {
    const onPixelInDFU = () => setUpdating(central.pixelInDFU === pixelId);
    onPixelInDFU();
    return central.addListener("pixelInDFU", onPixelInDFU);
  }, [central, pixelId]);
  return updating;
}

export function useIsAppUpdatingFirmware(): boolean {
  const central = usePixelsCentral();
  const [updating, setUpdating] = React.useState(!!central.pixelInDFU);
  React.useEffect(() => {
    const onPixelInDFU = () => setUpdating(!!central.pixelInDFU);
    onPixelInDFU();
    return central.addListener("pixelInDFU", onPixelInDFU);
  }, [central]);
  return updating;
}
