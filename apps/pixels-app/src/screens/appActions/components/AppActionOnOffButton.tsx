import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";
import { Text, TouchableRipple } from "react-native-paper";

import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { enableAppAction } from "~/features/store";

export function AppActionOnOffButton({
  uuid,
  color,
}: {
  uuid: string;
  color: string;
}) {
  const dispatch = useAppDispatch();
  const enabled = useAppSelector(
    (state) => state.appActions.entries.entities[uuid]?.enabled
  );
  return (
    <TouchableRipple
      onPress={() => {
        dispatch(enableAppAction({ uuid, enabled: !enabled }));
      }}
    >
      <View
        style={{
          paddingVertical: 5,
          paddingHorizontal: 10,
          alignItems: "center",
          width: 70,
        }}
      >
        <MaterialCommunityIcons
          name={enabled ? "power" : "power-off"}
          size={32}
          color={color}
        />
        <Text variant="bodySmall" style={{}}>
          {enabled ? "enabled" : "disabled"}
        </Text>
      </View>
    </TouchableRipple>
  );
}
