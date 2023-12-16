import { createDataSetForProfile } from "@systemic-games/pixels-edit-animation";
import { Profiles } from "@systemic-games/react-native-pixels-connect";
import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import React from "react";
import { View, ViewProps } from "react-native";
import { MD3Theme, Text, TextInput, useTheme } from "react-native-paper";

import { RuleCard } from "./RuleCard";
import { EditRuleCallback, RulesSection, SectionTitle } from "./RulesSection";

import { helloGoodbyeFlags } from "~/actionTypes";
import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { SlideInView } from "~/components/SlideInView";
import { Banner } from "~/components/banners";
import { GradientButton, OutlineButton } from "~/components/buttons";
import { getConditionTypeLabel } from "~/descriptions";
import { DieRenderer } from "~/features/render3d/DieRenderer";
import { setShowProfileHelp } from "~/features/store/appSettingsSlice";
import { useEditableProfile } from "~/hooks";

const EditProfileDescription = observer(function ({
  profile,
  colors,
}: {
  profile: Profiles.Profile;
  colors: MD3Theme["colors"];
}) {
  return (
    <TextInput
      mode="outlined"
      multiline
      style={{ backgroundColor: colors.elevation.level0 }}
      value={profile.description}
      onChangeText={(t) => runInAction(() => (profile.description = t))}
    />
  );
});

const EditProfileGroup = observer(function ({
  profile,
  colors,
}: {
  profile: Profiles.Profile;
  colors: MD3Theme["colors"];
}) {
  return (
    <TextInput
      mode="outlined"
      style={{ backgroundColor: colors.elevation.level0 }}
      value={profile.group}
      onChangeText={(t) => runInAction(() => (profile.group = t))}
    />
  );
});

function ProfileDiceNames({ profileUuid }: { profileUuid: string }) {
  const diceNames = useAppSelector((state) => state.pairedDice.diceData)
    .filter((d) => d.profileUuid === profileUuid)
    .map((d) => d.name);
  return diceNames.length ? (
    <Text>Currently applied to: {diceNames.join(", ")}</Text>
  ) : null;
}

const ProfileUsage = observer(function ({
  profile,
}: {
  profile: Readonly<Profiles.Profile>;
}) {
  const size = createDataSetForProfile(profile)
    .toDataSet()
    .computeDataSetByteSize();
  const patternsCount = new Set(
    profile
      .collectAnimations()
      .map((a) => a.collectPatterns())
      .flat()
  ).size;
  return (
    <>
      <Text>Date created: {profile.creationDate.toLocaleString()}</Text>
      <Text>Last modified: {profile.lastChanged.toLocaleString()}</Text>
      {profile.lastUsed && (
        <Text>Last used: {profile.lastUsed.toLocaleString()}</Text>
      )}
      <Text>Memory footprint: {size} bytes</Text>
      <Text>Number of unique Color Designs: {patternsCount}</Text>
    </>
  );
});

export function EditProfile({
  profileUuid,
  unnamed,
  showActionButtons,
  onEditRule,
  style,
  ...props
}: {
  profileUuid: string;
  unnamed?: boolean;
  showActionButtons?: boolean;
  onEditRule: EditRuleCallback;
} & ViewProps) {
  const appDispatch = useAppDispatch();
  const showHelp = useAppSelector((state) => state.appSettings.showProfileHelp);
  const profile = useEditableProfile(profileUuid);
  const { colors } = useTheme();
  return (
    <SlideInView
      delay={unnamed ? 0 : 50}
      style={[{ gap: 10 }, style]}
      {...props}
    >
      <View style={{ width: "50%", aspectRatio: 1, alignSelf: "center" }}>
        <DieRenderer dieType={profile.dieType} colorway="onyxBlack" />
      </View>
      {showActionButtons && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-evenly",
            marginBottom: 10,
          }}
        >
          <OutlineButton style={{ width: "40%" }} onPress={() => {}}>
            Preview
          </OutlineButton>
          <GradientButton style={{ width: "40%" }} onPress={() => {}}>
            Activate on Die
          </GradientButton>
        </View>
      )}
      <SlideInView
        delay={unnamed ? 0 : 250}
        style={{ paddingHorizontal: 10, gap: 10 }}
      >
        {unnamed && (
          <Banner
            visible={showHelp}
            onDismiss={() => appDispatch(setShowProfileHelp(false))}
          >
            How to customize profile blah blah.
          </Banner>
        )}
        <SectionTitle>Roll Rules</SectionTitle>
        {(["rolled", "rolling"] as Profiles.ConditionType[]).map((ct) => (
          <RuleCard
            key={ct}
            profileUuid={profileUuid}
            conditionType={ct}
            flagName={ct === "rolled" ? "equal" : undefined}
            onPress={() => onEditRule({ profileUuid, conditionType: ct })}
          >
            {getConditionTypeLabel(ct)}
          </RuleCard>
        ))}
        <SectionTitle>Description</SectionTitle>
        <EditProfileDescription profile={profile} colors={colors} />
        {!unnamed && (
          <>
            <SectionTitle>Group</SectionTitle>
            <EditProfileGroup profile={profile} colors={colors} />
          </>
        )}
        <RulesSection
          profileUuid={profileUuid}
          onEditRule={onEditRule}
          conditionType="helloGoodbye"
          flags={helloGoodbyeFlags}
        />
        <SectionTitle>Profile Usage</SectionTitle>
        <View style={{ paddingLeft: 10, paddingVertical: 10, gap: 10 }}>
          {!unnamed && <ProfileDiceNames profileUuid={profileUuid} />}
          <ProfileUsage profile={profile} />
        </View>
      </SlideInView>
    </SlideInView>
  );
}
