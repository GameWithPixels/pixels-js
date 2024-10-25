import * as Application from "expo-application";
import * as Device from "expo-device";
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
import { ActivityIndicator } from "react-native-paper";
import { useReducedMotion } from "react-native-reanimated";

import { Body, Title } from "./components/text";

import { SettingsInfoScreenProps } from "~/app/navigation";
import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";

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
          <Body>Name: {Application.applicationName}</Body>
          <Body>Version: {Application.nativeApplicationVersion}</Body>
          <Body>Build: {Application.nativeBuildVersion}</Body>
          {!Updates.isEmbeddedLaunch && Updates.createdAt && (
            <Body>Update: {Updates.createdAt.toUTCString()}</Body>
          )}
          {Updates.isEmergencyLaunch && <Body>Using Fallback Version</Body>}
        </View>
        <Title style={{ marginTop: 20 }}>System Information</Title>
        <View style={{ marginLeft: 10, gap: 10 }}>
          <Body>OS: {Platform.OS}</Body>
          <Body>Version: {Device.osVersion}</Body>
          {Device.platformApiLevel && (
            <Body>API Level: {Device.platformApiLevel}</Body>
          )}
          <Body>
            {`Display Size: ${Math.round(window.width)}x${Math.round(
              window.height
            )}`}
          </Body>
          <Body>Pixel Ratio: {PixelRatio.get().toFixed(1)}</Body>
          <Body>Font Scale: {PixelRatio.getFontScale().toFixed(1)}</Body>
          <Body>Reduced Motion: {reducedMotion ? "yes" : "no"}</Body>
          <Body>
            Locales:{" "}
            {
              // Got a bug report "undefined is not a function"
              // for the line of code calling map() on locales (Expo 49)
              "map" in locales
                ? locales.map((l) => l.languageCode).join(", ")
                : JSON.stringify(locales)
            }
          </Body>
          <View style={{ flexDirection: "row", gap: 3 }}>
            <Body>Voices:</Body>
            {voices ? <Body>{voices.length}</Body> : <ActivityIndicator />}
          </View>
        </View>
        <Title style={{ marginTop: 20 }}>Device</Title>
        <View style={{ marginLeft: 10, gap: 10 }}>
          <Body>Brand: {Device.brand}</Body>
          <Body>Model: {Device.modelName}</Body>
          {Device.productName && <Body>Product: {Device.productName}</Body>}
          {Device.designName && Device.designName !== Device.productName && (
            <Body>Design: {Device.designName}</Body>
          )}
          {Device.totalMemory && (
            <Body>
              Memory: {Math.round(Device.totalMemory / 1024 / 1024 / 1024)} GB
            </Body>
          )}
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
