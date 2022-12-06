import { Actionsheet, Text } from "native-base";
import { useCallback, memo } from "react";
import { useTranslation } from "react-i18next";

import { PixelDispatcherAction } from "~/features/pixels/PixelDispatcher";

function ApplyAllActionsheetImpl({
  dispatch,
  isOpen,
  onClose,
}: {
  dispatch: (action: PixelDispatcherAction) => void;
  isOpen: boolean;
  onClose?: () => void;
}) {
  const apply = useCallback(
    (action: PixelDispatcherAction) => {
      dispatch(action);
      onClose?.();
    },
    [dispatch, onClose]
  );
  const { t } = useTranslation();
  return (
    <Actionsheet isOpen={isOpen} onClose={onClose}>
      <Actionsheet.Content>
        <Text variant="h3">{t("applyToAllRelevantPixels")}</Text>
        <Actionsheet.Item onPress={() => apply("connect")}>
          {t("connect")}
        </Actionsheet.Item>
        <Actionsheet.Item onPress={() => apply("disconnect")}>
          {t("disconnect")}
        </Actionsheet.Item>
        <Actionsheet.Item onPress={() => apply("blink")}>
          {t("blink")}
        </Actionsheet.Item>
        <Actionsheet.Item onPress={() => apply("updateProfile")}>
          {t("updateProfile")}
        </Actionsheet.Item>
        <Actionsheet.Item onPress={() => apply("queueFirmwareUpdate")}>
          {t("updateBootloaderAndFirmware")}
        </Actionsheet.Item>
      </Actionsheet.Content>
    </Actionsheet>
  );
}

export default memo(ApplyAllActionsheetImpl);
