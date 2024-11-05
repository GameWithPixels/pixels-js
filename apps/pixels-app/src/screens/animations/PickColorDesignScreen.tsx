import { Profiles } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { View, ScrollView } from "react-native";

import { PickColorDesignScreenProps } from "~/app/navigation";
import { AppBackground } from "~/components/AppBackground";
import { ColorDesignPicker } from "~/components/ColorDesignPicker";
import { PageHeader } from "~/components/PageHeader";

function PickColorDesignPage({
  pattern,
  onSelectPattern,
  navigation,
}: {
  pattern?: Readonly<Profiles.Pattern>;
  onSelectPattern?: (pattern: Readonly<Profiles.Pattern>) => void;
  navigation: PickColorDesignScreenProps["navigation"];
}) {
  return (
    <View style={{ height: "100%", gap: 10 }}>
      <PageHeader mode="chevron-down" onGoBack={() => navigation.goBack()}>
        Select Color Design
      </PageHeader>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        alwaysBounceVertical={false}
      >
        <ColorDesignPicker
          pattern={pattern}
          onSelectPattern={onSelectPattern}
          style={{ flex: 1, flexGrow: 1, marginHorizontal: 10 }}
        />
      </ScrollView>
    </View>
  );
}

export function PickColorDesignScreen({
  route: {
    params: { pattern, onSelectPattern },
  },
  navigation,
}: PickColorDesignScreenProps) {
  return (
    <AppBackground>
      <PickColorDesignPage
        pattern={pattern}
        onSelectPattern={onSelectPattern}
        navigation={navigation}
      />
    </AppBackground>
  );
}
