import { assertNever } from "@systemic-games/pixels-core-utils";
import React from "react";
import { StyleSheet, View } from "react-native";
import {
  Divider,
  Text,
  TouchableRippleProps,
  useTheme,
} from "react-native-paper";

import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { OnOffButton } from "~/components/OnOffButton";
import { TouchableCard } from "~/components/TouchableCard";
import { AppActionTypeIcon } from "~/components/icons";
import { getAppActionTypeLabel } from "~/features/appActions";
import {
  AppActionsData,
  AppActionType,
  enableAppAction,
} from "~/features/store";
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
} & Omit<
  TouchableRippleProps,
  "children" | "style" | "contentStyle" | "onPress"
>) {
  const dispatch = useAppDispatch();
  const actionType = useAppSelector(
    (state) => state.appActions.entries.entities[uuid]?.type
  );
  const enabled = useAppSelector(
    (state) => state.appActions.entries.entities[uuid]?.enabled
  );
  const { colors } = useTheme();
  return (
    actionType && (
      <TouchableCard
        row
        thinBorder
        gradientBorder={enabled ? "bright" : "dark"}
        contentStyle={{ padding: 0, overflow: "hidden" }}
        onPress={onPressAction ? () => onPressAction(uuid) : undefined}
        {...props}
      >
        <View
          style={{
            flexDirection: "row",
            flexGrow: 1,
            flexShrink: 1,
            marginLeft: 20,
            alignItems: "center",
          }}
        >
          <AppActionTypeIcon
            appActionType={actionType}
            size={36}
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
        </View>
        <Divider style={{ width: StyleSheet.hairlineWidth, height: "100%" }} />
        <OnOffButton
          enabled={enabled}
          style={{ paddingVertical: 10 }}
          onPress={() => {
            dispatch(enableAppAction({ uuid, enabled: !enabled }));
          }}
        />
      </TouchableCard>
    )
  );
});
