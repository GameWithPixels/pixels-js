import { View } from "react-native";

import { GradientChip } from "./buttons";

export function TabsHeaders<T extends string>({
  keys,
  names,
  selected,
  onSelect,
}: {
  keys: readonly T[];
  names?: readonly string[];
  selected?: T;
  onSelect?: (key: T) => void;
}) {
  return (
    <View
      style={{
        alignSelf: "center",
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 10,
      }}
    >
      {keys.map((k, i) => {
        return (
          <GradientChip
            key={k}
            outline={k !== selected}
            sentry-label={"tab-" + k.toLocaleLowerCase().replace(" ", "-")}
            onPress={() => onSelect?.(k)}
          >
            {names?.at(i) ?? k}
          </GradientChip>
        );
      })}
    </View>
  );
}
