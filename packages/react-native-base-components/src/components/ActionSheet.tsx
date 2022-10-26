import {
  Actionsheet,
  Box,
  IActionsheetProps,
  Text,
  ScrollView,
  usePropsResolution,
  Button,
  useDisclose,
} from "native-base";
import React from "react";

// Data of every item that will appear in the actionsheet drawer
export interface ActionSheetItemData {
  triggerLabel: string;
  label: string;
  // onPress?: ((event: GestureResponderEvent) => void) | null | undefined;
  onPress?: () => void | null | undefined;
}

export interface ActionSheetComponentProps extends IActionsheetProps {
  // Array of items to display
  itemsData?: ActionSheetItemData[];
  title?: string;
}

export function ActionSheetComponent(props: ActionSheetComponentProps) {
  const resolvedProps = usePropsResolution("BaseActionsheet", props);
  const { isOpen, onOpen, onClose } = useDisclose();
  return (
    <>
      <Button onPress={onOpen} />
      <Actionsheet {...resolvedProps} onClose={onClose} isOpen={isOpen}>
        <Actionsheet.Content>
          <Box w="100%" h={60} px={4}>
            <Text bold fontSize="16">
              {resolvedProps.title}
            </Text>
          </Box>
          <ScrollView width="full" height={200}>
            {props.itemsData?.map((item, i) => (
              <Actionsheet.Item key={i} onPress={item.onPress}>
                {item.label}
              </Actionsheet.Item>
            ))}
          </ScrollView>
        </Actionsheet.Content>
      </Actionsheet>
    </>
  );
}
