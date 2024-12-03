import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import React from "react";
import { View, ScrollView } from "react-native";
import {
  Button,
  MD3Theme,
  Switch,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

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

const EditProfileString = observer(function EditProfileString({
  valueName,
  getValue,
  setValue,
  multiline,
  colors,
}: {
  valueName: string;
  getValue: () => string | undefined;
  setValue: (value: string) => void;
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
      onChangeText={(v) => runInAction(() => setValue(v))}
      placeholder={"This profile has no " + valueName}
      placeholderTextColor={colors.onSurfaceDisabled}
    />
  );
});

const EditProfileBool = observer(function EditProfileString({
  label,
  getValue,
  setValue,
}: {
  label: string;
  getValue: () => boolean | undefined;
  setValue: (value: boolean) => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        marginHorizontal: 10,
        marginTop: 5,
        alignItems: "center",
        gap: 10,
      }}
    >
      <Switch
        value={getValue()}
        onValueChange={(v) => runInAction(() => setValue(v))}
      />
      <Text>{label}</Text>
    </View>
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
        <EditProfileString
          valueName="name"
          getValue={() => profile.name}
          setValue={(v) => (profile.name = v)}
          colors={colors}
        />
        <SectionTitle>Description</SectionTitle>
        <EditProfileString
          valueName="description"
          multiline
          getValue={() => profile.description}
          setValue={(v) => (profile.description = v)}
          colors={colors}
        />
        <SectionTitle>Formula</SectionTitle>
        <EditProfileString
          valueName="formula"
          getValue={() => profile.formula}
          setValue={(v) => (profile.formula = v)}
          colors={colors}
        />
        <SectionTitle>Speak Result</SectionTitle>
        <EditProfileBool
          label="Whether to speak the formula result"
          getValue={() => profile.speakResult}
          setValue={(v) => (profile.speakResult = v)}
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
