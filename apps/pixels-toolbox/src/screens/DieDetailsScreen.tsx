import React from "react";
import { useErrorBoundary } from "react-error-boundary";

import { AppPage } from "~/components/AppPage";
import { PixelDetails } from "~/components/PixelDetails";
import PixelDispatcher from "~/features/pixels/PixelDispatcher";
import { DieDetailsScreenProps } from "~/navigation";

export function DieDetailsScreen({ navigation, route }: DieDetailsScreenProps) {
  const { showBoundary } = useErrorBoundary();
  const { pixelId } = route.params;
  const pixelDispatcher = PixelDispatcher.findDispatcher(pixelId);
  React.useEffect(() => {
    if (!pixelDispatcher) {
      showBoundary(
        new Error(`Unknown given Pixel Id: ${pixelId.toString(16)}`)
      );
    }
  }, [pixelDispatcher, pixelId, showBoundary]);
  const goBack = React.useCallback(() => navigation.goBack(), [navigation]);
  return (
    <AppPage>
      {pixelDispatcher && (
        <PixelDetails pixelDispatcher={pixelDispatcher} goBack={goBack} />
      )}
    </AppPage>
  );
}
