import { useTranslation } from "react-i18next";
import { FlatList } from "react-native";
import { Button, Modal, ModalProps, Portal, Text } from "react-native-paper";

import { useModalStyle, AppStyles } from "~/AppStyles";
import { BaseVStack } from "~/components/BaseVStack";
import { DiceSetType } from "~/features/set";
import { ValidationDiceSetTypes } from "~/features/validation";

export function SelectDiceSetTypeModal({
  visible,
  onSelect,
  ...props
}: {
  visible: boolean;
  onSelect?: (setType: DiceSetType) => void;
} & Omit<ModalProps, "children">) {
  // Values for UI
  const modalStyle = useModalStyle();
  const { t } = useTranslation();
  return (
    <Portal>
      <Modal visible={visible} contentContainerStyle={modalStyle} {...props}>
        <BaseVStack paddingVertical={10} gap={20}>
          <Text style={{ alignSelf: "center" }} variant="headlineMedium">
            {t("selectSetType")}
          </Text>
          <FlatList
            style={AppStyles.fullWidth}
            contentContainerStyle={{
              ...AppStyles.listContentContainer,
              gap: 20,
            }}
            columnWrapperStyle={{ gap: 20 }}
            numColumns={2}
            data={ValidationDiceSetTypes}
            renderItem={({ item: setType }) => (
              <Button
                mode="contained-tonal"
                style={{ flex: 1 }}
                onPress={() => onSelect?.(setType)}
              >
                {t(setType)}
              </Button>
            )}
          />
        </BaseVStack>
      </Modal>
    </Portal>
  );
}
