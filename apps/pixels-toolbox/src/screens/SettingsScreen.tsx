import { useFocusEffect } from "@react-navigation/core";
import {
  FastBox,
  FastHStack,
} from "@systemic-games/react-native-base-components";
import * as Updates from "expo-updates";
import * as React from "react";
import {
  Appearance,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Button,
  Card,
  Divider,
  List,
  Modal,
  MD3DarkTheme as DarkTheme,
  MD3LightTheme as LightTheme,
  Portal,
  Provider as PaperProvider,
  RadioButton,
  Text,
  Title,
  useTheme,
} from "react-native-paper";

export type ThemeMode = "system" | "dark" | "light";

export const PreferencesContext = React.createContext({
  themeMode: "system" as ThemeMode,
  setThemeMode: (_mode: ThemeMode) => {},
});

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
  const { themeMode: currentThemeMode, setThemeMode } =
    React.useContext(PreferencesContext);
  const setMode = React.useCallback(
    () => setThemeMode(themeMode),
    [setThemeMode, themeMode]
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

  // Auto-check for updates once
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
  const theme = useTheme();
  const containerStyle = {
    padding: 20,
    backgroundColor: theme.colors.background,
  };
  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={containerStyle}
      >
        <ScrollView>
          <Title>App Info</Title>
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

function OptionsPage() {
  const theme = useTheme();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ThemeCard />
      <FastBox h={10} />
      <EasCard />
      <FastBox h={10} />
    </ScrollView>
  );
}

export function SettingsScreen() {
  const [themeMode, setThemeMode] = React.useState<ThemeMode>("dark");
  const preferences = React.useMemo(
    () => ({
      themeMode,
      setThemeMode,
    }),
    [themeMode]
  );

  const mode = themeMode === "system" ? Appearance.getColorScheme() : themeMode;
  const theme = mode === "dark" ? DarkTheme : LightTheme;

  return (
    <PreferencesContext.Provider value={preferences}>
      <PaperProvider theme={theme}>
        <OptionsPage />
      </PaperProvider>
    </PreferencesContext.Provider>
  );
}

const styles = StyleSheet.create({
  text: { margin: 5 },
  textError: { margin: 5, fontWeight: "bold", color: "red" },
  divider: { margin: 5 },
  radioPressable: { flexDirection: "row", alignItems: "center" },
  easCardButtons: { flexDirection: "row", justifyContent: "space-between" },
});
