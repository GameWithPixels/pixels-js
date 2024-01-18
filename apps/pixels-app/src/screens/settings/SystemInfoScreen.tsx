import * as Application from "expo-application";
import { useLocales } from "expo-localization";
import * as Updates from "expo-updates";
import {
  PixelRatio,
  Platform,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
import { Text as PaperText, TextProps } from "react-native-paper";

import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import { SettingsInfoScreenProps } from "~/navigation";

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
  return (
    <View style={{ height: "100%" }}>
      <PageHeader onGoBack={() => navigation.goBack()}>
        App & System Information
      </PageHeader>
      <ScrollView
        contentContainerStyle={{
          paddingVertical: 20,
          paddingHorizontal: 20,
          gap: 20,
        }}
      >
        <PaperText variant="titleLarge">App Information</PaperText>
        <View style={{ marginLeft: 10, gap: 10 }}>
          <Text>Name: {Application.applicationName}</Text>
          <Text>Version: {Application.nativeApplicationVersion}</Text>
          <Text>Build: {Application.nativeBuildVersion}</Text>
          {!Updates.isEmbeddedLaunch && Updates.createdAt && (
            <Text>Update: {Updates.createdAt.toUTCString()}</Text>
          )}
          {Updates.isEmergencyLaunch && <Text>Using Fallback Version</Text>}
        </View>
        <PaperText variant="titleLarge" style={{ marginTop: 20 }}>
          System Information
        </PaperText>
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
