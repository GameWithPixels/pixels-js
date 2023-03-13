import {
  ActionsheetListItemData,
  FastBox,
  FastBoxProps,
  FastHStack,
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
  ITextProps,
  View,
} from "native-base";
import { IViewProps } from "native-base/lib/typescript/components/basic/View/types";
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
  titleFontSize?: ITextProps["fontSize"];
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

export interface RuleComparisonWidgetProps extends IViewProps {
  title?: string;
  values: string[];
  initialValues: string[];
  buttonBorderWidth?: number;
  buttonFontSize?: ITextProps["fontSize"];
  onChange?: (keys: string[]) => void; // widget.update
}

export function RuleComparisonWidget({
  title,
  values,
  initialValues,
  buttonBorderWidth,
  buttonFontSize,
  onChange,
  ...flexProps
}: RuleComparisonWidgetProps) {
  const [selectedOptions, setSelectedOptions] =
    React.useState<string[]>(initialValues);
  const valuesRef = React.useRef(values);
  React.useEffect(() => {
    // Clear selected options if the list of values changes
    if (values !== valuesRef.current) {
      valuesRef.current = values;
      setSelectedOptions([]);
    }
  }, [values]);
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
      <View {...flexProps}>
        <Text bold>{title}</Text>
        <FastBox mt={2} w="100%">
          {values.length < 4 ? (
            <Button.Group isAttached>
              {values.map((item, i) => (
                <CustomButton
                  key={i}
                  keyIndex={i}
                  itemsLength={values.length - 1}
                  title={item}
                  titleFontSize={buttonFontSize}
                  borderWidth={buttonBorderWidth}
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
      </View>

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
                titleFontSize={buttonFontSize}
                borderWidth={buttonBorderWidth}
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
  conditions: ActionsheetListItemData[];
  title?: string;
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
              {props.title}
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
            {props.conditions.map(({ label, onSelect }, key) => (
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

export interface RuleActionSelectionProps extends FastBoxProps {
  actions: ActionsheetListItemData[];
  title?: string;
}

export function RuleActionSelection({
  actions,
  title,
  ...flexProps
}: RuleActionSelectionProps) {
  const { isOpen, onOpen, onClose } = useDisclose();
  return (
    <>
      <FastHStack alignItems="center" {...flexProps}>
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
              {title}
            </Text>
            <ChevronDownIcon />
          </HView>
        </Pressable>
      </FastHStack>

      <Actionsheet isOpen={isOpen} onClose={onClose}>
        <Actionsheet.Content>
          <ScrollView w="100%">
            {actions.map(({ label, onSelect }, key) => (
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
