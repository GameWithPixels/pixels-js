import { ScrollView, View } from "react-native";
import { Divider } from "react-native-paper";

import { SettingsSwitch } from "./components/SettingsSwitch";
import { Body, Remark, Title } from "./components/text";

import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { FirmwareInfoScreenProps } from "~/app/navigation";
import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import {
  setUseBetaFirmware,
  setUpdateBootloader,
  setAppFirmwareTimestampOverride,
} from "~/features/store";
import { useAppDfuFiles } from "~/hooks";

function FirmwareInfoPage({
  navigation,
}: {
  navigation: FirmwareInfoScreenProps["navigation"];
}) {
  const appDispatch = useAppDispatch();
  const {
    showAdvancedSettings,
    updateBootloader,
    appFirmwareTimestampOverride: fwTimestampOvr,
    useBetaFirmware: betaFirmware,
  } = useAppSelector((state) => state.appSettings);
  const { dfuFilesInfo, dfuFilesError } = useAppDfuFiles();
  const date = new Date(dfuFilesInfo?.timestamp ?? 0);
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
              <Body>Date: {date.toUTCString()}</Body>
              <Body>Timestamp: {date.getTime()}</Body>
              <Body>Firmware: {dfuFilesInfo.firmwarePath ? "yes" : "no"}</Body>
              <Body>
                Bootloader: {dfuFilesInfo.bootloaderPath ? "yes" : "no"}
              </Body>
            </View>
            {showAdvancedSettings && (
              <>
                <Divider style={{ marginVertical: 10 }} />
                <Remark style={{ marginLeft: 10 }}>
                  Don't turn on these settings unless you know what you're doing
                  ;)
                </Remark>
                <SettingsSwitch
                  value={betaFirmware}
                  onValueChange={(v) => {
                    appDispatch(setUseBetaFirmware(v));
                  }}
                >
                  Use Beta Firmware
                </SettingsSwitch>
                <SettingsSwitch
                  value={!!fwTimestampOvr}
                  onValueChange={(v) => {
                    appDispatch(
                      setAppFirmwareTimestampOverride(v ? Date.now() : 0)
                    );
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
          <Body>Error reading firmware files: {String(dfuFilesError)}</Body>
        ) : (
          <Body>Preparing firmware files...</Body>
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
