import { Button, ScrollView, VStack } from "native-base";
import { useEffect } from "react";
import { useErrorHandler } from "react-error-boundary";
import { useTranslation } from "react-i18next";

import AppPage from "~/components/AppPage";
import PixelDetails from "~/components/PixelDetails";
import PixelDispatcher from "~/features/pixels/PixelDispatcher";
import { DieDetailsProps } from "~/navigation";

function DieDetailsPage({ route, navigation }: DieDetailsProps) {
  const errorHandler = useErrorHandler();
  const { pixelId } = route.params;
  const pixelDispatcher = PixelDispatcher.findInstance(pixelId);
  useEffect(() => {
    if (!pixelDispatcher) {
      errorHandler(new Error(`Unknown given Pixel Id: ${pixelId}`));
    }
  }, [errorHandler, pixelDispatcher, pixelId]);

  const { t } = useTranslation();
  return (
    <VStack mx={10} flex={1}>
      <ScrollView>
        {pixelDispatcher && <PixelDetails pixelDispatcher={pixelDispatcher} />}
      </ScrollView>
      <Button mt={10} onPress={() => navigation.goBack()}>
        {t("close")}
      </Button>
    </VStack>
  );
}

export default function (props: DieDetailsProps) {
  return (
    <AppPage>
      <DieDetailsPage {...props} />
    </AppPage>
  );
}
