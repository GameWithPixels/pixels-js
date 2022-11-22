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

// Data of every item that will appear in the actionsheet drawer
export interface ActionSheetItemData {
  label?: string;
  onPress?: (() => void) | null | undefined;
  item?: ReactNode;
}

export interface ActionSheetComponentProps extends IActionsheetProps {
  // Array of items data to display inside classic ActionSheet.item objects
  itemsData?: ActionSheetItemData[];
  sheetBgColor?: ColorType;
  title?: string;
  trigger?: ReactNode;
}

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
        <Actionsheet.Content
          maxHeight="100%"
          height="650px"
          bg={resolvedProps.sheetBgColor}
        >
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
