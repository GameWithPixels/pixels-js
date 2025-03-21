import React from "react";
import { ScrollView, View } from "react-native";
import { Divider, Text, TextInput } from "react-native-paper";

import { useAppDispatch } from "~/app/hooks";
import { EditPresetScreenProps } from "~/app/navigation";
import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";

function MyTextInput() {
  return <TextInput />;
}

function EditPresetPage({
  presetUuid,
  navigation,
}: {
  presetUuid: string;
  navigation: EditPresetScreenProps["navigation"];
}) {
  const appDispatch = useAppDispatch();
  const { discord, twitch, dddice } = {
    discord: {
      webhookUrl: "",
      diceImagesUrl: "",
    },
    twitch: {
      url: "",
    },
    dddice: {
      apiKey: "",
      roomSlug: "",
      password: "",
    },
  };
  return (
    <View style={{ height: "100%" }}>
      <PageHeader onGoBack={() => navigation.goBack()}>Edit Preset</PageHeader>
      <ScrollView
        alwaysBounceVertical={false}
        contentContainerStyle={{
          paddingVertical: 20,
          paddingHorizontal: 20,
          gap: 20,
        }}
      >
        <Text>Those settings are stored without encryption!</Text>
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
      </ScrollView>
    </View>
  );
}

export function EditPresetScreen({
  route: {
    params: { presetUuid },
  },
  navigation,
}: EditPresetScreenProps) {
  return (
    <AppBackground>
      <EditPresetPage presetUuid={presetUuid} navigation={navigation} />
    </AppBackground>
  );
}
