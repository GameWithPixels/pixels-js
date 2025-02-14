import Slider, { SliderProps } from "@react-native-community/slider";
import React from "react";
import {
  Platform,
  StyleSheet,
  TextInput as RNTextInput,
  View,
  StyleProp,
  ViewStyle,
} from "react-native";
import {
  Button,
  Dialog,
  Portal,
  Text,
  TextInput,
  TouchableRipple,
  useTheme,
} from "react-native-paper";
import { ViewProps } from "react-native-svg/lib/typescript/fabric/utils";

import { getBorderRadius } from "~/features/getBorderRadius";

// https://stackoverflow.com/a/19722641
function round(value: number, places: number): number {
  return Number(Math.round(Number(value + "e+" + places)) + "e-" + places);
}

function numberToString(
  value?: number,
  fractionDigits?: number,
  percentage?: boolean
): string {
  const v = value && percentage ? value * 100 : value;
  return v !== undefined ? round(v, fractionDigits ?? 0).toString() : "";
}

function stringToValue(
  str: string,
  percentage?: boolean,
  min?: number,
  max?: number
): number {
  let v = parseFloat(str);
  if (percentage) v /= 100;
  if (min !== undefined) v = Math.max(min, v);
  if (max !== undefined) v = Math.min(max, v);
  return v;
}

export function getValueBoundsMessage(
  min?: number,
  max?: number,
  fractionDigits?: number,
  percentage?: boolean
): string {
  const f = fractionDigits;
  const p = percentage;
  return min !== undefined && max !== undefined
    ? ` Between ${numberToString(min, f, p)} And ${numberToString(max, f, p)}`
    : min !== undefined
      ? ` Greater Than ${numberToString(min, f, p)}`
      : max !== undefined
        ? ` Less Than ${numberToString(max, f, p)}`
        : "";
}

export interface NumberInputWithDialogHandle {
  updateValue: (v: number) => void;
}

export function NumberInputButton({
  button,
  value,
  unit,
  fDigits,
  percentage,
  minimumValue,
  maximumValue,
  onEndEditing,
}: {
  button: (props: { label: string; onPress: () => void }) => React.ReactNode;
  value?: number;
  unit?: string;
  fDigits?: number;
  percentage?: boolean;
  minimumValue?: number;
  maximumValue?: number;
  onEndEditing?: (value: number) => void;
} & ViewProps) {
  const min = minimumValue ?? (percentage ? 0 : undefined);
  const max = maximumValue ?? (percentage ? 1 : undefined);
  const [showDialog, setShowDialog] = React.useState(false);
  const inputRef = React.useRef<RNTextInput>(null);
  const valueToString = React.useCallback(
    (v?: number) => numberToString(v, fDigits, percentage),
    [fDigits, percentage]
  );
  const [inputValue, setInputValue] = React.useState(valueToString(value));
  React.useEffect(
    () => setInputValue(() => valueToString(value)),
    [value, valueToString]
  );
  const validateInput = () => {
    const v = stringToValue(inputValue, percentage, min, max);
    if (!isNaN(v)) {
      setInputValue(valueToString(v));
      onEndEditing?.(v);
    }
    setShowDialog(false);
  };
  return (
    <>
      {button({
        label: valueToString(value) + (percentage ? "%" : (unit ?? "")),
        onPress: () => {
          setInputValue(valueToString(value));
          setShowDialog(true);
          // Schedule the focus to the next frame otherwise it won't work
          setTimeout(() => inputRef.current?.focus(), 0);
        },
      })}
      <Portal>
        <Dialog visible={showDialog} onDismiss={() => validateInput()}>
          <Dialog.Content style={{ gap: 10 }}>
            <Text variant="bodyMedium">
              Enter a Value
              {getValueBoundsMessage(min, max, fDigits, percentage)}
            </Text>
            <TextInput
              ref={inputRef}
              mode="outlined"
              dense
              keyboardType={fDigits ? "decimal-pad" : "number-pad"}
              value={inputValue}
              onChangeText={setInputValue}
              onEndEditing={validateInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={validateInput}>Done</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

type SliderWrapperProps = SliderProps & {
  scaleIOS: number;
  scaleAndroid: number;
  height: number;
};

// Slider with bigger thumb for easier touch
function SliderWrapper({ style, ...props }: SliderWrapperProps) {
  const { scaleIOS, scaleAndroid, height } = props;
  const scale = Platform.OS === "ios" ? scaleIOS : scaleAndroid;
  return (
    <View style={{ width: "100%", height }}>
      <View
        style={{
          height,
          marginHorizontal: Platform.OS === "android" ? -15 : 0, // TODO negative margin to account for the scaling
          transform: [{ scaleX: scale }, { scaleY: scale }],
        }}
      >
        <Slider
          style={[
            {
              flex: 1,
              height,
              width: `${
                100 * (1 / (Platform.OS === "ios" ? scaleIOS : scaleAndroid))
              }%`,
              alignSelf: "center",
            },
            style,
          ]}
          {...props}
        />
      </View>
    </View>
  );
}

export interface SliderWithValueProps extends SliderProps {
  unit?: string;
  fractionDigits?: number;
  percentage?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  onEndEditing?: (value: number) => void;
}

export function SliderWithValue({
  unit,
  fractionDigits: fDigits,
  percentage,
  onEndEditing,
  style,
  contentStyle,
  ...props
}: SliderWithValueProps) {
  const [inputValue, setInputValue] = React.useState(props.value);
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  return (
    <View
      style={[{ flexDirection: "row", alignItems: "center", gap: 20 }, style]}
    >
      <View style={{ flexGrow: 1 }}>
        <SliderWrapper
          scaleIOS={1}
          scaleAndroid={1.4}
          height={Platform.OS === "ios" ? 30 : 20}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.onSurfaceDisabled}
          thumbTintColor={colors.onSurface}
          style={contentStyle}
          onValueChange={(v) => {
            setInputValue(v);
            props.onValueChange?.(v);
          }}
          onSlidingComplete={(v) => {
            setInputValue(v);
            props.onSlidingComplete?.(v);
            onEndEditing?.(v);
          }}
          {...props}
        />
      </View>
      <NumberInputButton
        value={inputValue}
        unit={unit}
        fDigits={fDigits}
        percentage={percentage}
        minimumValue={props.minimumValue}
        maximumValue={props.maximumValue}
        onEndEditing={(v) => {
          setInputValue(v);
          v !== props.value && props.onValueChange?.(v);
          onEndEditing?.(v);
        }}
        button={({ label, onPress }) => (
          <TouchableRipple
            style={[
              {
                width: Math.max(2, fDigits ?? 0) * 20,
                paddingVertical: 8,
                alignItems: "center",
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: colors.onSurface,
                borderRadius,
              },
              style,
            ]}
            onPress={onPress}
          >
            <Text numberOfLines={1}>{label}</Text>
          </TouchableRipple>
        )}
      />
    </View>
  );
}
