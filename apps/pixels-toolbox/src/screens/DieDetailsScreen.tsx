import { FastVStack } from "@systemic-games/react-native-base-components";
import { useEffect } from "react";
import { useErrorHandler } from "react-error-boundary";
import { ScrollView } from "react-native";

import AppPage from "~/components/AppPage";
import PixelDetails from "~/components/PixelDetails";
import PixelDispatcher from "~/features/pixels/PixelDispatcher";
import { DieDetailsProps } from "~/navigation";

function DieDetailsPage({ route }: DieDetailsProps) {
  const errorHandler = useErrorHandler();
  const { pixelId } = route.params;
  const pixelDispatcher = PixelDispatcher.findInstance(pixelId);
  useEffect(() => {
    if (!pixelDispatcher) {
      errorHandler(new Error(`Unknown given Pixel Id: ${pixelId}`));
    }
  }, [errorHandler, pixelDispatcher, pixelId]);

  return (
    <FastVStack mx={10} flex={1}>
      <ScrollView>
        {pixelDispatcher && <PixelDetails pixelDispatcher={pixelDispatcher} />}
      </ScrollView>
    </FastVStack>
  );
}

export default function (props: DieDetailsProps) {
  return (
    <AppPage>
      <DieDetailsPage {...props} />
    </AppPage>
  );
}
