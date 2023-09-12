import { useActionSheet } from "@expo/react-native-action-sheet";
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
export interface ActionsheetListProps {
  itemsData: ActionsheetListItemData[]; // Text to display on each item and action to call
  visible: boolean;
  onClose: () => void;
  title?: string;
  // sheetBgColor?: IActionsheetItemProps["bg"];
}

/**
 * ActionSheet drawer component.
 * @param props See {@link ActionsheetListProps} for props parameters.
 */
export function ActionsheetList({
  itemsData,
  visible,
  onClose,
  title,
}: ActionsheetListProps) {
  const { showActionSheetWithOptions } = useActionSheet();
  const showActionSheet = React.useCallback(() => {
    const options = itemsData.map((i) => i.label);
    showActionSheetWithOptions(
      {
        title,
        options,
        cancelButtonIndex: options.length - 1,
        // bg={ sheetBgColor }
      },
      (index?: number) => {
        const item = itemsData[index ?? -1];
        if (item) {
          item.onSelect?.(item.label);
          onClose?.();
        }
      }
    );
  }, [itemsData, onClose, showActionSheetWithOptions, title]);
  React.useEffect(() => {
    if (visible) {
      showActionSheet();
    }
  }, [visible, showActionSheet]);
  return <></>;
}
