import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Application from "expo-application";
import { useLocales } from "expo-localization";
import { Platform, ScrollView, useWindowDimensions, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import { SettingsInfoScreenProps, SettingsStackParamList } from "~/navigation";

function SystemInfoPage({
  navigation,
}: {
  navigation: NativeStackNavigationProp<SettingsStackParamList, "systemInfo">;
}) {
  const locales = useLocales();
  const window = useWindowDimensions();
  const { colors } = useTheme();
  return (
    <View style={{ height: "100%" }}>
      <PageHeader title="System info" onGoBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={{
          paddingVertical: 20,
          paddingHorizontal: 10,
          gap: 20,
        }}
      >
        <Text>
          {`Display Size: ${Math.round(window.width)}x${Math.round(
            window.height
          )}`}
        </Text>
        <Text>OS: {Platform.OS}</Text>
        <Text>Version: {Platform.Version}</Text>
        <Text>Locales: {locales.map((l) => l.languageCode).join(", ")}</Text>
        <View>
          <Text>App Info:</Text>
          <View
            style={{
              marginTop: 10,
              padding: 10,
              paddingHorizontal: 20,
              gap: 10,
              backgroundColor: colors.backdrop,
            }}
          >
            <Text>Name: {Application.applicationName}</Text>
            <Text>Version: {Application.nativeApplicationVersion}</Text>
            <Text>Build: {Application.nativeBuildVersion}</Text>
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
