import { useNavigation } from "@react-navigation/native";
import { Button, VStack } from "native-base";
import { useEffect } from "react";
import { useErrorHandler } from "react-error-boundary";
import { useTranslation } from "react-i18next";

import AppPage from "~/components/AppPage";
import PixelDetails from "~/components/PixelDetails";
import PixelDispatcher from "~/features/pixels/PixelDispatcher";
import { DieDetailsProps } from "~/navigation";
import { sr } from "~/styles";

function DieDetailsPage(props: DieDetailsProps) {
  const errorHandler = useErrorHandler();
  const pixelId = props.route.params.pixelId;
  const pixelDispatcher = PixelDispatcher.findInstance(pixelId);
  useEffect(() => {
    if (!pixelDispatcher) {
      errorHandler(new Error(`Unknown given Pixel Id: ${pixelId}`));
    }
  }, [errorHandler, pixelDispatcher, pixelId]);

  const navigation = useNavigation();
  const { t } = useTranslation();
  return (
    <VStack mx={sr(10)}>
      {pixelDispatcher && <PixelDetails pixelDispatcher={pixelDispatcher} />}
      <Button mt={sr(10)} onPress={() => navigation.goBack()}>
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
