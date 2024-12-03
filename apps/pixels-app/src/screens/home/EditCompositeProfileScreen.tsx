import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import React from "react";
import { View, ScrollView } from "react-native";
import { Button, MD3Theme, TextInput, useTheme } from "react-native-paper";

import {
  EditRuleCallback,
  SectionTitle,
} from "../profiles/components/RulesSection";

import { EditCompositeProfileScreenProps } from "~/app/navigation";
import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import { SelectedPixelTransferProgressBar } from "~/components/PixelTransferProgressBar";
import {
  useCommitEditableCompositeProfile,
  useEditableCompositeProfile,
} from "~/hooks";

const EditProfileText = observer(function EditProfileDescription({
  valueName,
  getValue,
  setValue,
  multiline,
  colors,
}: {
  valueName: string;
  getValue: () => string | undefined;
  setValue: (text: string) => void;
  multiline?: boolean;
  colors: MD3Theme["colors"];
}) {
  return (
    <TextInput
      mode="outlined"
      multiline={multiline}
      dense
      maxLength={200}
      style={{ backgroundColor: colors.elevation.level0 }}
      contentStyle={{ marginVertical: 10 }}
      value={getValue()}
      onChangeText={(t) => runInAction(() => setValue(t))}
      placeholder={"This profile has no " + valueName}
      placeholderTextColor={colors.onSurfaceDisabled}
    />
  );
});

function EditCompositeProfilePage({
  profileUuid,
  onEditRule,
  onGoBack,
}: {
  profileUuid: string;
  onEditRule: EditRuleCallback;
  onGoBack: () => void;
}) {
  const profile = useEditableCompositeProfile(profileUuid);
  const commitProfile = useCommitEditableCompositeProfile(profileUuid);

  const { colors } = useTheme();
  return (
    <View style={{ height: "100%" }}>
      <PageHeader
        // mode="arrow-left" onGoBack={onGoBack}
        rightElement={() => (
          <Button
            sentry-label="commit-edit-composite-profile"
            onPress={() => {
              commitProfile();
              onGoBack();
            }}
          >
            Done
          </Button>
        )}
      >
        Composite Profile
      </PageHeader>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        alwaysBounceVertical={false}
        contentContainerStyle={{
          paddingHorizontal: 10,
          paddingBottom: 10,
          gap: 10,
        }}
      >
        <SectionTitle>Name</SectionTitle>
        <EditProfileText
          valueName="name"
          getValue={() => profile.name}
          setValue={(t) => (profile.name = t)}
          colors={colors}
        />
        <SectionTitle>Description</SectionTitle>
        <EditProfileText
          valueName="description"
          multiline
          getValue={() => profile.description}
          setValue={(t) => (profile.description = t)}
          colors={colors}
        />
        <SectionTitle>Formula</SectionTitle>
        <EditProfileText
          valueName="formula"
          getValue={() => profile.formula}
          setValue={(t) => (profile.formula = t)}
          colors={colors}
        />
      </ScrollView>
    </View>
  );
}

export function EditCompositeProfileScreen({
  route: {
    params: { profileUuid },
  },
  navigation,
}: EditCompositeProfileScreenProps) {
  return (
    <AppBackground>
      <EditCompositeProfilePage
        profileUuid={profileUuid}
        onEditRule={(ruleIndex) => {}} //navigation.navigate("editRule", ruleIndex)}
        onGoBack={() => navigation.goBack()}
      />
      <SelectedPixelTransferProgressBar />
    </AppBackground>
  );
}
