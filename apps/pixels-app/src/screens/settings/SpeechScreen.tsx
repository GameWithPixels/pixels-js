import * as Speech from "expo-speech";
import React from "react";
import { ScrollView, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Text as PaperText,
  TextProps,
} from "react-native-paper";

import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import { SpeechScreenProps } from "~/navigation";

function Text(props: Omit<TextProps<never>, "variant">) {
  return <PaperText variant="bodyLarge" {...props} />;
}

function SpeechPage({
  navigation,
}: {
  navigation: SpeechScreenProps["navigation"];
}) {
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
        contentContainerStyle={{
          paddingVertical: 20,
          paddingHorizontal: 20,
          gap: 20,
        }}
      >
        <PaperText variant="titleLarge">Speech</PaperText>
        <Button mode="contained-tonal" onPress={() => Speech.speak("Hello")}>
          Speak Hello
        </Button>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Text>Voices:</Text>
          {voices ? (
            <Text>
              {voices.length
                ? voices.map((v) => `${v.name} (${v.language})`).join(", ")
                : "no voice found"}
            </Text>
          ) : (
            <ActivityIndicator />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

export function SpeechScreen({ navigation }: SpeechScreenProps) {
  return (
    <AppBackground>
      <SpeechPage navigation={navigation} />
    </AppBackground>
  );
}
