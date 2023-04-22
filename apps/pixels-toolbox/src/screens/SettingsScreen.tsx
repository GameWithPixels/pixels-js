import { useFocusEffect } from "@react-navigation/core";
import { FastHStack } from "@systemic-games/react-native-base-components";
import * as Updates from "expo-updates";
import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import {
  Button,
  Card,
  Divider,
  List,
  Modal,
  Portal,
  RadioButton,
  Text,
  Title,
} from "react-native-paper";

import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { AppPage } from "~/components/AppPage";
import { setThemeMode, ThemeMode } from "~/features/store/displaySettingsSlice";
import gs, { useModalStyle } from "~/styles";

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
    (state) => state.displaySettings.themeMode
  );
  const appDispatch = useAppDispatch();
  const setMode = React.useCallback(
    () => appDispatch(setThemeMode(themeMode)),
    [appDispatch, themeMode]
  );
  return (
    <Pressable onPress={setMode} style={styles.radioPressable}>
      <RadioButton
        value={themeMode}
        status={themeMode === currentThemeMode ? "checked" : "unchecked"}
        onPress={setMode}
      />
      <Text>{label}</Text>
    </Pressable>
  );
}

function ThemeCard() {
  return (
    <Card>
      <Card.Content>
        <Title>Theme</Title>
        <FastHStack px={5} justifyContent="space-between">
          <ThemeRadio label="System" themeMode="system" />
          <ThemeRadio label="Dark" themeMode="dark" />
          <ThemeRadio label="Light" themeMode="light" />
        </FastHStack>
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
        <Card.Content>
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
          <View style={styles.easCardButtons}>
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
          </View>
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
    <ScrollView contentContainerStyle={gs.listContentContainer}>
      <ThemeCard />
      <EasCard />
    </ScrollView>
  );
}

export default function () {
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
  easCardButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
