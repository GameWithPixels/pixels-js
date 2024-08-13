import { PixelColorway } from "@systemic-games/react-native-pixels-connect";
import { useTranslation } from "react-i18next";
import { FlatList } from "react-native";
import {
  Modal,
  ModalProps,
  Portal,
  Text,
  TouchableRipple,
} from "react-native-paper";

import { ColorwayImage } from "./ColorwayImage";

import { useModalStyle, AppStyles } from "~/AppStyles";
import { BaseVStack } from "~/components/BaseVStack";
import { Colorways } from "~/features/pixels/colorways";

export function SelectColorwayModal({
  visible,
  onSelect,
  ...props
}: {
  visible: boolean;
  onSelect?: (colorway: PixelColorway) => void;
} & Omit<ModalProps, "children">) {
  // Values for UI
  const modalStyle = useModalStyle();
  const { t } = useTranslation();
  return (
    <Portal>
      <Modal visible={visible} contentContainerStyle={modalStyle} {...props}>
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
            data={Colorways}
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
