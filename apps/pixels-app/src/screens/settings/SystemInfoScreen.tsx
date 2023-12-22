import * as Application from "expo-application";
import { useLocales } from "expo-localization";
import { Platform, ScrollView, useWindowDimensions, View } from "react-native";
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
        System Information
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
        </View>
        <PaperText variant="titleLarge" style={{ marginTop: 20 }}>
          OS Information
        </PaperText>
        <View style={{ marginLeft: 10, gap: 10 }}>
          <Text>
            {`Display Size: ${Math.round(window.width)}x${Math.round(
              window.height
            )}`}
          </Text>
          <Text>OS: {Platform.OS}</Text>
          <Text>Version: {Platform.Version}</Text>
          <Text>Locales: {locales.map((l) => l.languageCode).join(", ")}</Text>
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
