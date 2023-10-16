import { useFocusEffect } from "@react-navigation/core";
import {
  BaseBox,
  BaseHStack,
} from "@systemic-games/react-native-base-components";
import * as Localization from "expo-localization";
import * as Updates from "expo-updates";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet } from "react-native";
import {
  Button,
  Card,
  Divider,
  List,
  Modal,
  Portal,
  RadioButton,
  Switch,
  Text,
  Title,
} from "react-native-paper";

import { AppStyles, useModalStyle } from "~/AppStyles";
import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { AppPage } from "~/components/AppPage";
import {
  setOpenPageOnStart,
  setThemeMode,
  ThemeMode,
} from "~/features/store/appSettingsSlice";
import { setUseSelectedFirmware } from "~/features/store/validationSettingsSlice";
import { getLanguageShortCode } from "~/i18n";
import { AppRootPageName } from "~/navigation";

function toYesNo(value: boolean) {
  return value ? "Yes" : "No";
}

function ThemeRadio({
  label,
  themeMode,
}: {
  label: string;
  themeMode: ThemeMode;
}) {
  const currentThemeMode = useAppSelector(
    (state) => state.appSettings.themeMode
  );
  const appDispatch = useAppDispatch();
  const setTheme = () => appDispatch(setThemeMode(themeMode));
  return (
    <Pressable onPress={setTheme} style={styles.radioPressable}>
      <RadioButton
        value={themeMode}
        status={themeMode === currentThemeMode ? "checked" : "unchecked"}
        onPress={setTheme}
      />
      <Text>{label}</Text>
    </Pressable>
  );
}

function ThemeCard() {
  return (
    <Card>
      <Card.Content style={{ gap: 10 }}>
        <Title>Theme</Title>
        <BaseHStack px={5} justifyContent="space-between">
          <ThemeRadio label="System" themeMode="system" />
          <ThemeRadio label="Dark" themeMode="dark" />
          <ThemeRadio label="Light" themeMode="light" />
        </BaseHStack>
      </Card.Content>
    </Card>
  );
}

function LanguageRadio({
  label,
  language,
}: {
  label: string;
  language: string;
}) {
  const { i18n } = useTranslation();
  const setLanguage = React.useCallback(
    () =>
      i18n.changeLanguage(
        language === "system"
          ? getLanguageShortCode(Localization.locale)
          : language
      ),
    [i18n, language]
  );
  const selected = getLanguageShortCode(i18n.language);
  return (
    <Pressable onPress={setLanguage} style={styles.radioPressable}>
      <RadioButton
        value={label}
        status={selected === language ? "checked" : "unchecked"}
        onPress={setLanguage}
      />
      <Text>{label}</Text>
    </Pressable>
  );
}

function LanguageCard() {
  return (
    <Card>
      <Card.Content style={{ gap: 10 }}>
        <Title>Language</Title>
        <BaseHStack px={5} justifyContent="space-between">
          {/* <LanguageRadio label="System" language="system" /> // TODO Need to store value */}
          <LanguageRadio label="Chinese" language="zh" />
          <LanguageRadio label="English" language="en" />
        </BaseHStack>
      </Card.Content>
    </Card>
  );
}

function PageRadio({
  label,
  page,
}: {
  label: string;
  page: AppRootPageName | "";
}) {
  const appDispatch = useAppDispatch();
  const openPageOnStart = useAppSelector(
    (state) => state.appSettings.openPageOnStart
  );
  const setPage = () => appDispatch(setOpenPageOnStart(page));
  return (
    <Pressable onPress={setPage} style={styles.radioPressable}>
      <RadioButton
        value={label}
        status={openPageOnStart === page ? "checked" : "unchecked"}
        onPress={setPage}
      />
      <Text>{label}</Text>
    </Pressable>
  );
}

function ValidationCard() {
  const appDispatch = useAppDispatch();
  const latestFirmware = useAppSelector(
    (state) => state.validationSettings.useSelectedFirmware
  );
  return (
    <Card>
      <Card.Content style={{ gap: 10 }}>
        <Title>Validation</Title>
        <Text>Open On Start</Text>
        <BaseHStack px={5} justifyContent="space-between">
          <PageRadio label="Default" page="" />
          <PageRadio label="Validation" page="Validation" />
          <PageRadio label="Carton Label" page="CartonLabel" />
        </BaseHStack>
        <BaseHStack px={5} justifyContent="space-between">
          <Text>Use Selected Firmware</Text>
          <Switch
            value={latestFirmware}
            onValueChange={(value) => {
              appDispatch(setUseSelectedFirmware(value));
            }}
          />
        </BaseHStack>
      </Card.Content>
    </Card>
  );
}

