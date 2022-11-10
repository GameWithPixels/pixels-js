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
import React from "react";

// Data of every item that will appear in the actionsheet drawer
export interface ActionSheetItemData {
  label: string;
  // onPress?: ((event: GestureResponderEvent) => void) | null | undefined;
  onPress?: (() => void) | null | undefined;
}

export interface ActionSheetComponentProps extends IActionsheetProps {
  // Array of items to display
  itemsData?: ActionSheetItemData[];
  sheetBgColor?: ColorType;
  title?: string;
  trigger?: JSX.Element;
  triggerLabel?: string;
}

export function ActionSheet(props: ActionSheetComponentProps) {
  const resolvedProps = usePropsResolution(
    "ActionSheet",
    props
  ) as ActionSheetComponentProps;
  const { isOpen, onOpen, onClose } = useDisclose();
  return (
    <>
      {/* <Button onPress={onOpen}>
        <Text>{resolvedProps.triggerLabel}</Text>
      </Button> */}
      <Pressable onPress={onOpen}>
        <Center>{resolvedProps.trigger}</Center>
      </Pressable>
      <Actionsheet {...resolvedProps} onClose={onClose} isOpen={isOpen}>
        <Actionsheet.Content bg={resolvedProps.sheetBgColor}>
          <Box w="100%" h={60} px={4}>
            <Text bold fontSize="16">
              {resolvedProps.title}
            </Text>
          </Box>
          <ScrollView width="full" height={300}>
            {props.itemsData?.map((item, i) => (
              <Actionsheet.Item
                bg={resolvedProps.sheetBgColor}
                key={i}
                onPress={() => {
                  if (item.onPress) item.onPress();
                  onClose();
                }}
              >
                {item.label}
              </Actionsheet.Item>
            ))}
          </ScrollView>
        </Actionsheet.Content>
      </Actionsheet>
    </>
  );
}
