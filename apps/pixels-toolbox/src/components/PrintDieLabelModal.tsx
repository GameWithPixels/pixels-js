import {
  PixelColorway,
  PixelInfo,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Divider,
  Modal,
  ModalProps,
  Portal,
  Text,
  Title,
} from "react-native-paper";

import { SelectColorwayModal } from "./SelectColorwayModal";

import { AppStyles, useModalStyle } from "~/AppStyles";
import { useAppSelector } from "~/app/hooks";
import { BaseVStack } from "~/components/BaseVStack";
import { printDieBoxLabelAsync } from "~/features/print";

export function PrintDieLabelModal({
  pixel,
  ...props
}: { pixel?: PixelInfo } & Omit<ModalProps, "visible" | "children">) {
  const [printStatus, setPrintStatus] = React.useState("");
  const [onSelectColorway, setOnSelectColorway] =
    React.useState<(c: PixelColorway) => void>();
  const smallLabel = useAppSelector(
    (state) => state.validationSettings.dieLabel.smallLabel
  );
  const showClose = printStatus.length > 0 && !printStatus.endsWith("...");

  // Values for UI
  const modalStyle = useModalStyle();
  const { t } = useTranslation();

  // Print task
  React.useEffect(() => {
    if (pixel) {
      setPrintStatus("");
      const print = async () => {
        const colorway =
          pixel.colorway !== "unknown"
            ? pixel.colorway
            : await new Promise<PixelColorway>((resolve) =>
                setOnSelectColorway(() => (colorway: PixelColorway) => {
                  setOnSelectColorway(undefined);
                  resolve(colorway);
                })
              );
        await printDieBoxLabelAsync(
          {
            kind: "dieWithId",
            pixelId: pixel.pixelId,
            name: pixel.name,
            type: pixel.dieType !== "unknown" ? pixel.dieType : "d20",
            colorway,
          },
          1, // 1 copy
          {
            statusCallback: (status) =>
              setPrintStatus(t(status + "AsPrintStatus")),
            smallLabel,
          }
        );
      };
      print().catch((error) => {
        const msg = error.message ?? error;
        console.warn(msg);
        setPrintStatus(msg);
      });
    }
  }, [pixel, smallLabel, t]);

  return (
    <>
      <Portal>
        <Modal
          contentContainerStyle={modalStyle}
          visible={!!pixel}
          dismissable={false}
          {...props}
        >
          <BaseVStack gap={10}>
            <Title>{t("labelPrinting")}</Title>
            <Divider style={{ height: 2 }} />
            <Text style={AppStyles.centered} variant="bodyLarge">
              {t("status")}
              {t("colonSeparator")}
              {printStatus}
            </Text>
            {showClose && (
              <Button mode="outlined" onPress={props.onDismiss}>
                {t("close")}
              </Button>
            )}
          </BaseVStack>
        </Modal>
      </Portal>
      <SelectColorwayModal
        visible={!!onSelectColorway}
        onSelect={onSelectColorway}
        onDismiss={() => {
          setOnSelectColorway(undefined);
          props.onDismiss?.();
        }}
      />
    </>
  );
}
