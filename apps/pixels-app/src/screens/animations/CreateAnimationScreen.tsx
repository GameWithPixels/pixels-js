import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Profiles } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { ScrollView, View } from "react-native";

import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import { TabsHeaders } from "~/components/TabsHeaders";
import { AnimationsGrid } from "~/components/animation";
import { TightTextButton } from "~/components/buttons";
import { useAnimationsList } from "~/hooks";
import {
  AnimationsStackParamList,
  CreateAnimationScreenProps,
} from "~/navigation";

export function createAnimation(name: string): Profiles.Animation {
  return new Profiles.AnimationFlashes({
    uuid: Math.random().toString(),
    name,
  });
}

const tabsNames = ["Templates", "Animations"];

function CreateAnimationPage({
  navigation,
}: {
  navigation: NativeStackNavigationProp<
    AnimationsStackParamList,
    "createAnimation"
  >;
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
  const [tab, setTab] = React.useState(tabsNames[0]);
  return (
    <View style={{ height: "100%", gap: 10 }}>
      <PageHeader
        title="Select Template"
        rightElement={() => (
          <TightTextButton onPress={() => navigation.goBack()}>
            Cancel
          </TightTextButton>
        )}
      />
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
