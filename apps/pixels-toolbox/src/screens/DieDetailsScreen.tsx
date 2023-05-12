import React from "react";
import { useErrorHandler } from "react-error-boundary";

import { AppPage } from "~/components/AppPage";
import { PixelDetails } from "~/components/PixelDetails";
import PixelDispatcher from "~/features/pixels/PixelDispatcher";
import { DieDetailsScreenProps } from "~/navigation";

export default function ({ navigation, route }: DieDetailsScreenProps) {
  const errorHandler = useErrorHandler();
  const { pixelId } = route.params;
  const pixelDispatcher = PixelDispatcher.findInstance(pixelId);
  React.useEffect(() => {
    if (!pixelDispatcher) {
      errorHandler(new Error(`Unknown given Pixel Id: ${pixelId}`));
    }
  }, [errorHandler, pixelDispatcher, pixelId]);
  const goBack = React.useCallback(() => navigation.goBack(), [navigation]);
  return (
    <AppPage>
      {pixelDispatcher && (
        <PixelDetails pixelDispatcher={pixelDispatcher} goBack={goBack} />
      )}
    </AppPage>
  );
}
