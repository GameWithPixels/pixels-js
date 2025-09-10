import { MaterialCommunityIcons } from "@expo/vector-icons";
import { assert, assertNever } from "@systemic-games/pixels-core-utils";
import { useForceUpdate } from "@systemic-games/pixels-react";
import { openURL } from "expo-linking";
import React from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import { ActivityIndicator, Text, useTheme } from "react-native-paper";

import { useAppDispatch, useAppSelector, useAppStore } from "~/app/hooks";
import { EditAppActionScreenProps } from "~/app/navigation";
import { AppStyles } from "~/app/styles";
import { AppBackground } from "~/components/AppBackground";
import { CopyToClipboardButton } from "~/components/CopyToClipboardButton";
import { DDDiceRoomSlugsBottomSheet } from "~/components/DDDiceRoomSlugsBottomSheet";
import { OnOffButton } from "~/components/OnOffButton";
import { PageHeader } from "~/components/PageHeader";
import { SliderWithValue } from "~/components/SliderWithValue";
import { TextInputWithCopyButton } from "~/components/TextInputWithCopyButton";
import { GradientButton, OutlineButton } from "~/components/buttons";
import { AppActionTypeIcon } from "~/components/icons";
import { getAppActionTypeLabel } from "~/features/appActions";
import { getDDDiceRoomConnection } from "~/features/appActions/DDDiceRoomConnection";
import { ThreeDDiceConnector } from "~/features/appActions/ThreeDDiceConnector";
import {
  AppActionTypeAndData,
  playAppAction,
} from "~/features/appActions/playAppAction";
import { getBorderRadius } from "~/features/getBorderRadius";
import {
  AppActionEntry,
  AppActionsData,
  AppActionType,
  enableAppAction,
  removeAppAction,
  updateAppAction,
} from "~/features/store";
import { generateUuid } from "~/features/utils";
import { useAppConnections, useConfirmActionSheet } from "~/hooks";

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
        Those settings are stored without using encryption.
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

function ConfigureOrAuthorizeThreeDDiceAction({
  uuid,
  onOpenAdvancedSettings,
}: {
  uuid: string;
  onOpenAdvancedSettings: () => void;
}) {
  const { data, updateData } = useAppActionData(uuid, "dddice");
  return data.apiKey ? (
    <ConfigureThreeDDiceAction
      uuid={uuid}
      data={data}
      updateData={updateData}
      onOpenAdvancedSettings={onOpenAdvancedSettings}
    />
  ) : (
    <AuthorizeOnDDDice onAPIKeyReceived={(apiKey) => updateData({ apiKey })} />
  );
}

function ConfigureThreeDDiceAction({
  uuid,
  data,
  updateData,
  onOpenAdvancedSettings,
}: {
  uuid: string;
  data: AppActionsData["dddice"];
  updateData: (data: Partial<AppActionsData["dddice"]>) => void;
  onOpenAdvancedSettings: () => void;
}) {
  const [showSelectRoomSlug, setShowSelectRoomSlug] = React.useState(false);
  const connections = useAppConnections();
  const conn = getDDDiceRoomConnection(connections, uuid, data.apiKey);

  return (
    <>
      <Text variant="titleMedium">Room Slug</Text>
      <OutlineButton
        style={{ marginHorizontal: 10 }}
        onPress={() => setShowSelectRoomSlug(true)}
      >
        {data.roomSlug.length ? data.roomSlug : "Tap To Select"}
      </OutlineButton>
      <TextInputWithTitle
        value={data.password}
        onChangeText={(password) => updateData({ password })}
      >
        Password (optional)
      </TextInputWithTitle>
      <OutlineButton
        style={{ margin: 10, marginTop: 20 }}
        onPress={onOpenAdvancedSettings}
      >
        Assign Theme(s)
      </OutlineButton>
      <OutlineButton
        style={{ margin: 10 }}
        onPress={() => updateData({ apiKey: "" })}
      >
        Regenerate Activation Code
      </OutlineButton>
      <NotEncryptedWarning />
      <DDDiceRoomSlugsBottomSheet
        dddiceConnection={conn}
        roomSlug={data.roomSlug}
        visible={showSelectRoomSlug}
        onDismiss={() => setShowSelectRoomSlug(false)}
        onSelectRoomSlug={(roomSlug) => {
          updateData({ roomSlug });
          setShowSelectRoomSlug(false);
        }}
      />
    </>
  );
}

