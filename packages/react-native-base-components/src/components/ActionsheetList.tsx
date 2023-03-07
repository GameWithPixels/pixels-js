import {
  Actionsheet,
  IActionsheetProps,
  Text,
  usePropsResolution,
  FlatList,
} from "native-base";
import { ColorType } from "native-base/lib/typescript/components/types";
import React from "react";

/**
 * Data of every item that will appear in the Actionsheet drawer.
 * @param label text/title/label of the Actionsheet.item
 * @param item item object as any type of ReactNode to replace default Actionsheet.item
 * @param onPress function executed the Actionsheet.item or custom item is pressed
 */
export interface ActionsheetListItemData {
  label: string; // text/title/label of the item
  onSelect?: ((label: string) => void) | null; // function executed when the item is pressed
}

/**
 * Props for {@link ActionsheetList} component.
 */
export interface ActionsheetListProps extends IActionsheetProps {
  itemsData: ActionsheetListItemData[]; // Text to display on each item and action to call
  title?: string;
  sheetBgColor?: ColorType;
}

/**
 * ActionSheet drawer component. Can be triggered by any given component and display default Actionsheet.items or custom children.
 * @param props See {@link ActionsheetListProps} for props parameters.
 */
export const ActionsheetList = React.memo(function (
  props: ActionsheetListProps
) {
  const { title, sheetBgColor, itemsData, onClose, ...resolvedProps } =
    usePropsResolution("ActionsheetList", props) as ActionsheetListProps;
  const renderItem = React.useCallback(
    ({ item, index }: { item: ActionsheetListItemData; index: number }) => {
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
    <Actionsheet onClose={onClose} {...resolvedProps}>
      <Actionsheet.Content bg={sheetBgColor}>
        {title && (
          <Text bold fontSize="16" px={4}>
            {title}
          </Text>
        )}
        <FlatList
          data={itemsData}
          renderItem={renderItem}
          width="100%"
          height={300}
        />
      </Actionsheet.Content>
    </Actionsheet>
  );
});
