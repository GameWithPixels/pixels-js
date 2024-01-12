import { range } from "@systemic-games/pixels-core-utils";
import { Profiles } from "@systemic-games/react-native-pixels-connect";
import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";

export function KeyframeGradient({
  keyframes,
}: {
  keyframes: readonly Readonly<Profiles.RgbKeyframe>[];
}) {
  return (
    <View style={{ flexDirection: "row", width: "100%", height: "100%" }}>
      {range(keyframes.length - 1).map((i) => {
        const w = 100 * (keyframes[i + 1].time - keyframes[i].time);
        return (
          <LinearGradient
            key={keyframes[i].time}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            colors={[
              keyframes[i].color.toString(),
              keyframes[i + 1].color.toString(),
            ]}
            style={{
              width: `${w}%`,
              height: "100%",
            }}
          />
        );
      })}
    </View>
  );
}
