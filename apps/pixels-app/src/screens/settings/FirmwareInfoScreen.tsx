import { ScrollView, View } from "react-native";
import {
  Divider,
  Switch,
  Text as PaperText,
  TextProps,
  useTheme,
} from "react-native-paper";

import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import { setUpdateBootloader } from "~/features/store";
import { useAppDfuFiles } from "~/hooks";
import { FirmwareInfoScreenProps } from "~/navigation";

function Title(props: Omit<TextProps<never>, "variant">) {
  return <PaperText variant="titleLarge" {...props} />;
}

function Text(props: Omit<TextProps<never>, "variant">) {
  return <PaperText variant="bodyLarge" {...props} />;
}

function TextSmall(props: Omit<TextProps<never>, "variant">) {
  return <PaperText {...props} />;
}

function FirmwareInfoPage({
  navigation,
}: {
  navigation: FirmwareInfoScreenProps["navigation"];
}) {
  const appDispatch = useAppDispatch();
  const updateBootloader = useAppSelector(
    (state) => state.appSettings.updateBootloader
  );
  const { dfuFilesInfo, dfuFilesError } = useAppDfuFiles();
  const date = new Date(dfuFilesInfo?.timestamp ?? 0);
  const { colors } = useTheme();
  return (
    <View style={{ height: "100%" }}>
      <PageHeader onGoBack={() => navigation.goBack()}>
        Dice Firmware Information
      </PageHeader>
      <ScrollView
        contentContainerStyle={{
          paddingVertical: 20,
          paddingHorizontal: 20,
          gap: 10,
        }}
      >
        {dfuFilesInfo ? (
          <>
            <Title>Available Dice Firmware</Title>
            <View style={{ marginLeft: 10, marginTop: 10, gap: 10 }}>
              <Text>Date: {date.toUTCString()}</Text>
              <Text>Timestamp: {date.getTime()}</Text>
              <Text>Firmware: {dfuFilesInfo.firmwarePath ? "yes" : "no"}</Text>
              <Text>
                Bootloader: {dfuFilesInfo.bootloaderPath ? "yes" : "no"}
              </Text>
            </View>
            <Divider style={{ marginVertical: 10 }} />
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <Switch
                value={updateBootloader}
                onValueChange={(v) => {
                  appDispatch(setUpdateBootloader(v));
                }}
                trackColor={{
                  false: colors.onSurfaceDisabled,
                  true: colors.primary,
                }}
              />
              <Text>Also Update Bootloader</Text>
            </View>
            <TextSmall style={{ marginLeft: 10 }}>
              Don't turn this setting on unless you know what you're doing ;)
            </TextSmall>
          </>
        ) : dfuFilesError ? (
          <Text>Error reading firmware files: {String(dfuFilesError)}</Text>
        ) : (
          <Text>Preparing firmware files...</Text>
        )}
      </ScrollView>
    </View>
  );
}
export function FirmwareInfoScreen({ navigation }: FirmwareInfoScreenProps) {
  return (
    <AppBackground>
      <FirmwareInfoPage navigation={navigation} />
    </AppBackground>
  );
}
