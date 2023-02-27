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
import React, { useCallback } from "react";

function BatteryConditionTitleFromOptions(selectedButtons: string[]): string {
  const title =
    selectedButtons[0] !== undefined
      ? "Battery is " +
        selectedButtons
          .map((title) => {
            return title;
          })
          .join(" or ")
      : "No actions";
  return title;
}

interface customButtonProps extends IButtonProps {
  title?: string;
  titleFontSize?: number | SizeType;
  keyIndex: number;
  itemsLength: number;
  isSelected: boolean;
  onPress: () => void;
}

function CustomButton(props: customButtonProps) {
  return (
    <Button
      flex={1}
      rounded="none"
      onPress={props.onPress}
      borderRightWidth={
        props.keyIndex === props.itemsLength ? undefined : props.borderWidth
      }
      bg={props.isSelected ? "gray.300" : undefined}
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
  values: string[];
  initialValues: string[];
  bg?: ColorType;
  borderWidth?: number;
  borderColor?: ColorType;
  fontSize?: number | SizeType;
  onChange?: (keys: string[]) => void; // widget.update
  isLeft?: boolean;
  isRight?: boolean;
}

export function RuleComparisonWidget(props: RuleComparisonWidgetProps) {
  const values = props.values;
  const [selectedOptions, setSelectedOptions] = React.useState<string[]>(
    props.initialValues
  );
  const valuesRef = React.useRef(values);
  React.useEffect(() => {
    // Clear selected options if the list of values changes
    if (values !== valuesRef.current) {
      valuesRef.current = values;
      setSelectedOptions([]);
    }
  }, [values]);
  const onChange = props.onChange;
  const onPress = useCallback(
    (item: string) =>
      setSelectedOptions((options) => {
        const index = options.indexOf(item);
        if (index < 0) {
          const newOptions = [...options, item];
          onChange?.(newOptions);
          return newOptions;
        } else {
          const newOptions = [...options];
          newOptions.splice(index, 1);
          onChange?.(newOptions);
          return newOptions;
        }
      }),
    [onChange]
  );
  const { isOpen, onOpen, onClose } = useDisclose();
  return (
    <>
      <VStack>
        <Text>{props.title}</Text>
        <Box w="100%">
          {values.length < 4 ? (
            <Button.Group isAttached>
              {values.map((item, i) => (
                <CustomButton
                  key={i}
                  keyIndex={i}
                  itemsLength={props.values.length - 1}
                  title={item}
                  titleFontSize={props.fontSize}
                  borderWidth={props.borderWidth}
                  isSelected={selectedOptions.includes(item)}
                  onPress={() => onPress(item)}
                />
              ))}
            </Button.Group>
          ) : (
            <Pressable onPress={onOpen}>
              <HStack
                p={3}
                paddingLeft={4}
                w="100%"
                alignItems="center"
                rounded="lg"
                bg="darkBlue.800"
                minH={50}
              >
                <Box flex={2}>
                  <Text fontSize="sm">
                    {BatteryConditionTitleFromOptions(selectedOptions)}
                  </Text>
                </Box>
                <Spacer />
                <Box>
                  <ChevronDownIcon />
                </Box>
              </HStack>
            </Pressable>
          )}
        </Box>
      </VStack>

      <Actionsheet isOpen={isOpen} onClose={onClose}>
        <Actionsheet.Content>
          <ScrollView w="100%">
            {/* {props.possibleConditions.map((condition, key) => (
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
            ))} */}
            {values.map((item, i) => (
              <CustomButton
                key={i}
                keyIndex={i}
                itemsLength={values.length - 1}
                title={item}
                titleFontSize={props.fontSize}
                borderWidth={props.borderWidth}
                isSelected={selectedOptions.includes(item)}
                onPress={() => onPress(item)}
              />
            ))}
          </ScrollView>
        </Actionsheet.Content>
      </Actionsheet>
    </>
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
  return (
    <>
      <HStack h={70} width="100%" alignItems="center">
        <Box flex={1}>
          <Text fontSize="2xl">Then</Text>
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
            <Box flex={8}>
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
