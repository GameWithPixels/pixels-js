import { BaseVStack } from "@systemic-games/react-native-base-components";
import {
  PixelColorway,
  PixelColorwayValues,
} from "@systemic-games/react-native-pixels-connect";
import { useTranslation } from "react-i18next";
import { FlatList } from "react-native";
import { Modal, Portal, Text, TouchableRipple } from "react-native-paper";

import { ColorwayImage } from "./ColorwayImage";

import { useModalStyle, AppStyles } from "~/AppStyles";

export function SelectColorwayModal({
  visible,
  onSelect,
}: {
  visible: boolean;
  onSelect?: (colorway: PixelColorway) => void;
}) {
  // Values for UI
  const modalStyle = useModalStyle();
  const { t } = useTranslation();
  const colors = (Object.keys(PixelColorwayValues) as [PixelColorway]).filter(
    (c) => c !== "unknown" && c !== "custom"
  );
  colors.push("unknown");
  return (
    <Portal>
      <Modal
        visible={visible}
        contentContainerStyle={modalStyle}
        dismissable={false}
      >
        <BaseVStack paddingVertical={10} gap={20}>
          <Text style={{ alignSelf: "center" }} variant="headlineMedium">
            {t("selectColorway")}
          </Text>
          <FlatList
            style={AppStyles.fullWidth}
            contentContainerStyle={{
              ...AppStyles.listContentContainer,
              gap: 20,
            }}
            columnWrapperStyle={{
              justifyContent: "space-around",
            }}
            numColumns={2}
            data={colors}
            renderItem={({ item: c }) => (
              <TouchableRipple onPress={() => onSelect?.(c)}>
                <ColorwayImage colorway={c} />
              </TouchableRipple>
            )}
          />
        </BaseVStack>
      </Modal>
    </Portal>
  );
}
