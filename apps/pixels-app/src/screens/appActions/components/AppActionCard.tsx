import { assertNever } from "@systemic-games/pixels-core-utils";
import React from "react";
import { View } from "react-native";
import { Text, TouchableRippleProps, useTheme } from "react-native-paper";

import { AppActionOnOffButton } from "./AppActionOnOffButton";

import { useAppSelector } from "~/app/hooks";
import { TouchableCard } from "~/components/TouchableCard";
import { AppActionTypeIcon } from "~/components/icons";
import { getAppActionTypeLabel } from "~/features/appActions";
import { AppActionsData, AppActionType } from "~/features/store";
import { getUrlShortText, toPercentText } from "~/features/utils";

type AppActionMapping = {
  [T in AppActionType]: {
    type: T;
    data: AppActionsData[T];
  };
};

function getAppActionShortDescription({
  type,
  data,
}: AppActionMapping[AppActionType]): string {
  switch (type) {
    case "speak":
      return `Pitch: ${toPercentText(data.pitch)}, Rate: ${toPercentText(data.rate)}`;
    case "url":
    case "json":
    case "discord":
    case "twitch":
      return getUrlShortText(data.url);
    case "dddice":
      return `Room: ${data.roomSlug}`;
    case "proxy":
      return data.provider;
    default:
      assertNever(type, `Unknown app action type: ${type}`);
  }
}

function AppActionShortDescription({ uuid }: { uuid: string }) {
  const type = useAppSelector(
    (state) => state.appActions.entries.entities[uuid]?.type
  );
  const data = useAppSelector(
    (state) => type && state.appActions.data[type][uuid]
  );
  return (
    type &&
    data && (
      <Text variant="bodySmall">
        {getAppActionShortDescription(
          // @ts-ignore
          { type, data }
        )}
      </Text>
    )
  );
}

export const AppActionCard = React.memo(function AppActionCard({
  uuid,
  onPressAction,
  ...props
}: {
  uuid: string;
  onPressAction?: (uuid: string) => void;
} & Omit<TouchableRippleProps, "children" | "style" | "onPress">) {
  const actionType = useAppSelector(
    (state) => state.appActions.entries.entities[uuid]?.type
  );
  const { colors } = useTheme();
  return (
    actionType && (
      <TouchableCard
        row
        gradientBorder="bright"
        thinBorder
        contentStyle={{ paddingLeft: 20 }}
        onPress={onPressAction ? () => onPressAction(uuid) : undefined}
        {...props}
      >
        <AppActionTypeIcon
          appActionType={actionType}
          size={42}
          color={colors.onSurface}
        />
        <View
          style={{ flexGrow: 1, flexShrink: 1, alignItems: "center", gap: 5 }}
        >
          <Text variant="titleMedium" numberOfLines={1}>
            {getAppActionTypeLabel(actionType)}
          </Text>
          <AppActionShortDescription uuid={uuid} />
        </View>
        <AppActionOnOffButton uuid={uuid} color={colors.onSurface} />
      </TouchableCard>
    )
  );
});
