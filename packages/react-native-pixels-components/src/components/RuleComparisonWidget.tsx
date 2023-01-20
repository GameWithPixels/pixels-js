import { ActionSheetItemData } from "@systemic-games/react-native-base-components";
import {
  Box,
  Button,
  VStack,
  Text,
  HStack,
  ChevronDownIcon,
  Actionsheet,
  Spacer,
  useDisclose,
  Pressable,
  ScrollView,
  IButtonProps,
} from "native-base";
import {
  ColorType,
  SizeType,
} from "native-base/lib/typescript/components/types";
import React from "react";

interface customButtonProps extends IButtonProps {
  title?: string;
  titleFontSize?: number | SizeType;
  keyIndex: number;
  itemsLength: number;
  onButtonPress?: (() => void) | null | undefined;
}
function CustomButton(props: customButtonProps) {
  const [isSelected, setIselected] = React.useState(false);
  return (
    <Button
      flex={1}
      rounded="none"
      onPress={() => {
        props.onButtonPress?.();
        setIselected(!isSelected);
      }}
      borderRightWidth={
        props.keyIndex === props.itemsLength ? undefined : props.borderWidth
      }
      bg={isSelected ? "gray.300" : undefined}
    >
      <Text fontSize={props.titleFontSize}>{props.title}</Text>
    </Button>
  );
}

export interface ItemData {
  title?: string;
  onPress?: (() => void) | null | undefined;
}

export interface RuleComparisonWidgetProps {
  title?: string;
  values: any;
  bg?: ColorType;
  borderWidth?: number;
  borderColor?: ColorType;
  fontSize?: number | SizeType;
  onPress?: (() => void) | null | undefined;
  onSelected?: (value: number) => void;
}
//TODO fix the way the component is updated when selection are made to work with the bitfield update function (not array of boolean)
export function RuleComparisonWidget(props: RuleComparisonWidgetProps) {
  const valueTitles = Object.keys(props.values);
  const selectedButtons = Array(valueTitles.length).fill(false);
  const [selectedOption, setSelectedOption] =
    React.useState<boolean[]>(selectedButtons);

  return (
    <VStack>
      <Text>{props.title}</Text>
      <Box w="100%">
        <Button.Group isAttached>
          {valueTitles.map((item, key) => (
            <CustomButton
              key={key}
              keyIndex={key}
              itemsLength={valueTitles.length - 1}
              title={item}
              titleFontSize={props.fontSize}
              borderWidth={props.borderWidth}
              onButtonPress={() => {
                selectedOption[key] = !selectedOption[key];
                setSelectedOption(selectedOption);
                // const maskValue = combine(selectedOption);
                // props.onPress?.(maskValue);
              }}
            />
          ))}
        </Button.Group>
      </Box>
    </VStack>
  );
}

export interface RuleConditionSelectionProps {
  possibleConditions: ActionSheetItemData[];
  conditionTitle?: string;
}
export function RuleConditionSelection(props: RuleConditionSelectionProps) {
  const { isOpen, onOpen, onClose } = useDisclose();
  const title = "When";

  return (
    <>
      <HStack h={70} width="100%" alignItems="center">
        <Box flex={1}>
          <Text fontSize="2xl">{title}</Text>
        </Box>
        <Pressable flex={2} onPress={onOpen}>
          <HStack
            p={3}
            paddingLeft={4}
            w="100%"
            alignItems="center"
            rounded="lg"
            bg="darkBlue.800"
          >
            <Box flex={2}>
              <Text fontSize="sm">{props.conditionTitle}</Text>
            </Box>
            <Spacer />
            <Box>
              <ChevronDownIcon />
            </Box>
          </HStack>
        </Pressable>
      </HStack>

      <Actionsheet isOpen={isOpen} onClose={onClose}>
        <Actionsheet.Content>
          <ScrollView w="100%">
            {props.possibleConditions.map((condition, key) => (
              <Actionsheet.Item
                alignItems="center"
                key={key}
                width="100%"
                onPress={() => {
                  condition.onPress?.();
                  onClose();
                }}
              >
                <Text fontSize="md">{condition.label}</Text>
              </Actionsheet.Item>
            ))}
          </ScrollView>
        </Actionsheet.Content>
      </Actionsheet>
    </>
  );
}

export interface RuleActionSelectionProps {
  possibleActions: ActionSheetItemData[];
  actionTitle?: string;
}
export function RuleActionSelection(props: RuleActionSelectionProps) {
  const { isOpen, onOpen, onClose } = useDisclose();
  const title = "Then";

  return (
    <>
      <HStack h={70} width="100%" alignItems="center">
        <Box flex={1}>
          <Text fontSize="2xl">{title}</Text>
        </Box>
        <Pressable flex={2} onPress={onOpen}>
          <HStack
            p={3}
            paddingLeft={4}
            w="100%"
            alignItems="center"
            rounded="lg"
            bg="darkBlue.800"
          >
            <Box flex={2}>
              <Text fontSize="sm">{props.actionTitle}</Text>
            </Box>
            <Spacer />
            <Box>
              <ChevronDownIcon />
            </Box>
          </HStack>
        </Pressable>
      </HStack>

      <Actionsheet isOpen={isOpen} onClose={onClose}>
        <Actionsheet.Content>
          <ScrollView w="100%">
            {props.possibleActions.map((actionTitle, key) => (
              <Actionsheet.Item
                alignItems="center"
                key={key}
                width="100%"
                onPress={() => {
                  actionTitle.onPress?.();
                  onClose();
                }}
              >
                <Text fontSize="md">{actionTitle.label}</Text>
              </Actionsheet.Item>
            ))}
          </ScrollView>
        </Actionsheet.Content>
      </Actionsheet>
    </>
  );
}