function EasCard() {
  // Status (can be an error)
  const [updateStatus, setUpdateStatus] = React.useState("None");
  const setUpdateError = React.useCallback((error: any, operation: string) => {
    const msg = `Error running EAS Updates ${operation}.`;
    const errMsg = (error as Error)?.message;
    setUpdateStatus(errMsg?.length ? `${msg}\n${errMsg}` : msg);
  }, []);

  // List to update events (I'm not getting any with expo-updates 0.16.4)
  // const eventListener = React.useCallback((ev: Updates.UpdateEvent) => {
  //   setUpdateStatus(`${ev.type}`);
  //   if (ev.type === Updates.UpdateEventType.ERROR) {
  //     // Handle error
  //   } else if (ev.type === Updates.UpdateEventType.NO_UPDATE_AVAILABLE) {
  //     // Handle no update available
  //   } else if (ev.type === Updates.UpdateEventType.UPDATE_AVAILABLE) {
  //     // Handle update available
  //   }
  // }, []);
  // Updates.useUpdateEvents(eventListener);

  // Check for an EAS update
  const [updateManifest, setUpdateManifest] =
    React.useState<Updates.Manifest>();
  const check = React.useCallback(async () => {
    try {
      setUpdateStatus("Checking For Update...");
      const { manifest } = await Updates.checkForUpdateAsync();
      setUpdateManifest(manifest);
      setUpdateStatus(manifest ? "Update available" : "Up-To-Date");
    } catch (error) {
      setUpdateManifest(undefined);
      if (
        Updates.isEmbeddedLaunch &&
        (error as Error)?.message?.startsWith(
          "Failed to download manifest from URL"
        )
      ) {
        // Unfortunately we ge this error is there is no published update yet
        setUpdateStatus("Up-To-Date (no update)");
      } else {
        setUpdateError(error, "check");
      }
    }
  }, [setUpdateError]);

  // Download and install update
  const [updating, setUpdating] = React.useState(false);
  const update = React.useCallback(async () => {
    setUpdating(true);
    try {
      setUpdateStatus("Fetching Update...");
      const { manifest } = await Updates.fetchUpdateAsync();
      setUpdateManifest(manifest);
      setUpdateStatus(manifest ? "Restarting..." : "Up-To-Date");
      if (manifest) {
        await Updates.reloadAsync();
      }
    } catch (error) {
      setUpdateManifest(undefined);
      setUpdateError(error, "fetch");
    } finally {
      setUpdating(false);
    }
  }, [setUpdateError]);

  // Immediately check for updates
  useFocusEffect(
    React.useCallback(() => {
      if (!__DEV__) {
        check();
      }
    }, [check])
  );

  // Modal
  const [infoVisible, setInfoVisible] = React.useState(false);

  return (
    <>
      <Card>
        <Card.Content style={{ gap: 10 }}>
          <Title>EAS Updates</Title>
          <Text style={styles.text}>{`Status: ${updateStatus}`}</Text>
          {/* <Text style={styles.text}>
            {`Update Date: ${
              updateManifest?.createdAt?.toDateString() ?? "Unknown"
            }`}
          </Text>
          <Text style={styles.text}>
            {`Update Id: ${updateManifest?.id ?? "Unknown"}`}
          </Text> */}
          <Divider bold style={styles.divider} />
          <BaseBox flexDir="row" justifyContent="space-between">
            <Button
              mode="outlined"
              disabled={!updateManifest}
              loading={updating}
              onPress={update}
            >
              Update
            </Button>
            <Button mode="outlined" disabled={updating} onPress={check}>
              Re-Check
            </Button>
            <Button mode="outlined" onPress={() => setInfoVisible(true)}>
              App Info
            </Button>
          </BaseBox>
        </Card.Content>
      </Card>

      <AppInfoModal
        visible={infoVisible}
        onDismiss={() => setInfoVisible(false)}
      />
    </>
  );
}

function AppInfoModal({
  visible,
  onDismiss,
}: {
  visible: boolean;
  onDismiss: () => void;
}) {
  const modalStyle = useModalStyle();
  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={modalStyle}
      >
        <ScrollView>
          <Title>App Info</Title>
          <Divider style={{ height: 2, marginTop: 10 }} />
          <List.Section>
            <List.Item title={`Channel: ${Updates.channel ?? "Unknown"}`} />
            <List.Item
              title={`Created On: ${
                Updates.createdAt?.toDateString() ?? "Unknown"
              }`}
            />
            <List.Item
              title={`Embedded Launch: ${toYesNo(Updates.isEmbeddedLaunch)}`}
            />
            <List.Item
              title={`Emergency Launch: ${toYesNo(Updates.isEmergencyLaunch)}`}
            />
            <List.Item
              title={`Runtime Version: ${Updates.runtimeVersion ?? "Unknown"}`}
            />
            <List.Item title={`Id: ${Updates.updateId ?? "Unknown"}`} />
          </List.Section>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

function SettingsPage() {
  return (
    <ScrollView contentContainerStyle={AppStyles.listContentContainer}>
      <ThemeCard />
      <LanguageCard />
      <ValidationCard />
      <EasCard />
    </ScrollView>
  );
}

export function SettingsScreen() {
  return (
    <AppPage>
      <SettingsPage />
    </AppPage>
  );
}

const styles = StyleSheet.create({
  text: {
    margin: 5,
  },
  textError: {
    margin: 5,
    fontWeight: "bold",
    color: "red",
  },
  divider: {
    margin: 5,
  },
  radioPressable: {
    flexDirection: "row",
    alignItems: "center",
  },
});
