import { getBorderRadius } from "@systemic-games/react-native-pixels-components";
import { View } from "react-native";
import { useTheme } from "react-native-paper";

import { GradientButton } from "./buttons";

export function TabsHeaders<T extends string>({
  names,
  selected,
  onSelect,
}: {
  names: readonly T[];
  selected?: T;
  onSelect?: (name: T) => void;
}) {
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  return (
    <View
      style={{
        alignSelf: "center",
        flexDirection: "row",
        justifyContent: "flex-start",
      }}
    >
      {names.map((n, i) => {
        return (
          // FIX Linear gradient border radius doesn't work properly on iOS
          // so we use a View with a border instead
          <View
            key={n}
            style={{
              flex: 1,
              borderColor: n !== selected ? colors.outline : "transparent",
              borderWidth: 1,
              borderLeftWidth: i > 0 ? 1 : 0,
              borderRightWidth: i === names.length - 1 ? 1 : 0,
              borderRadius,
              borderTopLeftRadius: i === 0 ? borderRadius : 0,
              borderBottomLeftRadius: i === 0 ? borderRadius : 0,
              borderTopRightRadius: i === names.length - 1 ? borderRadius : 0,
              borderBottomRightRadius:
                i === names.length - 1 ? borderRadius : 0,
              overflow: "hidden",
            }}
          >
            <GradientButton
              outline={n !== selected}
              sentry-label={"tab-" + n.toLocaleLowerCase().replace(" ", "-")}
              labelStyle={{ marginLeft: 0, marginRight: 0 }}
              style={{
                borderWidth: 0,
                borderRadius,
                borderTopLeftRadius: i === 0 ? borderRadius : 0,
                borderBottomLeftRadius: i === 0 ? borderRadius : 0,
                borderTopRightRadius: i === names.length - 1 ? borderRadius : 0,
                borderBottomRightRadius:
                  i === names.length - 1 ? borderRadius : 0,
              }}
              onPress={() => onSelect?.(n)}
            >
              {n}
            </GradientButton>
          </View>
        );
      })}
    </View>
  );
}
