import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, View } from "react-native";
import { Text, TextInput, useTheme } from "react-native-paper";

import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { EditAppActionScreenProps } from "~/app/navigation";
import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import { OutlineButton } from "~/components/buttons";
import { AppActionKindIcon } from "~/components/icons";
import { AppActionEntry } from "~/features/store";

function EditAppActionPage({
  appAction,
  navigation,
}: {
  appAction: AppActionEntry;
  navigation: EditAppActionScreenProps["navigation"];
}) {
  const appDispatch = useAppDispatch();
  const { uuid, kind } = appAction;
  const data = useAppSelector((state) => state.appActions.data[kind][uuid]);
  const { colors } = useTheme();
  return (
    <View style={{ height: "100%" }}>
      <PageHeader onGoBack={() => navigation.goBack()}>
        Edit App Action
      </PageHeader>
      <ScrollView
        alwaysBounceVertical={false}
        contentContainerStyle={{
          paddingVertical: 20,
          paddingHorizontal: 20,
          gap: 20,
        }}
      >
        <AppActionKindIcon
          actionKind={appAction?.kind}
          size={48}
          color={colors.onSurface}
          style={{ alignSelf: "center" }}
        />
        {kind === "url" ? (
          <>
            <Text>URL Settings</Text>
            <TextInput
              label="URL"
              value={data.url}
              onChangeText={(t) =>
                appDispatch(
                  setProfilesDiscordSettings({
                    ...discord,
                    webhookUrl: t,
                  })
                )
              }
            />
          </>
        ) : kind === "json" ? (
          <></>
        ) : kind === "discord" ? (
          <>
            <Text>Discord connection settings</Text>
            <TextInput
              label="Discord URL"
              value={data.webhookUrl}
              onChangeText={(t) =>
                appDispatch(
                  setProfilesDiscordSettings({
                    ...data,
                    webhookUrl: t,
                  })
                )
              }
            />
            <TextInput
              label="Dice Images URL"
              value={data.diceImagesUrl}
              onChangeText={(t) =>
                appDispatch(
                  setProfilesDiscordSettings({
                    ...data,
                    diceImagesUrl: t,
                  })
                )
              }
            />
          </>
        ) : kind === "twitch" ? (
          <>
            <Text>Twitch connection settings</Text>
            <TextInput
              label="Twitch URL"
              value={data.url}
              onChangeText={(t) =>
                appDispatch(
                  setProfilesTwitchSettings({
                    ...data,
                    url: t,
                  })
                )
              }
            />
          </>
        ) : kind === "dddice" ? (
          <>
            <Text>dddice connection settings</Text>
            <TextInput
              label="API Key"
              value={data.apiKey}
              onChangeText={(t) =>
                appDispatch(
                  setProfilesThreeDDiceSettings({
                    ...data,
                    apiKey: t,
                  })
                )
              }
            />
            <TextInput
              label="Room slug"
              value={data.roomSlug}
              onChangeText={(t) =>
                appDispatch(
                  setProfilesThreeDDiceSettings({
                    ...data,
                    roomSlug: t,
                  })
                )
              }
            />
            <TextInput
              label="Password"
              value={data.password}
              onChangeText={(t) =>
                appDispatch(
                  setProfilesThreeDDiceSettings({
                    ...data,
                    password: t,
                  })
                )
              }
            />
          </>
        ) : null}
        <View
          style={{
            flexDirection: "row",
            marginVertical: 5,
            alignItems: "center",
            gap: 10,
          }}
        >
          <MaterialCommunityIcons
            name="information"
            size={16}
            color={colors.onPrimary}
          />
          <Text variant="bodySmall" style={{ marginVertical: 10 }}>
            Those settings are stored without encryption.
          </Text>
        </View>
        <OutlineButton onPress={() => {}}>Test Connection</OutlineButton>
      </ScrollView>
    </View>
  );
}

export function EditAppActionScreen({
  route: {
    params: { appActionUuid },
  },
  navigation,
}: EditAppActionScreenProps) {
  const appAction = useAppSelector(
    (state) => state.appActions.entries.entities[appActionUuid]
  );
  React.useEffect(() => {
    if (!appAction) {
      navigation.goBack();
    }
  }, [appAction, navigation]);
  return (
    appAction && (
      <AppBackground>
        <EditAppActionPage appAction={appAction} navigation={navigation} />
      </AppBackground>
    )
  );
}
