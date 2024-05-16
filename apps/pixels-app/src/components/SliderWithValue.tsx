import Slider, { SliderProps } from "@react-native-community/slider";
import { getBorderRadius } from "@systemic-games/react-native-base-components";
import React from "react";
import {
  Platform,
  StyleSheet,
  TextInput as RNTextInput,
  View,
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

// https://stackoverflow.com/a/19722641
function round(value: number, places: number): number {
  return Number(Math.round(Number(value + "e+" + places)) + "e-" + places);
}

function valueToString(
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

function boundsString(
  min?: number,
  max?: number,
  fractionDigits?: number,
  percentage?: boolean
): string {
  const f = fractionDigits;
  const p = percentage;
  return min !== undefined && max !== undefined
    ? ` Between ${valueToString(min, f, p)} And ${valueToString(max, f, p)}`
    : min !== undefined
      ? ` Greater Than ${valueToString(min, f, p)}`
      : max !== undefined
        ? ` Less Than ${valueToString(max, f, p)}`
        : "";
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
  onEndEditing?: (value: number) => void;
}

export function SliderWithValue({
  unit,
  fractionDigits: fDigits,
  percentage,
  onEndEditing,
  ...props
}: SliderWithValueProps) {
  const min = props.minimumValue ?? (percentage ? 0 : undefined);
  const max = props.maximumValue ?? (percentage ? 1 : undefined);
  const [showDialog, setShowDialog] = React.useState(false);
  const inputRef = React.useRef<RNTextInput>(null);
  const [inputValue, setInputValue] = React.useState(
    valueToString(props.value, fDigits, percentage)
  );
  React.useEffect(
    () => setInputValue(valueToString(props.value, fDigits, percentage)),
    [fDigits, percentage, props.value]
  );
  const validateInput = () => {
    const v = stringToValue(inputValue, percentage, min, max);
    props.onValueChange?.(v);
    onEndEditing?.(v);
    setShowDialog(false);
  };
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <View style={{ flexGrow: 1 }}>
        <SliderWrapper
          scaleIOS={1}
          scaleAndroid={1.4}
          height={Platform.OS === "ios" ? 30 : 20}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.onSurfaceDisabled}
          thumbTintColor={colors.onSurface}
          {...props}
          onValueChange={(v) => {
            props.onValueChange?.(v);
            setInputValue(valueToString(v, fDigits, percentage));
          }}
          onSlidingComplete={(v) => {
            props.onSlidingComplete?.(v);
            onEndEditing?.(v);
          }}
        />
      </View>
      <TouchableRipple
        style={{
          width: Math.max(2, fDigits ?? 0) * 20,
          paddingVertical: 8,
          alignItems: "center",
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.onSurface,
          borderRadius,
        }}
        onPress={() => {
          setShowDialog(true);
          // Schedule the focus to the next frame otherwise it won't work
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
      >
        <Text>{inputValue + (percentage ? "%" : unit ?? "")}</Text>
      </TouchableRipple>
      <Portal>
        <Dialog
          visible={showDialog}
          onDismiss={() => {
            validateInput();
            setShowDialog(false);
          }}
        >
          <Dialog.Content style={{ gap: 10 }}>
            <Text variant="bodyMedium">
              Enter a Value
              {boundsString(min, max, fDigits, percentage)}
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
    </View>
  );
}
