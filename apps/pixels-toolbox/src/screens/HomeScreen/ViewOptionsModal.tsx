import {
  PixelDieType,
  PixelDieTypeValues,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Checkbox,
  Modal,
  ModalProps,
  Portal,
  Text,
} from "react-native-paper";

import { useModalStyle } from "~/AppStyles";
import { BaseHStack } from "~/components/BaseHStack";
import { BaseVStack } from "~/components/BaseVStack";

const AllDieTypesButUnknown = [
  ...(Object.keys(PixelDieTypeValues).filter((k) => k !== "unknown") as Exclude<
    PixelDieType,
    "unknown"
  >[]),
] as const;

export type ViewOptions =
  | (typeof AllDieTypesButUnknown)[number]
  | "charger"
  | "onlyConnected"
  | "expandedInfo";

export const AllViewOptions: ViewOptions[] = [
  ...AllDieTypesButUnknown,
  "charger",
  "onlyConnected",
  "expandedInfo",
] as const;

function ViewOptionsCheckbox({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <BaseHStack alignItems="center">
      <Checkbox
        status={selected ? "checked" : "unchecked"}
        onPress={onToggle}
      />
      <Text>{label}</Text>
    </BaseHStack>
  );
}

function ViewOptionsColumn({
  children,
  viewOptions,
  selectedOptions,
  onSelectOptions,
}: React.PropsWithChildren<{
  viewOptions: ViewOptions[];
  selectedOptions: ViewOptions[];
  onSelectOptions: (options: ViewOptions[]) => void;
}>) {
  const { t } = useTranslation();
  return (
    <BaseVStack paddingVertical={10} gap={20}>
      {children}
      {viewOptions.map((option) => (
        <ViewOptionsCheckbox
          key={option}
          label={t(option)}
          selected={selectedOptions.includes(option)}
          onToggle={() =>
            onSelectOptions(
              selectedOptions.includes(option)
                ? selectedOptions.filter((o) => o !== option)
                : [...selectedOptions, option]
            )
          }
        />
      ))}
    </BaseVStack>
  );
}

export function ViewOptionsModal({
  visible,
  selectedOptions,
  onSelectOptions,
  ...props
}: {
  visible: boolean;
  selectedOptions: ViewOptions[];
  onSelectOptions: (options: ViewOptions[]) => void;
} & Omit<ModalProps, "children">) {
  const selectAll = () => {
    const opt = [...selectedOptions];
    for (const o of AllDieTypesButUnknown) {
      if (!opt.includes(o)) {
        opt.push(o);
      }
    }
    onSelectOptions(opt);
  };
  const unselectAll = () =>
    onSelectOptions(
      selectedOptions.filter((o) => !AllDieTypesButUnknown.includes(o as any))
    );

  const modalStyle = useModalStyle();
  const { t } = useTranslation();
  return (
    <Portal>
      <Modal visible={visible} contentContainerStyle={modalStyle} {...props}>
        <BaseVStack padding={10} gap={20}>
          <Text style={{ alignSelf: "center" }} variant="headlineMedium">
            {t("selectViewOptions")}
          </Text>
          <BaseHStack alignItems="center" gap={10}>
            <Text>{t("dieTypes") + t("colonSeparator")}</Text>
            <Button mode="text" compact onPress={selectAll}>
              {t("selectAll")}
            </Button>
            <Button mode="text" compact onPress={unselectAll}>
              {t("unselectAll")}
            </Button>
          </BaseHStack>
          <BaseHStack justifyContent="space-between">
            {[0, 1].map((col) => (
              <ViewOptionsColumn
                key={col}
                viewOptions={AllViewOptions.filter((_, i) => i % 2 === col)}
                selectedOptions={selectedOptions}
                onSelectOptions={onSelectOptions}
              />
            ))}
          </BaseHStack>
          {props.onDismiss && (
            <Button mode="contained-tonal" onPress={props.onDismiss}>
              {t("close")}
            </Button>
          )}
        </BaseVStack>
      </Modal>
    </Portal>
  );
}