function AuthorizeOnDDDice({
  onAPIKeyReceived,
}: {
  onAPIKeyReceived: (apiKey: string) => void;
}) {
  const [response, updateResponse] = React.useState<
    { code: string; expiresAt: Date } | Error
  >();
  const valid = response && !(response instanceof Error);
  const activeTaskRef = React.useRef<string>("");
  React.useEffect(() => {
    if (!response) {
      const task = async () => {
        // Generate a new UUID for this instance of the task
        const active = generateUuid();
        try {
          activeTaskRef.current = active;
          const { code, expiresAt, getAPIKeyPromise } =
            await ThreeDDiceConnector.authorizeAsync();
          // If the task is still active, update with code + date
          if (activeTaskRef.current === active) {
            updateResponse({ code, expiresAt });
            const apiKey = await getAPIKeyPromise;
            if (activeTaskRef.current === active) {
              onAPIKeyReceived(apiKey);
            }
          }
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          console.error(
            `ddice activation error (active: ${activeTaskRef.current === active}): ${error}`
          );
          // If the task is still active, update with the error
          if (activeTaskRef.current === active) {
            updateResponse(error);
          }
        }
      };
      task();
    }
  }, [response, onAPIKeyReceived]);
  React.useEffect(() => {
    // Discard the active task when the component unmounts
    return () => {
      activeTaskRef.current = "";
    };
  }, []);

  const { fonts, colors } = useTheme();
  const iconHeight = 20;
  const textAndIconHeight = 1 + Math.max(iconHeight, fonts.titleLarge.fontSize);
  return (
    <View style={{ marginTop: 10, alignItems: "center", gap: 10 }}>
      <Text>
        {response
          ? "Use this code to authorize your Pixels App on dddice:"
          : "Generating activation code..."}
      </Text>
      <View
        style={{
          flexDirection: "row",
          height: textAndIconHeight,
          alignItems: "center",
          marginTop: 10,
          gap: 20,
        }}
      >
        <View
          style={{
            flexShrink: 1,
            flexDirection: "row",
            alignItems: "center",
            gap: 20,
          }}
        >
          {response instanceof Error ? (
            <Text style={{ color: colors.error }}>{response.message}</Text>
          ) : response ? (
            <>
              <Text selectable variant="titleLarge">
                {response.code}
              </Text>
              <CopyToClipboardButton text={response.code} size={iconHeight} />
            </>
          ) : (
            <View
              style={{
                height: textAndIconHeight,
                width: textAndIconHeight,
                alignContent: "center",
              }}
            >
              <ActivityIndicator
                animating
                size="small"
                color={colors.primary}
                style={{ position: "absolute" }}
              />
            </View>
          )}
        </View>
        <MaterialCommunityIcons
          name="refresh"
          size={26}
          color={colors.onSurface}
          onPress={() => updateResponse(undefined)}
        />
      </View>
      <ExpirationTimer expiresAt={valid ? response.expiresAt : undefined} />
      <GradientButton
        disabled={!valid}
        style={{ width: "100%", margin: 10 }}
        onPress={() =>
          openURL(
            `https://dddice.com/activate${valid ? "?code=" + response.code : ""}`
          )
        }
      >
        Activate on dddice.com
      </GradientButton>
    </View>
  );
}

function ExpirationTimer({ expiresAt }: { expiresAt?: Date }) {
  const update = useForceUpdate();
  React.useEffect(() => {
    if (expiresAt) {
      const id = setInterval(update, 1000);
      return () => clearInterval(id);
    }
  }, [expiresAt, update]);
  const secs =
    expiresAt && Math.floor((expiresAt.getTime() - Date.now()) / 1000);
  const mins = secs ? Math.round(secs / 60) : 0;
  return (
    <Text variant="bodySmall" style={{ marginVertical: 10 }}>
      {!expiresAt
        ? " " // Need empty space to avoid flickering
        : secs && secs > 0
          ? `Expires in ${secs >= 60 ? `about ${mins} minute${mins > 1 ? "s" : ""}` : `${secs} second${secs > 1 ? "s" : ""}`}`
          : "Expired, tap the refresh icon to regenerate"}
    </Text>
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

function AppActionTestButton({ uuid }: { uuid: string }) {
  const store = useAppStore();
  const connections = useAppConnections();
  const type = useAppSelector(
    (state) => state.appActions.entries.entities[uuid]?.type
  );
  const data = useAppSelector(
    (state) => type && state.appActions.data[type][uuid]
  );
  const invalid =
    !data || (type === "dddice" && !(data as AppActionsData["dddice"]).apiKey);
  return (
    !invalid && (
      <OutlineButton
        onPress={() => {
          const type = store.getState().appActions.entries.entities[uuid]?.type;
          const data = type && store.getState().appActions.data[type][uuid];
          if (type && data) {
            const td = {
              type,
              data,
            } as AppActionTypeAndData;
            const face = Math.floor(Math.random() * 20) + 1;
            playAppAction(
              // Fake PixelInfo
              {
                name: "Pixels Die",
                currentFace: face,
                currentFaceIndex: face - 1,
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
              face,
              { ...td, id: uuid },
              connections
            );
          }
        }}
      >
        Test App Action
      </OutlineButton>
    )
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
  const dispatch = useAppDispatch();

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
        return ConfigureOrAuthorizeThreeDDiceAction;
      case "proxy":
        return ConfigureProxyAction;
      default:
        assertNever(type, `Unknown app action type: ${type}`);
    }
  })();

  const showConfirmDelete = useConfirmActionSheet("Delete App Action", () => {
    dispatch(removeAppAction(uuid));
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
          gap: 20,
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
          <ConfigureAction
            uuid={uuid}
            onOpenAdvancedSettings={() =>
              navigation.navigate("editAppActionAdvancedSettings", {
                appActionUuid: uuid,
              })
            }
          />
        </View>
        <AppActionTestButton uuid={uuid} />
        <OutlineButton
          style={{ borderWidth: 0, backgroundColor: colors.errorContainer }}
          onPress={() => showConfirmDelete()}
        >
          Delete
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
