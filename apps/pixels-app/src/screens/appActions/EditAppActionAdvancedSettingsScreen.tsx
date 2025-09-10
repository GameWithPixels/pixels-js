import { assertNever } from "@systemic-games/pixels-core-utils";
import React from "react";
import { ScrollView, View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";

import { PairedDie } from "~/app/PairedDie";
import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { EditAppActionAdvancedSettingsScreenProps } from "~/app/navigation";
import { AppStyles } from "~/app/styles";
import { AppBackground } from "~/components/AppBackground";
import { DDDiceThemesBottomSheet } from "~/components/DDDiceThemesBottomSheet";
import { GradientBorderCard } from "~/components/GradientBorderCard";
import { PageHeader } from "~/components/PageHeader";
import { AppActionTypeIcon, DieWireframe } from "~/components/icons";
import { getAppActionTypeLabel } from "~/features/appActions";
import { getDDDiceRoomConnection } from "~/features/appActions/DDDiceRoomConnection";
import { AppActionEntry, updateDDDiceAppActionTheme } from "~/features/store";
import { useAppConnections } from "~/hooks";

function PixelThemeSelector({
  pairedDie,
  themeName,
  onSelectTheme,
}: {
  pairedDie: PairedDie;
  themeName?: string;
  onSelectTheme: () => void;
}) {
  return (
    <GradientBorderCard
      contentStyle={{ flexDirection: "row", padding: 10, gap: 10 }}
    >
      <DieWireframe dieType={pairedDie.dieType ?? "unknown"} size={60} />
      <View style={{ flex: 1, justifyContent: "center", gap: 5 }}>
        <Text variant="titleMedium" style={{ alignSelf: "center" }}>
          {pairedDie.name}
        </Text>
        <Button mode="outlined" onPress={onSelectTheme}>
          {themeName ?? "Select Theme"}
        </Button>
      </View>
    </GradientBorderCard>
  );
}

function ConfigureThreeDDiceAction({ uuid }: { uuid: AppActionEntry["uuid"] }) {
  const dispatch = useAppDispatch();
  const data = useAppSelector((state) => state.appActions.data["dddice"][uuid]);
  const pairedDice = useAppSelector((state) => state.pairedDice.paired);
  const connections = useAppConnections();
  const conn = getDDDiceRoomConnection(connections, uuid, data.apiKey);

  const [selection, setSelection] = React.useState<{
    pixelId: number;
    themeId?: string;
  }>();

  return (
    <>
      {pairedDice.map((p) => (
        <PixelThemeSelector
          key={p.pixelId}
          pairedDie={p}
          themeName={data.themes[p.pixelId]?.name}
          onSelectTheme={() => {
            const id = data.themes[p.pixelId]?.id;
            setSelection({ pixelId: p.pixelId, themeId: id });
          }}
        />
      ))}
      <DDDiceThemesBottomSheet
        dddiceConnection={conn}
        themeId={selection?.themeId}
        visible={!!selection}
        onDismiss={() => setSelection(undefined)}
        onSelectTheme={(theme) => {
          setSelection(undefined);
          selection &&
            dispatch(
              updateDDDiceAppActionTheme({
                uuid,
                pixelId: selection.pixelId,
                themeId: theme.id,
                themeName: theme.name ?? "(no name)",
              })
            );
        }}
      />
    </>
  );
}

function EditAppActionAdvancedSettingsPage({
  appActionUuid: uuid,
  appActionType: type,
  navigation,
}: {
  appActionUuid: AppActionEntry["uuid"];
  appActionType: AppActionEntry["type"];
  navigation: EditAppActionAdvancedSettingsScreenProps["navigation"];
}) {
  const { title, ConfigureAction } = (() => {
    switch (type) {
      case "speak":
      case "url":
      case "json":
      case "discord":
      case "twitch":
      case "proxy":
        return { title: "", ConfigureAction: null };
      case "dddice":
        return {
          title: "Assigned dddice Theme(s)",
          ConfigureAction: ConfigureThreeDDiceAction,
        };
      default:
        assertNever(type, `Unknown app action type: ${type}`);
    }
  })();
  React.useEffect(() => {
    if (!ConfigureAction) {
      navigation.goBack();
    }
  }, [ConfigureAction, navigation]);

  const { colors } = useTheme();
  return (
    <View style={{ height: "100%" }}>
      <PageHeader onGoBack={() => navigation.goBack()}>
        {title ?? `${getAppActionTypeLabel(type)} Advanced Settings`}
      </PageHeader>
      <ScrollView
        alwaysBounceVertical={false}
        contentContainerStyle={{
          paddingBottom: 10,
          paddingHorizontal: 10,
          gap: 20,
        }}
      >
        <AppActionTypeIcon
          appActionType={type}
          size={48}
          color={colors.onSurface}
          style={AppStyles.selfCentered}
        />
        {ConfigureAction && <ConfigureAction uuid={uuid} />}
      </ScrollView>
    </View>
  );
}

export function EditAppActionAdvancedSettingsScreen({
  route: {
    params: { appActionUuid },
  },
  navigation,
}: EditAppActionAdvancedSettingsScreenProps) {
  const appActionType = useAppSelector(
    (state) => state.appActions.entries.entities[appActionUuid]?.type
  );
  React.useEffect(() => {
    if (!appActionType) {
      navigation.goBack();
    }
  }, [appActionType, navigation]);
  return (
    appActionType && (
      <AppBackground>
        <EditAppActionAdvancedSettingsPage
          appActionUuid={appActionUuid}
          appActionType={appActionType}
          navigation={navigation}
        />
      </AppBackground>
    )
  );
}
