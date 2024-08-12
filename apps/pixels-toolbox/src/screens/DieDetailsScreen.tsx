import { unsigned32ToHex } from "@systemic-games/pixels-core-utils";
import React from "react";
import { useErrorBoundary } from "react-error-boundary";

import { AppPage } from "~/components/AppPage";
import { PixelDetails } from "~/components/PixelDetails";
import PixelDispatcher from "~/features/pixels/PixelDispatcher";
import { getPixelDispatcher } from "~/features/pixels/dispatchers";
import { usePrintDieLabel } from "~/hooks/usePrintDieLabel";
import { DieDetailsScreenProps } from "~/navigation";

export function DieDetailsScreen({ navigation, route }: DieDetailsScreenProps) {
  const { showBoundary } = useErrorBoundary();
  const { pixelId } = route.params;
  const dispatcher = getPixelDispatcher(pixelId);
  React.useEffect(() => {
    if (!dispatcher) {
      showBoundary(
        new Error(`Unknown given Pixel Id: ${unsigned32ToHex(pixelId)}`)
      );
    }
  }, [dispatcher, pixelId, showBoundary]);
  const goBack = React.useCallback(() => navigation.goBack(), [navigation]);
  const { printDieLabel } = usePrintDieLabel();
  return (
    <AppPage>
      {dispatcher && (
        <PixelDetails
          pixelDispatcher={dispatcher as PixelDispatcher} // TODO hack until this component is updated
          goBack={goBack}
          onPrintLabel={printDieLabel}
        />
      )}
    </AppPage>
  );
}
