import React from "react";
import { useErrorHandler } from "react-error-boundary";

import { AppPage } from "~/components/AppPage";
import { PixelDetails } from "~/components/PixelDetails";
import PixelDispatcher from "~/features/pixels/PixelDispatcher";
import { DieDetailsProps } from "~/navigation";

export default function ({ route }: DieDetailsProps) {
  const errorHandler = useErrorHandler();
  const { pixelId } = route.params;
  const pixelDispatcher = PixelDispatcher.findInstance(pixelId);
  React.useEffect(() => {
    if (!pixelDispatcher) {
      errorHandler(new Error(`Unknown given Pixel Id: ${pixelId}`));
    }
  }, [errorHandler, pixelDispatcher, pixelId]);
  return (
    <AppPage>
      {pixelDispatcher && <PixelDetails pixelDispatcher={pixelDispatcher} />}
    </AppPage>
  );
}
