import { Profiles } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { ScrollView, View } from "react-native";

import { CreateAnimationScreenProps } from "~/app/navigation";
import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import { TabsHeaders } from "~/components/TabsHeaders";
import { AnimationsGrid } from "~/components/animation";
import { TightTextButton } from "~/components/buttons";
import { useAnimationsList } from "~/hooks";

export function createAnimation(name: string): Profiles.Animation {
  return new Profiles.AnimationFlashes({
    uuid: Math.random().toString(),
    name,
  });
}

const tabsNames = ["Builtin", "Custom"] as const;

function CreateAnimationPage({
  navigation,
}: {
  navigation: CreateAnimationScreenProps["navigation"];
}) {
  const animations = useAnimationsList();
  const templates = React.useMemo(
    () => [
      [
        "Flashes",
        "Colorful Rainbow",
        "Gradient",
        "Color Design",
        "Gradient With Grayscale Design",
      ].map(createAnimation),
      animations.slice(10),
      animations.filter((_, i) => i % 3),
    ],
    [animations]
  );
  const [tab, setTab] = React.useState<(typeof tabsNames)[number]>(
    tabsNames[0]
  );
  return (
    <View style={{ height: "100%", gap: 10 }}>
      <PageHeader
        leftElement={() => (
          <TightTextButton onPress={() => navigation.goBack()}>
            Cancel
          </TightTextButton>
        )}
      >
        Select Template
      </PageHeader>
      <TabsHeaders names={tabsNames} selected={tab} onSelect={setTab} />
      <ScrollView contentContainerStyle={{ gap: 20, paddingBottom: 10 }}>
        <AnimationsGrid
          animations={templates[tabsNames.indexOf(tab)]}
          onSelectAnimation={() => {
            const newAnim = createAnimation("New Animation");
            // addAnimation(newAnim);
            const openEdit = () => {
              navigation.navigate("editAnimation", {
                animationUuid: newAnim.uuid,
              });
              navigation.removeListener("focus", openEdit);
            };
            navigation.addListener("transitionEnd", openEdit);
            navigation.goBack();
          }}
        />
      </ScrollView>
    </View>
  );
}

export function CreateAnimationScreen({
  navigation,
}: CreateAnimationScreenProps) {
  return (
    <AppBackground>
      <CreateAnimationPage navigation={navigation} />
    </AppBackground>
  );
}
