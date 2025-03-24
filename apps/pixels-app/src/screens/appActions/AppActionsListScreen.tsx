import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { FlatList, View } from "react-native";
import { Switch, Text } from "react-native-paper";

import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { AppActionsListScreenProps } from "~/app/navigation";
import { AppBackground } from "~/components/AppBackground";
import { RotatingGradientBorderCard } from "~/components/GradientBorderCard";
import { PageHeader } from "~/components/PageHeader";
import { GradientIconButton } from "~/components/buttons";

const AppActionItem = React.memo(function PresetItem({
  uuid,
}: {
  uuid: string;
}) {
  const entry = useAppSelector(
    (state) => state.appActions.entries.entities[uuid]
  );
  return (
    entry && (
      <View>
        <Text>UUID {uuid}</Text>
        <Text>Kind: {entry.kind}</Text>
        <Text>Enabled: {entry.enabled}</Text>
      </View>
    )
  );
});

function AppActionsListPage({
  navigation,
}: {
  navigation: AppActionsListScreenProps["navigation"];
}) {
  const actionsUuids = useAppSelector((state) => state.appActions.entries.ids);
  return (
    <View style={{ height: "100%" }}>
      <PageHeader
        rightElement={() => (
          <GradientIconButton
            icon={(props) => <MaterialCommunityIcons name="plus" {...props} />}
            onPress={
              () => {}
              // navigation.navigate("editAppAction", { presetUuid: "" })
            }
          />
        )}
        onGoBack={() => navigation.goBack()}
      >
        App Actions
      </PageHeader>
      <Text>Global Speak Text settings</Text>
      <Switch
        value={false}
        onValueChange={(value) => {
          console.log("Switch value", value);
        }}
      />
      {actionsUuids.length ? (
        <FlatList
          data={actionsUuids}
          renderItem={({ item: uuid }) => (
            <AppActionItem uuid={uuid as string} />
          )}
          // keyExtractor={(item, index) => index.toString()}
          // alwaysBounceVertical={false}
          contentContainerStyle={{
            paddingVertical: 20,
            paddingHorizontal: 20,
            gap: 20,
          }}
        />
      ) : (
        <RotatingGradientBorderCard
          style={{
            width: "80%",
            marginTop: 20,
            alignSelf: "center",
          }}
          contentStyle={{
            paddingVertical: 40,
            paddingHorizontal: 20,
            gap: 40,
          }}
        >
          <Text variant="titleLarge">App Actions</Text>
          <Text variant="bodyMedium" style={{ alignSelf: "stretch" }}>
            Customize how the app responds to rolls.
          </Text>
          <Text variant="bodyMedium" style={{ alignSelf: "stretch" }}>
            Tap the + button to add a new add action.
          </Text>
        </RotatingGradientBorderCard>
      )}
      {/* <Text>Those settings are stored without encryption!</Text>
        <Text>Discord connection settings</Text>
        <TextInput
          label="Discord URL"
          value={discord.webhookUrl}
          onChangeText={(t) =>
            appDispatch(
              setProfilesDiscordSettings({
                ...discord,
                webhookUrl: t,
              })
            )
          }
        />
        <TextInput
          label="Dice Images URL"
          value={discord.diceImagesUrl}
          onChangeText={(t) =>
            appDispatch(
              setProfilesDiscordSettings({
                ...discord,
                diceImagesUrl: t,
              })
            )
          }
        />
        <Divider style={{ marginVertical: 10 }} />
        <Text>Twitch connection settings</Text>
        <TextInput
          label="Twitch URL"
          value={twitch.url}
          onChangeText={(t) =>
            appDispatch(
              setProfilesTwitchSettings({
                ...twitch,
                url: t,
              })
            )
          }
        />
        <Divider style={{ marginVertical: 10 }} />
        <Text>dddice connection settings</Text>
        <TextInput
          label="API Key"
          value={dddice.apiKey}
          onChangeText={(t) =>
            appDispatch(
              setProfilesThreeDDiceSettings({
                ...dddice,
                apiKey: t,
              })
            )
          }
        />
        <TextInput
          label="Room slug"
          value={dddice.roomSlug}
          onChangeText={(t) =>
            appDispatch(
              setProfilesThreeDDiceSettings({
                ...dddice,
                roomSlug: t,
              })
            )
          }
        />
        <TextInput
          label="Password"
          value={dddice.password}
          onChangeText={(t) =>
            appDispatch(
              setProfilesThreeDDiceSettings({
                ...dddice,
                password: t,
              })
            )
          }
        /> 
        <Divider style={{ marginVertical: 10 }} />
        <Text>Global Speak Text settings</Text>
      */}
    </View>
  );
}

export function AppActionsListScreen({
  navigation,
}: AppActionsListScreenProps) {
  return (
    <AppBackground>
      <AppActionsListPage navigation={navigation} />
    </AppBackground>
  );
}
