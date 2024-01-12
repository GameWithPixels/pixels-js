import Slider, { SliderProps } from "@react-native-community/slider";
import { getBorderRadius } from "@systemic-games/react-native-base-components";
import { Platform, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

type SliderWrapperProps = SliderProps & {
  scaleIOS: number;
  scaleAndroid: number;
  height: number;
};

function SliderWrapper({ style, ...props }: SliderWrapperProps) {
  const { scaleIOS, scaleAndroid, height } = props;
  const widthIOS = 100 * (1 / scaleIOS);
  const widthAndroid = 100 * (1 / scaleAndroid);
  return (
    <View style={{ width: "100%", height }}>
      <View
        style={{
          height,
          marginHorizontal: Platform.OS === "android" ? -15 : 0, // TODO negative margin to account for the scaling
          transform: [
            { scaleX: Platform.OS === "ios" ? scaleIOS : scaleAndroid },
            { scaleY: Platform.OS === "ios" ? scaleIOS : scaleAndroid },
          ],
        }}
      >
        <Slider
          style={[
            {
              flex: 1,
              height,
              width: `${Platform.OS === "ios" ? widthIOS : widthAndroid}%`,
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

export function SliderWithTitle({
  title,
  unit,
  fractionDigits,
  ...props
}: { title?: string; unit?: string; fractionDigits?: number } & SliderProps) {
  const { colors } = useTheme();
  return (
    <>
      {title && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text>{title}</Text>
          <Text>
            {(props.value ?? 0).toFixed(fractionDigits) + (unit ?? "")}
          </Text>
        </View>
      )}
      <SliderWrapper
        scaleIOS={1}
        scaleAndroid={1.2}
        height={Platform.OS === "ios" ? 30 : 20}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.onSurfaceDisabled}
        thumbTintColor={colors.onSurface}
        {...props}
      />
    </>
  );
}

export interface SliderWithValueProps extends SliderProps {
  unit?: string;
  fractionDigits?: number;
}

export function SliderWithValue({
  unit,
  fractionDigits,
  ...props
}: SliderWithValueProps) {
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <View style={{ flexGrow: 1 }}>
        <SliderWrapper
          scaleIOS={1}
          scaleAndroid={1.2}
          height={Platform.OS === "ios" ? 30 : 20}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.onSurfaceDisabled}
          thumbTintColor={colors.onSurface}
          {...props}
        />
      </View>
      <View
        style={{
          width: Math.max(2, fractionDigits ?? 0) * 20,
          paddingVertical: 10,
          alignItems: "center",
          borderWidth: 1,
          borderColor: colors.outline,
          borderRadius,
        }}
      >
        <Text>{(props.value ?? 0).toFixed(fractionDigits) + (unit ?? "")}</Text>
      </View>
    </View>
  );
}
