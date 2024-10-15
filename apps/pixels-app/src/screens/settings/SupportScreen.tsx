import * as Linking from "expo-linking";
import React from "react";
import { ScrollView, View } from "react-native";

import { Body } from "./components/text";

import { SupportScreenProps } from "~/app/navigation";
import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import { OutlineButton } from "~/components/buttons";

const supportEmail = "Luna@GameWithPixels.com";

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
  const createURL = (subject: string) =>
    `mailto:${supportEmail}?` +
    encodeURIComponent(
      `subject=Pixels App ${subject}&body=Please describe your ${subject.toLocaleLowerCase()} here.`
    );
  return (
    <View style={{ height: "100%" }}>
      <PageHeader onGoBack={() => navigation.goBack()}>Support</PageHeader>
      <ScrollView
        alwaysBounceVertical={false}
        contentContainerStyle={{
          paddingVertical: 20,
          paddingHorizontal: 20,
          gap: 20,
        }}
      >
        <Body>To send suggestions:</Body>
        {/* <URLButton
          url="https://gamewithpixels.com/contact-us/"
          sentry-label="contact-us"
        >
          {"Contact Us" + TrailingSpaceFix}
        </URLButton> */}
        <URLButton url={createURL("Suggestion")} sentry-label="send-email">
          Email Us at {supportEmail}
        </URLButton>
        <Body>To report issues:</Body>
        <URLButton url={createURL("Issue")} sentry-label="send-email">
          Email Us at {supportEmail}
        </URLButton>
        <Body style={{ marginTop: 20 }}>Or join us on our Discord server:</Body>
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
