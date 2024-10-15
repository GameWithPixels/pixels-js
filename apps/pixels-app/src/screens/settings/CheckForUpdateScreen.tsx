import * as Updates from "expo-updates";
import React from "react";
import { ScrollView, View } from "react-native";
import { ActivityIndicator, Button } from "react-native-paper";

import { Body, Remark } from "./components/text";

import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { CheckForUpdateScreenProps } from "~/app/navigation";
import { checkForAppUpdateAsync, installAppUpdateAsync } from "~/app/updates";
import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";

function toUserDate(dateString: string): string {
  try {
    return new Date(dateString).toUTCString();
  } catch {
    return "unknown";
  }
}

function CheckForUpdatePage({
  navigation,
}: {
  navigation: CheckForUpdateScreenProps["navigation"];
}) {
  const appDispatch = useAppDispatch();
  const appUpdate = useAppSelector((state) => state.appTransient.update);

  // Immediately check for update if we don't have a response yet
  React.useEffect(() => {
    if (!appUpdate.gotResponse) {
      checkForAppUpdateAsync(appDispatch);
    }
  }, [appDispatch, appUpdate.gotResponse]);
  const [checking, setChecking] = React.useState(false);

  return (
    <View style={{ height: "100%" }}>
      <PageHeader onGoBack={() => navigation.goBack()}>App Patching</PageHeader>
      <ScrollView
        alwaysBounceVertical={false}
        contentContainerStyle={{
          paddingVertical: 20,
          paddingHorizontal: 20,
          gap: 10,
        }}
      >
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Body>Patch Status:</Body>
          {checking || !appUpdate.gotResponse ? (
            <ActivityIndicator />
          ) : (
            <Body>
              {appUpdate.error
                ? "unknown"
                : `${appUpdate.manifest ? "" : "no "}patch available`}
            </Body>
          )}
        </View>
        {appUpdate.error ? (
          <Body>{appUpdate.error}</Body>
        ) : (
          appUpdate.manifest && (
            <Body>Date: {toUserDate(appUpdate.manifest.createdAt)}</Body>
          )
        )}
        <Remark>
          Patches are small updates delivered directly to your app, on top of
          app store updates.
        </Remark>
        <Button
          mode="outlined"
          disabled={checking || !appUpdate.gotResponse}
          sentry-label={appUpdate.manifest ? "update-now" : "check-for-update"}
          style={{ marginTop: 20 }}
          onPress={async () => {
            setChecking(true);
            if (appUpdate.manifest) {
              await installAppUpdateAsync(appDispatch);
            } else {
              await checkForAppUpdateAsync(appDispatch);
            }
            setChecking(false);
          }}
        >
          {appUpdate.manifest ? "Update Now" : "Check Again"}
        </Button>
        {!Updates.isEmbeddedLaunch && Updates.createdAt && (
          <>
            <Body style={{ marginTop: 20 }}>Installed update:</Body>
            <Body>{Updates.createdAt.toUTCString()}</Body>
          </>
        )}
      </ScrollView>
    </View>
  );
}
export function CheckForUpdateScreen({
  navigation,
}: CheckForUpdateScreenProps) {
  return (
    <AppBackground>
      <CheckForUpdatePage navigation={navigation} />
    </AppBackground>
  );
}
