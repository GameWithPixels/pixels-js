import { ScrollView, View } from "react-native";
import { Text } from "react-native-paper";

import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import { useDfuBundle } from "~/hooks/useDfuBundle";
import { FirmwareInfoScreenProps } from "~/navigation";

function FirmwareInfoPage({
  navigation,
}: {
  navigation: FirmwareInfoScreenProps["navigation"];
}) {
  const [dfuBundle, error] = useDfuBundle();
  return (
    <View style={{ height: "100%" }}>
      <PageHeader onGoBack={() => navigation.goBack()}>
        Dice Software Information
      </PageHeader>
      <ScrollView
        contentContainerStyle={{
          paddingVertical: 20,
          paddingHorizontal: 10,
          gap: 20,
        }}
      >
        {dfuBundle ? (
          <>
            <Text>{`Date: ${dfuBundle.date.toLocaleDateString()}`}</Text>
            <Text>{`Time: ${dfuBundle.date.toLocaleTimeString()}`}</Text>
            <Text>{`Firmware: ${dfuBundle.firmware ? "yes" : "no"}`}</Text>
            <Text>{`Bootloader: ${dfuBundle.bootloader ? "yes" : "no"}`}</Text>
          </>
        ) : error ? (
          <Text>Error reading files: {String(error)}</Text>
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
