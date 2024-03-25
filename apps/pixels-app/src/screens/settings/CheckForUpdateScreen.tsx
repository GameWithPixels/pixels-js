import * as Updates from "expo-updates";
import React from "react";
import { ScrollView, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Text as PaperText,
  TextProps,
} from "react-native-paper";

import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { checkForAppUpdateAsync, installAppUpdateAsync } from "~/app/updates";
import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import { CheckForUpdateScreenProps } from "~/navigation";

function Text(props: Omit<TextProps<never>, "variant">) {
  return <PaperText variant="bodyLarge" {...props} />;
}

function TextSmall(props: Omit<TextProps<never>, "variant">) {
  return <PaperText {...props} />;
}

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
  const appUpdate = useAppSelector((state) => state.appUpdate);

  // Immediately check for update if we don't have a response yet
  React.useEffect(() => {
    if (!appUpdate.gotResponse) {
      checkForAppUpdateAsync(appDispatch);
    }
  }, [appDispatch, appUpdate.gotResponse]);
  const [checking, setChecking] = React.useState(false);

  return (
    <View style={{ height: "100%" }}>
      <PageHeader onGoBack={() => navigation.goBack()}>App Update</PageHeader>
      <ScrollView
        contentContainerStyle={{
          paddingVertical: 20,
          paddingHorizontal: 20,
          gap: 10,
        }}
      >
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Text>Patch Status:</Text>
          {checking || !appUpdate.gotResponse ? (
            <ActivityIndicator />
          ) : (
            <Text>
              {appUpdate.error
                ? "unknown"
                : `${appUpdate.manifest ? "" : "no "}patch available`}
            </Text>
          )}
        </View>
        {appUpdate.error ? (
          <Text>{appUpdate.error}</Text>
        ) : (
          appUpdate.manifest && (
            <Text>Date: {toUserDate(appUpdate.manifest.createdAt)}</Text>
          )
        )}
        <TextSmall>
          Patches are delivered directly to your app, on top of app store
          updates.
        </TextSmall>
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
            <Text style={{ marginTop: 20 }}>Installed update:</Text>
            <Text>{Updates.createdAt.toUTCString()}</Text>
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
