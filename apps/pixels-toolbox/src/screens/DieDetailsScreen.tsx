import React from "react";
import { useErrorHandler } from "react-error-boundary";

import { AppPage } from "~/components/AppPage";
import { PixelDetails } from "~/components/PixelDetails";
import { usePrintDieLabel } from "~/features/hooks/usePrintDieLabel";
import PixelDispatcher from "~/features/pixels/PixelDispatcher";
import { DieDetailsScreenProps } from "~/navigation";

export function DieDetailsScreen({ navigation, route }: DieDetailsScreenProps) {
  const errorHandler = useErrorHandler();
  const { pixelId } = route.params;
  const pixelDispatcher = PixelDispatcher.findDispatcher(pixelId);
  React.useEffect(() => {
    if (!pixelDispatcher) {
      errorHandler(
        new Error(
          `Unknown given Pixel Id: ${pixelId.toString(16).padStart(8, "0")}`
        )
      );
    }
  }, [errorHandler, pixelDispatcher, pixelId]);
  const goBack = React.useCallback(() => navigation.goBack(), [navigation]);
  const { printDieLabel } = usePrintDieLabel();
  return (
    <AppPage>
      {pixelDispatcher && (
        <PixelDetails
          pixelDispatcher={pixelDispatcher}
          goBack={goBack}
          onPrintLabel={printDieLabel}
        />
      )}
    </AppPage>
  );
}
