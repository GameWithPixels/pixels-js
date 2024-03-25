import { range } from "@systemic-games/pixels-core-utils";
import { Color, Profiles } from "@systemic-games/react-native-pixels-connect";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { View } from "react-native";

export function KeyframeGradient({
  keyframes: kf,
}: {
  keyframes: readonly Readonly<Profiles.RgbKeyframe>[];
}) {
  const keyframes = React.useMemo(() => {
    const has0 = kf[0].time === 0;
    const has1 = kf[kf.length - 1].time === 1;
    if (has0 && has1) {
      return kf;
    } else {
      const keyframes = [...kf];
      if (!has0) {
        keyframes.unshift(
          new Profiles.RgbKeyframe({ time: 0, color: Color.black })
        );
      }
      if (!has1) {
        keyframes.push(
          new Profiles.RgbKeyframe({ time: 1, color: Color.black })
        );
      }
      return keyframes;
    }
  }, [kf]);
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
