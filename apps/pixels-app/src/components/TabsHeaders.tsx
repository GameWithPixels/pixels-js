import { getBorderRadius } from "@systemic-games/react-native-pixels-components";
import { View } from "react-native";
import { useTheme } from "react-native-paper";

import { GradientButton } from "./buttons";

export function TabsHeaders({
  names,
  selected,
  onSelect,
}: {
  names: string[];
  selected?: string;
  onSelect?: (name: string) => void;
}) {
  const { roundness } = useTheme();
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
          <GradientButton
            key={n}
            style={{
              borderTopLeftRadius: i === 0 ? borderRadius : 0,
              borderBottomLeftRadius: i === 0 ? borderRadius : 0,
              borderTopRightRadius: i === names.length - 1 ? borderRadius : 0,
              borderBottomRightRadius:
                i === names.length - 1 ? borderRadius : 0,
            }}
            outline={n !== selected}
            onPress={() => onSelect?.(n)}
          >
            {n}
          </GradientButton>
        );
      })}
    </View>
  );
}
