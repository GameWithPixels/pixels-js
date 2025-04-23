import { MaterialCommunityIcons } from "@expo/vector-icons";
import { assert, assertNever } from "@systemic-games/pixels-core-utils";
import { openURL } from "expo-linking";
import React from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";

import { useAppDispatch, useAppSelector, useAppStore } from "~/app/hooks";
import { EditAppActionScreenProps } from "~/app/navigation";
import { AppStyles } from "~/app/styles";
import { AppBackground } from "~/components/AppBackground";
import { OnOffButton } from "~/components/OnOffButton";
import { PageHeader } from "~/components/PageHeader";
import { SliderWithValue } from "~/components/SliderWithValue";
import { TextInputWithCopyButton } from "~/components/TextInputWithCopyButton";
import { OutlineButton } from "~/components/buttons";
import { AppActionTypeIcon } from "~/components/icons";
import {
  buildWebRequestParams,
  getAppActionTypeLabel,
  playActionMakeWebRequestAsync,
  playActionSpeakText,
  sendToThreeDDiceAsync,
} from "~/features/appActions";
import { authenticate } from "~/features/appActions/ThreeDDiceConnector";
import { getBorderRadius } from "~/features/getBorderRadius";
import {
  AppActionEntry,
  AppActionsData,
  AppActionType,
  enableAppAction,
  removeAppAction,
  updateAppAction,
} from "~/features/store";
import { useConfirmActionSheet } from "~/hooks";

type AppActionMapping = {
  [T in AppActionType]: {
    type: T;
    data: AppActionsData[T];
  };
};

function testAppAction({ type, data }: AppActionMapping[AppActionType]): void {
  switch (type) {
    case "speak":
      playActionSpeakText({ text: "1", ...data });
      break;
    case "url":
    case "json":
    case "discord": {
      const params = buildWebRequestParams(
        // Fake PixelInfo for the web request params
        {
          name: "Pixels",
          currentFace: 1,
          currentFaceIndex: 0,
          pixelId: 12345678,
          ledCount: 20,
          colorway: "onyxBlack",
          dieType: "d20",
          firmwareDate: new Date(),
          rssi: -60,
          batteryLevel: 0.5,
          isCharging: false,
          rollState: "rolled",
        },
        "App Action",
        "1"
      );
      const format =
        type === "url" ? "parameters" : type === "json" ? "json" : "discord";
      playActionMakeWebRequestAsync({ url: data.url, format }, params);
      break;
    }
    case "twitch":
      throw new Error("Not implemented");
    case "dddice":
      sendToThreeDDiceAsync(data, {
        // Fake PixelInfo for the web request params
        die: {
          name: "Pixels",
          currentFace: 1,
          currentFaceIndex: 0,
          pixelId: 12345678,
          ledCount: 20,
          colorway: "onyxBlack",
          dieType: "d20",
          firmwareDate: new Date(),
          rssi: -60,
          batteryLevel: 0.5,
          isCharging: false,
          rollState: "rolled",
        },
        value: 1,
      });
      break;
    case "proxy":
      throw new Error("Not implemented");
    default:
      assertNever(type, `Unknown app action type: ${type}`);
  }
}

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
  const [code, updateCode] = React.useState<string | undefined>(undefined);
  if (data.apiKey) {
    return (
      <>
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
          value={data.theme}
          onChangeText={(theme) => updateData({ theme })}
        >
          Theme (optional)
        </TextInputWithTitle>
        <NotEncryptedWarning />
      </>
    );
  } else if (code) {
    return (
      <>
        <Text>Your Code:</Text>
        <Text style={[AppStyles.textCentered]} variant="titleLarge">
          {code}
        </Text>
        <Button
          onPress={() => {
            openURL("https://dddice.com/activate");
          }}
        >
          Open DDDice page
        </Button>
      </>
    );
  } else {
    return (
      <>
        <Text>You need to authorize your Pixels App on DDDice.</Text>
        <Button
          onPress={() => {
            authenticate(
              (code) => {
                updateCode(code);
              },
              (apiKey) => updateData({ apiKey })
            );
          }}
        >
          Authorize
        </Button>
      </>
    );
  }
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

export function AppActionOnOffButton({ uuid }: { uuid: string }) {
  const dispatch = useAppDispatch();
  const enabled = useAppSelector(
    (state) => state.appActions.entries.entities[uuid]?.enabled
  );
  const { colors, roundness } = useTheme();
  const borderRadius = getBorderRadius(roundness, { tight: true });
  return (
    <OnOffButton
      enabled={enabled}
      style={{
        alignSelf: "center",
        justifyContent: "center",
        aspectRatio: 1,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius,
        borderColor: enabled ? colors.primary : colors.onSurfaceDisabled,
        backgroundColor: colors.background,
      }}
      onPress={() => {
        dispatch(enableAppAction({ uuid, enabled: !enabled }));
      }}
    />
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
  const store = useAppStore();

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

  const showConfirmDelete = useConfirmActionSheet("Delete App Action", () => {
    store.dispatch(removeAppAction(uuid));
    // Navigation will automatically go back
  });

  const { colors } = useTheme();
  return (
    <View style={{ height: "100%" }}>
      <PageHeader onGoBack={() => navigation.goBack()}>
        {`Configure ${getAppActionTypeLabel(type)} Action`}
      </PageHeader>
      <ScrollView
        alwaysBounceVertical={false}
        contentContainerStyle={{
          paddingBottom: 10,
          paddingHorizontal: 10,
          gap: 10,
        }}
      >
        <AppActionTypeIcon
          appActionType={type}
          size={48}
          color={colors.onSurface}
          style={AppStyles.selfCentered}
        />
        <AppActionOnOffButton uuid={uuid} />
        <View style={{ gap: 5 }}>
          <ConfigureAction uuid={uuid} />
        </View>
        <View style={{ marginTop: 20, gap: 20 }}>
          <OutlineButton
            onPress={() => {
              const type =
                store.getState().appActions.entries.entities[uuid]?.type;
              const data = type && store.getState().appActions.data[type][uuid];
              if (type && data) {
                testAppAction(
                  // @ts-ignore
                  { type, data }
                );
              }
            }}
          >
            Test App Action
          </OutlineButton>
          <OutlineButton
            style={{ backgroundColor: colors.errorContainer }}
            onPress={() => showConfirmDelete()}
          >
            Delete
          </OutlineButton>
        </View>
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
