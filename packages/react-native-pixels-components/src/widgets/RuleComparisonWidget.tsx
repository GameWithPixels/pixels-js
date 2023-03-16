import {
  FastBox,
  FastBoxProps,
  FastVStack,
  useDisclose,
} from "@systemic-games/react-native-base-components";
import {
  Button,
  Text,
  ChevronDownIcon,
  Actionsheet,
  Pressable,
  ScrollView,
  IButtonProps,
  ITextProps,
  IActionsheetProps,
  View,
} from "native-base";
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

export interface RuleComparisonWidgetProps extends FastBoxProps {
  title?: string;
  values: string[];
  initialValues: string[];
  onValuesChange?: (keys: string[]) => void; // widget.update
}

export function RuleComparisonWidget({
  title,
  values,
  initialValues,
  onValuesChange: onChange,
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
      <FastVStack {...flexProps}>
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
                  isSelected={selectedOptions.includes(item)}
                  onPress={() => onPress(item)}
                />
              ))}
            </Button.Group>
          ) : (
            <Pressable onPress={onOpen}>
              <View
                flexDir="row"
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
              </View>
            </Pressable>
          )}
        </FastBox>
      </FastVStack>

      <RuleComparisonActionsheet
        values={values}
        selectedOptions={selectedOptions}
        onPress={onPress}
        isOpen={isOpen}
        onClose={onClose}
      />
    </>
  );
}

function RuleComparisonActionsheet({
  values,
  selectedOptions,
  onPress,
  ...props
}: Pick<RuleComparisonWidgetProps, "values"> & {
  selectedOptions: string[];
  onPress: (item: string) => void;
} & IActionsheetProps) {
  return (
    <Actionsheet {...props}>
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
              isSelected={selectedOptions.includes(item)}
              onPress={() => onPress(item)}
            />
          ))}
        </ScrollView>
      </Actionsheet.Content>
    </Actionsheet>
  );
}
