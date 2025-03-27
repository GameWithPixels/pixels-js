import { MaterialCommunityIcons } from "@expo/vector-icons";
import { assert, assertNever } from "@systemic-games/pixels-core-utils";
import React from "react";
import { Platform, ScrollView, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

import { AppActionOnOffButton } from "./components/AppActionOnOffButton";

import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { EditAppActionScreenProps } from "~/app/navigation";
import { AppStyles } from "~/app/styles";
import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import { SliderWithValue } from "~/components/SliderWithValue";
import { TextInputWithCopyButton } from "~/components/TextInputWithCopyButton";
import { OutlineButton } from "~/components/buttons";
import { AppActionTypeIcon } from "~/components/icons";
import { getAppActionTypeLabel } from "~/features/profiles";
import {
  AppActionEntry,
  AppActionsData,
  AppActionType,
  updateAppAction,
} from "~/features/store";

function NotEncryptedWarning() {
  const { colors } = useTheme();
  return (
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
  );
}

function TextInputWithTitle({
  children,
  ...props
}: React.PropsWithChildren<
  React.ComponentProps<typeof TextInputWithCopyButton>
>) {
  return (
    <>
      <Text variant="titleMedium">{children}</Text>
      <TextInputWithCopyButton {...props} />
    </>
  );
}

function SliderWithValueAndTitle({
  children,
  ...props
}: React.ComponentProps<typeof SliderWithValue>) {
  return (
    <>
      <Text variant="titleMedium">{children}</Text>
      <SliderWithValue {...props} />
    </>
  );
}

function useAppActionData<T extends AppActionType>(
  uuid: string,
  type: T
): {
  data: AppActionsData[T];
  updateData: (data: Partial<AppActionsData[T]>) => void;
} {
  const dispatch = useAppDispatch();
  const updateData = (data: Partial<AppActionsData[T]>) => {
    dispatch(updateAppAction({ uuid, type, data }));
  };
  const data = useAppSelector((state) => state.appActions.data[type][uuid]);
  assert(data, `${type} action data with uuid=${uuid} not found`);
  return { data, updateData };
}

function ConfigureSpeakAction({ uuid }: { uuid: string }) {
  const { data, updateData } = useAppActionData(uuid, "speak");
  const { colors } = useTheme();
  return (
    <>
      {/* Volume control not yet available in expo-speech 12.0.2
      <SliderWithValueAndTitle
        minimumValue={0}
        maximumValue={1}
        step={0.01}
        percentage
        value={data.volume}
        onEndEditing={(pitch) => updateData({ volume })}
      >
        Volume
      </SliderWithValueAndTitle> */}
      <SliderWithValueAndTitle
        minimumValue={0}
        maximumValue={2}
        step={0.01}
        percentage
        value={data.pitch}
        onEndEditing={(pitch) => updateData({ pitch })}
      >
        Voice Pitch
      </SliderWithValueAndTitle>
      <SliderWithValueAndTitle
        minimumValue={0}
        maximumValue={2}
        step={0.01}
        percentage
        value={data.rate}
        onEndEditing={(rate) => updateData({ rate })}
      >
        Voice Rate
      </SliderWithValueAndTitle>
      {Platform.OS === "android" && (
        <Text style={{ color: colors.onSurfaceDisabled, marginVertical: 5 }}>
          Only works if you have Google Play on your device.{"\n"}
          You may need to enable "Text-to-Speech" or "TalkBack" in your device
          settings.
        </Text>
      )}
    </>
  );
}

function ConfigureUrlAction({ uuid }: { uuid: string }) {
  const { data, updateData } = useAppActionData(uuid, "url");
  return (
    <>
      <TextInputWithTitle
        value={data.url}
        onChangeText={(url) => updateData({ url })}
      >
        URL
      </TextInputWithTitle>
    </>
  );
}

function ConfigureJsonAction({ uuid }: { uuid: string }) {
  const { data, updateData } = useAppActionData(uuid, "json");
  return (
    <>
      <TextInputWithTitle
        value={data.url}
        onChangeText={(url) => updateData({ url })}
      >
        URL
      </TextInputWithTitle>
    </>
  );
}

function ConfigureDiscordAction({ uuid }: { uuid: string }) {
  const { data, updateData } = useAppActionData(uuid, "discord");
  return (
    <>
      <TextInputWithTitle
        value={data.url}
        onChangeText={(url) => updateData({ url })}
      >
        Webhook URL
      </TextInputWithTitle>
      <TextInputWithTitle
        value={data.diceImagesUrl}
        onChangeText={(diceImagesUrl) => updateData({ diceImagesUrl })}
      >
        Dice Images URL (optional)
      </TextInputWithTitle>
    </>
  );
}

function ConfigureTwitchAction({ uuid }: { uuid: string }) {
  const { data, updateData } = useAppActionData(uuid, "twitch");
  return (
    <>
      <TextInputWithTitle
        value={data.url}
        onChangeText={(url) => updateData({ url })}
      >
        URL
      </TextInputWithTitle>
      <NotEncryptedWarning />
    </>
  );
}

function ConfigureThreeDDiceAction({ uuid }: { uuid: string }) {
  const { data, updateData } = useAppActionData(uuid, "dddice");
  return (
    <>
      <TextInputWithTitle
        value={data.apiKey}
        onChangeText={(apiKey) => updateData({ apiKey })}
      >
        API Key
      </TextInputWithTitle>
      <TextInputWithTitle
        value={data.roomSlug}
        onChangeText={(roomSlug) => updateData({ roomSlug })}
      >
        Room Slug
      </TextInputWithTitle>
      <TextInputWithTitle
        value={data.password}
        onChangeText={(password) => updateData({ password })}
      >
        Password (optional)
      </TextInputWithTitle>
      <TextInputWithTitle
        value={data.userUuid}
        onChangeText={(userUuid) => updateData({ userUuid })}
      >
        User UUID (optional)
      </TextInputWithTitle>
      <NotEncryptedWarning />
    </>
  );
}

function ConfigureProxyAction({ uuid }: { uuid: string }) {
  const { data, updateData } = useAppActionData(uuid, "proxy");
  return (
    <>
      <TextInputWithTitle
        value={data.apiKey}
        onChangeText={(apiKey) => updateData({ apiKey })}
      >
        API Key
      </TextInputWithTitle>
      <NotEncryptedWarning />
    </>
  );
}

function EditAppActionPage({
  appActionUuid: uuid,
  appActionType: type,
  navigation,
}: {
  appActionUuid: AppActionEntry["uuid"];
  appActionType: AppActionEntry["type"];
  navigation: EditAppActionScreenProps["navigation"];
}) {
  const ConfigureAction = (() => {
    switch (type) {
      case "speak":
        return ConfigureSpeakAction;
      case "url":
        return ConfigureUrlAction;
      case "json":
        return ConfigureJsonAction;
      case "discord":
        return ConfigureDiscordAction;
      case "twitch":
        return ConfigureTwitchAction;
      case "dddice":
        return ConfigureThreeDDiceAction;
      case "proxy":
        return ConfigureProxyAction;
      default:
        assertNever(type, `Unknown app action type: ${type}`);
    }
  })();

  const { colors } = useTheme();
  return (
    <View style={{ height: "100%" }}>
      <PageHeader onGoBack={() => navigation.goBack()}>
        {`Configure ${getAppActionTypeLabel(type)} Action`}
      </PageHeader>
      <ScrollView
        alwaysBounceVertical={false}
        contentContainerStyle={{
          paddingVertical: 20,
          paddingHorizontal: 20,
          gap: 20,
        }}
      >
        <AppActionTypeIcon
          appActionType={type}
          size={48}
          color={colors.onSurface}
          style={AppStyles.selfCentered}
        />
        <View style={AppStyles.selfCentered}>
          <AppActionOnOffButton uuid={uuid} color={colors.onSurface} />
        </View>
        <View style={{ gap: 5 }}>
          <ConfigureAction uuid={uuid} />
        </View>
        <OutlineButton
          onPress={() => {
            //playActionSpeakText({text: "1", ...actionData });
          }}
        >
          Test
        </OutlineButton>
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
        <EditAppActionPage
          appActionUuid={appActionUuid}
          appActionType={appActionType}
          navigation={navigation}
        />
      </AppBackground>
    )
  );
}
