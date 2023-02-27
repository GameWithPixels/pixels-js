import {
  Actionsheet,
  Button,
  HStack,
  Input,
  ScrollView,
  Text,
  VStack,
  useDisclose,
} from "native-base";
import React from "react";

export interface UserTextSelectionProps {
  title?: string; // Text displayed above the input
  textSize?: string | number; // | SizeType;
  space?: number | string; // Spacing between text and toggle
  value?: string | undefined;
  onValueChange?: (valueOrUuid: string) => void;
  availableTexts?: string[];
}

export function UserTextSelection(props: UserTextSelectionProps) {
  const { isOpen, onOpen, onClose } = useDisclose();
  const sortedTexts = React.useMemo(
    () => [...new Set(props?.availableTexts)].sort(),
    [props.availableTexts]
  );
  return (
    <>
      <VStack space={props.space ?? 3}>
        <Text fontSize={props.textSize}>{props.title}</Text>
        <HStack space={3}>
          <Input
            flex={1}
            bg="pixelColors.highlightGray"
            variant="filled"
            placeholder="Type Text"
            placeholderTextColor="gray.400"
            value={props.value}
            onChangeText={props.onValueChange}
          />
          {!!sortedTexts.length && <Button onPress={onOpen}>...</Button>}
        </HStack>
      </VStack>

      {/* Actionsheet drawer */}
      <Actionsheet isOpen={isOpen} onClose={onClose} alignContent="center">
        <Actionsheet.Content maxH="100%" h={600}>
          <Text bold paddingBottom={5}>
            Available Texts
          </Text>
          <ScrollView>
            <HStack flexWrap="wrap" w="100%">
              {sortedTexts.map((text) => (
                <Actionsheet.Item
                  alignItems="center"
                  key={text}
                  width="100%"
                  onPress={() => {
                    props.onValueChange?.(text);
                    onClose();
                  }}
                >
                  <Text fontSize="md">{text}</Text>
                </Actionsheet.Item>
              ))}
            </HStack>
          </ScrollView>
        </Actionsheet.Content>
      </Actionsheet>
    </>
  );
}
