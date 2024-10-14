import * as Application from "expo-application";
import { useLocales } from "expo-localization";
import * as Speech from "expo-speech";
import * as Updates from "expo-updates";
import React from "react";
import {
  PixelRatio,
  Platform,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Text as PaperText,
  TextProps,
} from "react-native-paper";
import { useReducedMotion } from "react-native-reanimated";

import { SettingsInfoScreenProps } from "~/app/navigation";
import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";

function Title(props: Omit<TextProps<never>, "variant">) {
  return <PaperText variant="titleLarge" {...props} />;
}

function Text(props: Omit<TextProps<never>, "variant">) {
  return <PaperText variant="bodyLarge" {...props} />;
}

function SystemInfoPage({
  navigation,
}: {
  navigation: SettingsInfoScreenProps["navigation"];
}) {
  const locales = useLocales();
  const window = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const [voices, setVoices] = React.useState<Speech.Voice[]>();
  React.useEffect(() => {
    const getVoices = async () =>
      setVoices(await Speech.getAvailableVoicesAsync());
    getVoices();
  }, []);
  return (
    <View style={{ height: "100%" }}>
      <PageHeader onGoBack={() => navigation.goBack()}>
        App & System Information
      </PageHeader>
      <ScrollView
        alwaysBounceVertical={false}
        contentContainerStyle={{
          paddingVertical: 20,
          paddingHorizontal: 20,
          gap: 20,
        }}
      >
        <Title>App Information</Title>
        <View style={{ marginLeft: 10, gap: 10 }}>
          <Text>Name: {Application.applicationName}</Text>
          <Text>Version: {Application.nativeApplicationVersion}</Text>
          <Text>Build: {Application.nativeBuildVersion}</Text>
          {!Updates.isEmbeddedLaunch && Updates.createdAt && (
            <Text>Update: {Updates.createdAt.toUTCString()}</Text>
          )}
          {Updates.isEmergencyLaunch && <Text>Using Fallback Version</Text>}
        </View>
        <Title style={{ marginTop: 20 }}>System Information</Title>
        <View style={{ marginLeft: 10, gap: 10 }}>
          <Text>OS: {Platform.OS}</Text>
          <Text>Version: {Platform.Version}</Text>
          <Text>
            {`Display Size: ${Math.round(window.width)}x${Math.round(
              window.height
            )}`}
          </Text>
          <Text>Pixel Ratio: {PixelRatio.get()}</Text>
          <Text>Font Scale: {PixelRatio.getFontScale()}</Text>
          <Text>Reduced Motion: {reducedMotion ? "yes" : "no"}</Text>
          <Text>
            Locales:{" "}
            {
              // Got a bug report "undefined is not a function"
              // for the line of code calling map() on locales (Expo 49)
              "map" in locales
                ? locales.map((l) => l.languageCode).join(", ")
                : JSON.stringify(locales)
            }
          </Text>
          <View style={{ flexDirection: "row", gap: 3 }}>
            <Text>Voices:</Text>
            {voices ? <Text>{voices.length}</Text> : <ActivityIndicator />}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
export function SystemInfoScreen({ navigation }: SettingsInfoScreenProps) {
  return (
    <AppBackground>
      <SystemInfoPage navigation={navigation} />
    </AppBackground>
  );
}
