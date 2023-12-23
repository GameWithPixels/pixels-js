import { ScrollView, View } from "react-native";
import {
  Switch,
  Text as PaperText,
  TextProps,
  useTheme,
} from "react-native-paper";

import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import { setUpdateBootloader } from "~/features/store/appSettingsSlice";
import { useDfuBundle } from "~/hooks/useDfuBundle";
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
        Dice Software Information
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
            <PaperText variant="titleLarge">Available Dice Software</PaperText>
            <View style={{ marginLeft: 10, gap: 10 }}>
              <Text>Date: {date?.toLocaleDateString()}</Text>
              <Text>Time: {date?.toLocaleTimeString()}</Text>
              <Text>Firmware: {dfuBundle.firmware ? "yes" : "no"}</Text>
              <Text>Bootloader: {dfuBundle.bootloader ? "yes" : "no"}</Text>
            </View>
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
