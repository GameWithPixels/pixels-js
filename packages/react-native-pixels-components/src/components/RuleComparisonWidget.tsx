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
  items: ItemData[];
  bg?: ColorType;
  borderWidth?: number;
  borderColor?: ColorType;
  fontSize?: number | SizeType;
}

export function RuleComparisonWidget(props: RuleComparisonWidgetProps) {
  const selectedButtons = Array(props.items.length).fill(false);
  const [selectedOption, setSelectedOption] =
    React.useState<boolean[]>(selectedButtons);

  return (
    <VStack>
      <Text>{props.title}</Text>
      <Box w="100%">
        <Button.Group isAttached>
          {props.items.map((item, key) => (
            <CustomButton
              key={key}
              keyIndex={key}
              itemsLength={props.items.length - 1}
              title={item.title}
              titleFontSize={props.fontSize}
              borderWidth={props.borderWidth}
              onButtonPress={() => {
                item.onPress?.();
                selectedOption[key] = !selectedOption[key];
                setSelectedOption(selectedOption);
              }}
            />
          ))}
        </Button.Group>
      </Box>
    </VStack>
  );
}

export interface RuleConditionSelectionProps {
  //Temporary
  conditions: string[];
  conditionIndex: number;
  widgetIndexInList: number;
}

export function RuleConditionSelection(props: RuleConditionSelectionProps) {
  const [condition, _setCondition] = React.useState(
    props.conditions[props.conditionIndex]
  );
  const { isOpen, onOpen, onClose } = useDisclose();
  let title = "When";
  if (props.widgetIndexInList === 0) {
    title = "When";
  } else if (props.widgetIndexInList === 1) {
    title = "Then";
  } else {
    title = "And";
  }

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
              <Text fontSize="sm">{condition}</Text>
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
            {props.conditions.map((condition, key) => (
              <Actionsheet.Item alignItems="center" key={key} width="100%">
                <Text fontSize="md">{condition}</Text>
              </Actionsheet.Item>
            ))}
          </ScrollView>
        </Actionsheet.Content>
      </Actionsheet>
    </>
  );
}
