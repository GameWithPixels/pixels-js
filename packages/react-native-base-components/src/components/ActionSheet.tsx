import {
  Actionsheet,
  Box,
  IActionsheetProps,
  Text,
  ScrollView,
  usePropsResolution,
  useDisclose,
  Pressable,
  Center,
} from "native-base";
import { ColorType } from "native-base/lib/typescript/components/types";
import React, { ReactNode } from "react";

/**
 * Data of every item that will appear in the Actionsheet drawer.
 * @param label text/title/label of the Actionsheet.item
 * @param item item object as any type of ReactNode to replace default Actionsheet.item
 * @param onPress function executed the Actionsheet.item or custom item is pressed
 */
export interface ActionSheetItemData {
  label?: string; // text/title/label of the item
  onPress?: (() => void) | null | undefined; // function executed the item is pressed
  item?: ReactNode; // the item object as any type of ReactNode to replace default Actionsheet.item
}

/**
 * Props for {@link ActionSheet} component.
 */
export interface ActionSheetComponentProps extends IActionsheetProps {
  itemsData?: ActionSheetItemData[]; // Array of items data to display inside classic ActionSheet.item objects
  sheetBgColor?: ColorType;
  title?: string;
  trigger?: ReactNode; // object as any type of ReactNode that will be used as the actionsheet trigger for opening it
}

/**
 * ActionSheet drawer component. Can be triggered by any given component and display default Actionsheet.items or custom children.
 * @param props See {@link ActionSheetComponentProps} for props parameters.
 */
export function ActionSheet(props: ActionSheetComponentProps) {
  const resolvedProps = usePropsResolution(
    "ActionSheet",
    props
  ) as ActionSheetComponentProps;
  const { isOpen, onOpen, onClose } = useDisclose();
  return (
    <>
      <Pressable onPress={onOpen}>
        <Center>{resolvedProps.trigger}</Center>
      </Pressable>
      <Actionsheet
        {...resolvedProps}
        onClose={onClose}
        isOpen={isOpen}
        maxHeight="100%"
      >
        <Actionsheet.Content maxHeight="100%" bg={resolvedProps.sheetBgColor}>
          <Box w="100%" px={4}>
            <Text bold fontSize="16">
              {resolvedProps.title}
            </Text>
          </Box>
          <ScrollView width="full" height={300}>
            {props.itemsData?.map((itemData, i) =>
              !itemData.item ? (
                <Actionsheet.Item
                  bg={resolvedProps.sheetBgColor}
                  key={i}
                  onPress={() => {
                    itemData.onPress?.();
                    onClose();
                  }}
                >
                  {itemData.label}
                </Actionsheet.Item>
              ) : (
                <Pressable
                  key={i}
                  onPress={() => {
                    itemData.onPress?.();
                    onClose();
                  }}
                >
                  {itemData.item}
                </Pressable>
              )
            )}
          </ScrollView>
        </Actionsheet.Content>
      </Actionsheet>
    </>
  );
}
