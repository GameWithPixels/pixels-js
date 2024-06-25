import * as Linking from "expo-linking";
import React from "react";
import { ScrollView, View } from "react-native";
import { Text as PaperText, TextProps } from "react-native-paper";

import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import { OutlineButton } from "~/components/buttons";
import { SupportScreenProps } from "~/navigation";

const supportEmail = "Luna@GameWithPixels.com";

function Text(props: Omit<TextProps<never>, "variant">) {
  return <PaperText variant="bodyLarge" {...props} />;
}

type OpenURLButtonProps = Required<React.PropsWithChildren> & {
  url: string;
};

function URLButton({ url, ...props }: OpenURLButtonProps) {
  const handlePress = React.useCallback(async () => {
    const encoded = encodeURI(url);
    // Checking if the link is supported for links with custom URL scheme.
    const supported = await Linking.canOpenURL(encoded);
    if (supported) {
      // Opening the link with some app, if the URL scheme is "http" the web link should be opened
      // by some browser in the mobile
      await Linking.openURL(encoded);
    }
  }, [url]);
  return <OutlineButton onPress={handlePress} {...props} />;
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
        <Text>To send suggestions:</Text>
        {/* <URLButton
          url="https://gamewithpixels.com/contact-us/"
          sentry-label="contact-us"
        >
          {"Contact Us" + TrailingSpaceFix}
        </URLButton> */}
        <URLButton
          url={
            `mailto:${supportEmail}?` +
            "subject=Pixels App Suggestion&body=Please describe your suggestion here."
          }
          sentry-label="send-email"
        >
          Email Us at {supportEmail}
        </URLButton>
        <Text>To report issues:</Text>
        <URLButton
          url={
            `mailto:${supportEmail}?` +
            "subject=Pixels App Issue&body=Please describe your issue here."
          }
          sentry-label="send-email"
        >
          Email Us at {supportEmail}
        </URLButton>
        <Text style={{ marginTop: 20 }}>Or join us on our Discord server:</Text>
        <URLButton
          url="https://discord.com/invite/9ghxBYQFYA"
          sentry-label="discord-server"
        >
          Join Pixels Discord Server
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
