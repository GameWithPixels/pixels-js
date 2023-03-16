import {
  FastBox,
  FastBoxProps,
  FastButton,
  FastButtonProps,
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
  IActionsheetProps,
  View,
} from "native-base";
import React from "react";

function BatteryConditionTitleFromOptions(selectedButtons: string[]): string {
  const title = selectedButtons.length
    ? "Battery is " +
      selectedButtons
        .map((title) => {
          return title;
        })
        .join(" or ")
    : "No actions";
  return title;
}

interface SelectableButtonProps extends FastButtonProps {
  title: string;
  isSelected: boolean;
  onSelect: (title: string) => void;
}

const SelectableButton = React.memo(function ({
  title,
  isSelected,
  onSelect,
  ...props
}: SelectableButtonProps) {
  const onPress = React.useCallback(() => onSelect(title), [onSelect, title]);
  return (
    <FastButton
      flex={1}
      {...props}
      onPress={onPress}
      bg={isSelected ? "gray.300" : undefined}
    >
      {title}
    </FastButton>
  );
});

export interface ItemData {
  title?: string;
  onPress?: (() => void) | null | undefined;
}

export interface BitFieldWidgetProps extends FastBoxProps {
  title?: string;
  values: string[];
  initialValues: string[];
  onValuesChange?: (keys: string[]) => void; // widget.update
}

export function BitFieldWidget({
  title,
  values,
  initialValues,
  onValuesChange,
  ...flexProps
}: BitFieldWidgetProps) {
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
  const onSelect = React.useCallback(
    (item: string) =>
      setSelectedOptions((options) => {
        const index = options.indexOf(item);
        if (index < 0) {
          const newOptions = [...options, item];
          onValuesChange?.(newOptions);
          return newOptions;
        } else {
          const newOptions = [...options];
          newOptions.splice(index, 1);
          onValuesChange?.(newOptions);
          return newOptions;
        }
      }),
    [onValuesChange]
  );
  const { isOpen, onOpen, onClose } = useDisclose();
  return (
    <>
      <FastVStack {...flexProps}>
        <Text bold>{title}</Text>
        <FastBox mt={2} w="100%">
          {values.length < 4 ? (
            <Button.Group isAttached>
              {values.map((item) => (
                <SelectableButton
                  key={item}
                  title={item}
                  isSelected={selectedOptions.includes(item)}
                  onSelect={onSelect}
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
        onSelect={onSelect}
        isOpen={isOpen}
        onClose={onClose}
      />
    </>
  );
}

function RuleComparisonActionsheet({
  values,
  selectedOptions,
  onSelect,
  ...props
}: Pick<BitFieldWidgetProps, "values"> & {
  selectedOptions: string[];
  onSelect: (item: string) => void;
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
          {values.map((item) => (
            <SelectableButton
              key={item}
              title={item}
              isSelected={selectedOptions.includes(item)}
              onSelect={onSelect}
            />
          ))}
        </ScrollView>
      </Actionsheet.Content>
    </Actionsheet>
  );
}
