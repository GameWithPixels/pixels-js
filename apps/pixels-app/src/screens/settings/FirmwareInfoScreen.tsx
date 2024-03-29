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
import { setUpdateBootloader } from "~/features/store/appSettingsSlice";
import { useDfuBundle } from "~/hooks";
import { FirmwareInfoScreenProps } from "~/navigation";

function Text(props: Omit<TextProps<never>, "variant">) {
  return <PaperText variant="bodyLarge" {...props} />;
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
  const [dfuBundle, error] = useDfuBundle();
  const date = new Date(dfuBundle?.timestamp ?? 0);
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
          gap: 20,
        }}
      >
        {dfuBundle ? (
          <>
            <PaperText variant="titleLarge">Available Dice Firmware</PaperText>
            <View style={{ marginLeft: 10, gap: 10 }}>
              <Text>Date: {date.toUTCString()}</Text>
              <Text>Timestamp: {date.getTime()}</Text>
              <Text>Firmware: {dfuBundle.firmware ? "yes" : "no"}</Text>
              <Text>Bootloader: {dfuBundle.bootloader ? "yes" : "no"}</Text>
            </View>
            <Divider style={{ marginVertical: 5 }} />
            <View style={{ gap: 10 }}>
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
              <PaperText>
                Don't turn this setting on unless you know what you're doing ;)
              </PaperText>
            </View>
          </>
        ) : error ? (
          <Text>Error reading files: {error}</Text>
        ) : (
          <Text>Preparing files...</Text>
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
