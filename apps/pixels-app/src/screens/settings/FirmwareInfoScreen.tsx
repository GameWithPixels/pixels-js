import { ScrollView, StyleSheet, View } from "react-native";
import {
  Divider,
  Switch,
  Text as PaperText,
  TextProps,
  useTheme,
  SwitchProps,
} from "react-native-paper";

import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { FirmwareInfoScreenProps } from "~/app/navigation";
import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import {
  setUseBetaFirmware,
  setForceUpdateFirmware,
  setUpdateBootloader,
} from "~/features/store";
import { useAppDfuFiles, useDebugMode } from "~/hooks";

function Title(props: Omit<TextProps<never>, "variant">) {
  return <PaperText variant="titleLarge" {...props} />;
}

function Text(props: Omit<TextProps<never>, "variant">) {
  return <PaperText variant="bodyLarge" {...props} />;
}

function TextSmall(props: Omit<TextProps<never>, "variant">) {
  return <PaperText {...props} />;
}

function SettingsSwitch({
  children,
  ...props
}: Exclude<SwitchProps, "trackColor">) {
  const { colors } = useTheme();
  return (
    <View style={styles.switchContainer}>
      <Switch
        trackColor={{
          false: colors.onSurfaceDisabled,
          true: colors.primary,
        }}
        {...props}
      />
      <Text>{children}</Text>
    </View>
  );
}

function FirmwareInfoPage({
  navigation,
}: {
  navigation: FirmwareInfoScreenProps["navigation"];
}) {
  const appDispatch = useAppDispatch();
  const {
    updateBootloader,
    forceUpdateFirmware,
    useBetaFirmware: betaFirmware,
  } = useAppSelector((state) => state.appSettings);
  const { dfuFilesInfo, dfuFilesError } = useAppDfuFiles();
  const date = new Date(dfuFilesInfo?.timestamp ?? 0);
  const debugMode = useDebugMode();
  return (
    <View style={{ height: "100%" }}>
      <PageHeader onGoBack={() => navigation.goBack()}>
        Dice Firmware Information
      </PageHeader>
      <ScrollView
        alwaysBounceVertical={false}
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
            {debugMode && (
              <>
                <Divider style={{ marginVertical: 10 }} />
                <TextSmall style={{ marginLeft: 10 }}>
                  Don't turn on these settings unless you know what you're doing
                  ;)
                </TextSmall>
                <SettingsSwitch
                  value={betaFirmware}
                  onValueChange={(v) => {
                    appDispatch(setUseBetaFirmware(v));
                  }}
                >
                  Use Beta Firmware
                </SettingsSwitch>
                <SettingsSwitch
                  value={forceUpdateFirmware}
                  onValueChange={(v) => {
                    appDispatch(setForceUpdateFirmware(v));
                  }}
                >
                  Always Update Firmware
                </SettingsSwitch>
                <SettingsSwitch
                  value={updateBootloader}
                  onValueChange={(v) => {
                    appDispatch(setUpdateBootloader(v));
                  }}
                >
                  Also Update Bootloader
                </SettingsSwitch>
              </>
            )}
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

const styles = StyleSheet.create({
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
    gap: 10,
  },
});
