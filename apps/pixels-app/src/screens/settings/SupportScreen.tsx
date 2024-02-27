import React from "react";
import { Linking, ScrollView, View } from "react-native";
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
    // Checking if the link is supported for links with custom URL scheme.
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      // Opening the link with some app, if the URL scheme is "http" the web link should be opened
      // by some browser in the mobile
      await Linking.openURL(url);
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
        <Text>To report issues or send suggestions, contact us via email:</Text>
        {/* <URLButton
          url="https://gamewithpixels.com/contact-us/"
          sentry-label="contact-us"
        >
          {"Contact Us" + TrailingSpaceFix}
        </URLButton> */}
        <URLButton
          url={encodeURI(
            `mailto:${supportEmail}?` +
              "subject=App Support Request&body=Please describe your issue or suggestion here."
          )}
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
