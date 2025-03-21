import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { FlatList, ScrollView, View } from "react-native";
import { Button, Divider, Text, TextInput, useTheme } from "react-native-paper";

import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { PresetsScreenProps } from "~/app/navigation";
import { AppBackground } from "~/components/AppBackground";
import {
  GradientBorderCard,
  RotatingGradientBorderCard,
} from "~/components/GradientBorderCard";
import { PageHeader } from "~/components/PageHeader";
import { GradientIconButton } from "~/components/buttons";

function MyTextInput() {
  return <TextInput />;
}

const PresetItem = React.memo(function PresetItem({ uuid }: { uuid: string }) {
  const data = useAppSelector(
    (state) => state.profilePresets.webRequests.entities[uuid]
  );
  return (
    <View>
      <Text>UUID {uuid}</Text>
      <Text>Name: {data?.name}</Text>
    </View>
  );
});

function ThemesPage({
  navigation,
}: {
  navigation: PresetsScreenProps["navigation"];
}) {
  const appDispatch = useAppDispatch();
  // const { discord, twitch, dddice } = useAppSelector(
  //   (state) => state.appSettings.profiles
  // );
  const presetsUuids = useAppSelector(
    (state) => state.profilePresets.webRequests.ids
  );
  return (
    <View style={{ height: "100%" }}>
      <PageHeader
        rightElement={() => (
          <GradientIconButton
            icon={({ color, size }) => (
              <MaterialCommunityIcons name="plus" size={size} color={color} />
            )}
            onPress={() =>
              navigation.navigate("editPreset", {
                presetUuid: "",
              })
            }
          />
        )}
        onGoBack={() => navigation.goBack()}
      >
        Presets
      </PageHeader>
      {presetsUuids.length ? (
        <FlatList
          data={presetsUuids}
          renderItem={({ item: uuid }) => <PresetItem uuid={uuid} />}
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
          <Text variant="titleLarge">No Preset</Text>
          <Text variant="bodyMedium" style={{ alignSelf: "stretch" }}>
            Click the + button to add a new preset
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

export function PresetsScreen({ navigation }: PresetsScreenProps) {
  return (
    <AppBackground>
      <ThemesPage navigation={navigation} />
    </AppBackground>
  );
}
