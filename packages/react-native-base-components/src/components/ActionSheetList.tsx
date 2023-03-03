import {
  Actionsheet,
  IActionsheetProps,
  Text,
  usePropsResolution,
  FlatList,
} from "native-base";
import { ColorType } from "native-base/lib/typescript/components/types";
import React from "react";
// eslint-disable-next-line import/namespace
import { ListRenderItemInfo } from "react-native";

/**
 * Data of every item that will appear in the Actionsheet drawer.
 * @param label text/title/label of the Actionsheet.item
 * @param item item object as any type of ReactNode to replace default Actionsheet.item
 * @param onPress function executed the Actionsheet.item or custom item is pressed
 */
export interface ActionSheetListItemData {
  label: string; // text/title/label of the item
  onSelect?: ((label: string) => void) | null; // function executed when the item is pressed
}

/**
 * Props for {@link ActionSheet} component.
 */
export interface ActionSheetListProps extends IActionsheetProps {
  itemsData: ActionSheetListItemData[]; // Text to display on each item and action to call
  title?: string;
  sheetBgColor?: ColorType;
}

/**
 * ActionSheet drawer component. Can be triggered by any given component and display default Actionsheet.items or custom children.
 * @param props See {@link ActionSheetListProps} for props parameters.
 */
export const ActionSheetList = React.memo(function (
  props: ActionSheetListProps
) {
  const resolvedProps = usePropsResolution(
    "ActionSheetList",
    props
  ) as ActionSheetListProps;
  const { sheetBgColor, onClose } = resolvedProps;
  const renderItem = React.useCallback(
    ({ item, index }: ListRenderItemInfo<ActionSheetListItemData>) => {
      return (
        <Actionsheet.Item
          key={index}
          onPress={() => {
            item.onSelect?.(item.label);
            onClose?.();
          }}
          alignItems="center"
          bg={sheetBgColor}
        >
          <Text fontSize="md" textAlign="center">
            {item.label}
          </Text>
        </Actionsheet.Item>
      );
    },
    [onClose, sheetBgColor]
  );
  return (
    <Actionsheet {...resolvedProps}>
      <Actionsheet.Content bg={resolvedProps.sheetBgColor}>
        {resolvedProps.title && (
          <Text bold fontSize="16" px={4}>
            {resolvedProps.title}
          </Text>
        )}
        <FlatList
          width="100%"
          data={resolvedProps.itemsData}
          renderItem={renderItem}
          height={300}
        />
      </Actionsheet.Content>
    </Actionsheet>
  );
});
