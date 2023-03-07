import {
  ActionsheetListItemData,
  FastBox,
  FastHStack,
  FastVStack,
  HView,
  useDisclose,
} from "@systemic-games/react-native-base-components";
import {
  Button,
  Text,
  ChevronDownIcon,
  Actionsheet,
  Spacer,
  Pressable,
  ScrollView,
  IButtonProps,
} from "native-base";
import {
  ColorType,
  SizeType,
} from "native-base/lib/typescript/components/types";
import React from "react";

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
  const onPress = React.useCallback(
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
      <FastVStack>
        <Text bold>{props.title}</Text>
        <FastBox mt={2} w="100%">
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
              <HView
                p={2}
                pl={4}
                w="100%"
                alignItems="center"
                rounded="lg"
                bg="darkBlue.800"
              >
                <FastBox flex={2}>
                  <Text fontSize="sm" flexGrow={1}>
                    {BatteryConditionTitleFromOptions(selectedOptions)}
                  </Text>
                </FastBox>
                <ChevronDownIcon />
              </HView>
            </Pressable>
          )}
        </FastBox>
      </FastVStack>

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
  possibleConditions: ActionsheetListItemData[];
  conditionTitle?: string;
}

export function RuleConditionSelection(props: RuleConditionSelectionProps) {
  const { isOpen, onOpen, onClose } = useDisclose();
  return (
    <>
      <FastHStack w="100%" alignItems="center">
        <Text fontSize="2xl" flex={1}>
          When
        </Text>
        <Pressable flex={2} onPress={onOpen}>
          <HView
            p={3}
            paddingLeft={4}
            w="100%"
            alignItems="center"
            rounded="lg"
            bg="darkBlue.800"
          >
            <Text fontSize="sm" flex={2}>
              {props.conditionTitle}
            </Text>
            <Spacer />
            <FastBox>
              <ChevronDownIcon />
            </FastBox>
          </HView>
        </Pressable>
      </FastHStack>

      <Actionsheet isOpen={isOpen} onClose={onClose}>
        <Actionsheet.Content>
          <ScrollView w="100%">
            {props.possibleConditions.map(({ label, onSelect }, key) => (
              <Actionsheet.Item
                alignItems="center"
                key={key}
                width="100%"
                onPress={() => {
                  onSelect?.(label);
                  onClose();
                }}
              >
                <Text fontSize="md">{label}</Text>
              </Actionsheet.Item>
            ))}
          </ScrollView>
        </Actionsheet.Content>
      </Actionsheet>
    </>
  );
}

export interface RuleActionSelectionProps {
  possibleActions: ActionsheetListItemData[];
  actionTitle?: string;
}

export function RuleActionSelection(props: RuleActionSelectionProps) {
  const { isOpen, onOpen, onClose } = useDisclose();
  return (
    <>
      <FastHStack w="100%" alignItems="center">
        <Text fontSize="2xl" flex={1}>
          Then
        </Text>
        <Pressable flex={2} onPress={onOpen}>
          <HView
            p={2}
            paddingLeft={4}
            w="100%"
            alignItems="center"
            rounded="lg"
            bg="darkBlue.800"
          >
            <Text fontSize="sm" flexGrow={1}>
              {props.actionTitle}
            </Text>
            <ChevronDownIcon />
          </HView>
        </Pressable>
      </FastHStack>

      <Actionsheet isOpen={isOpen} onClose={onClose}>
        <Actionsheet.Content>
          <ScrollView w="100%">
            {props.possibleActions.map(({ label, onSelect }, key) => (
              <Actionsheet.Item
                alignItems="center"
                key={key}
                width="100%"
                onPress={() => {
                  onSelect?.(label);
                  onClose();
                }}
              >
                <Text fontSize="md">{label}</Text>
              </Actionsheet.Item>
            ))}
          </ScrollView>
        </Actionsheet.Content>
      </Actionsheet>
    </>
  );
}
