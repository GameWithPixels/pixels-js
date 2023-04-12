import { useEffect } from "react";
import { useErrorHandler } from "react-error-boundary";
import { ScrollView } from "react-native";
import { useTheme } from "react-native-paper";

import PixelDetails from "~/components/PixelDetails";
import PixelDispatcher from "~/features/pixels/PixelDispatcher";
import { DieDetailsProps } from "~/navigation";

export default function ({ route }: DieDetailsProps) {
  const theme = useTheme();
  const errorHandler = useErrorHandler();
  const { pixelId } = route.params;
  const pixelDispatcher = PixelDispatcher.findInstance(pixelId);
  useEffect(() => {
    if (!pixelDispatcher) {
      errorHandler(new Error(`Unknown given Pixel Id: ${pixelId}`));
    }
  }, [errorHandler, pixelDispatcher, pixelId]);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {pixelDispatcher && <PixelDetails pixelDispatcher={pixelDispatcher} />}
    </ScrollView>
  );
}
