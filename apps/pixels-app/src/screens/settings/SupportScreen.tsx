import React from "react";
import { Linking, ScrollView, View } from "react-native";
import { Text as PaperText, TextProps } from "react-native-paper";

import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import { OutlineButton } from "~/components/buttons";
import { TrailingSpaceFix } from "~/fixes";
import { SupportScreenProps } from "~/navigation";

function Text(props: Omit<TextProps<never>, "variant">) {
  return <PaperText variant="bodyLarge" {...props} />;
}

type OpenURLButtonProps = React.PropsWithChildren<{
  url: string;
}>;

function URLButton({ url, children }: OpenURLButtonProps) {
  const handlePress = React.useCallback(async () => {
    // Checking if the link is supported for links with custom URL scheme.
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      // Opening the link with some app, if the URL scheme is "http" the web link should be opened
      // by some browser in the mobile
      await Linking.openURL(url);
    }
  }, [url]);
  return <OutlineButton onPress={handlePress} children={children} />;
}

function SupportPage({
  navigation,
}: {
  navigation: SupportScreenProps["navigation"];
}) {
  return (
    <View style={{ height: "100%" }}>
      <PageHeader onGoBack={() => navigation.goBack()}>Support</PageHeader>
      <ScrollView
        contentContainerStyle={{
          paddingVertical: 20,
          paddingHorizontal: 20,
          gap: 20,
        }}
      >
        <Text>
          To report issues or send suggestions, contact us via our website:
        </Text>
        <URLButton url="https://gamewithpixels.com/contact-us/">
          {"Contact Us" + TrailingSpaceFix}
        </URLButton>
        <Text style={{ marginTop: 20 }}>Or join us on our Discord server:</Text>
        <URLButton url="https://discord.com/invite/9ghxBYQFYA">
          Pixels Discord Server
        </URLButton>
      </ScrollView>
    </View>
  );
}
export function SupportScreen({ navigation }: SupportScreenProps) {
  return (
    <AppBackground>
      <SupportPage navigation={navigation} />
    </AppBackground>
  );
}
