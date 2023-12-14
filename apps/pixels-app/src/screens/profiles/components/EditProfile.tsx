import { MaterialCommunityIcons } from "@expo/vector-icons";
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
import { useAppSelector } from "~/app/hooks";
import { SlideInView } from "~/components/SlideInView";
import { Banner } from "~/components/banners";
import {
  GradientButton,
  OutlineButton,
  TightTextButton,
} from "~/components/buttons";
import { getConditionTypeLabel } from "~/descriptions";
import { DieRenderer } from "~/features/render3d/DieRenderer";
import { useEditableProfile } from "~/hooks";

const EditProfileName = observer(function ({
  profile,
  colors,
}: {
  profile: Profiles.Profile;
  colors: MD3Theme["colors"];
}) {
  return (
    <TextInput
      mode="outlined"
      dense
      style={{ backgroundColor: colors.elevation.level0 }}
      value={profile.name}
      onChangeText={(t) => runInAction(() => (profile.name = t))}
    />
  );
});

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
      <Text>Memory footprint: {size} bytes</Text>
      <Text>Number of unique Color Designs: {patternsCount}</Text>
    </>
  );
});

function ProfileAdvancedActions({
  children,
  onEditAdvancedRules,
  onDelete,
}: React.PropsWithChildren<{
  onEditAdvancedRules: () => void;
  onDelete?: () => void;
}>) {
  return (
    <View
      style={{
        alignItems: "flex-start",
        marginTop: -10,
        paddingVertical: 10,
      }}
    >
      <TightTextButton
        icon={({ size, color }) => (
          <MaterialCommunityIcons name="cog" size={size} color={color} />
        )}
        labelStyle={{ textDecorationLine: "underline" }}
        onPress={onEditAdvancedRules}
      >
        Edit Advanced Rules
      </TightTextButton>
      {/* <TightTextButton
        icon={({ size, color }) => (
          <MaterialCommunityIcons name="share" size={size} color={color} />
        )}
        labelStyle={{ textDecorationLine: "underline" }}
      >
        Share
      </TightTextButton> */}
      {children}
      {onDelete && (
        <TightTextButton
          icon={({ size, color }) => (
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={size}
              color={color}
            />
          )}
          labelStyle={{ textDecorationLine: "underline" }}
          onPress={onDelete}
        >
          Delete Profile
        </TightTextButton>
      )}
    </View>
  );
}

export function EditProfile({
  profileUuid,
  unnamed,
  showActionButtons,
  onEditRule,
  onEditAdvancedRules,
  onDelete,
  style,
  ...props
}: {
  profileUuid: string;
  unnamed?: boolean;
  showActionButtons?: boolean;
  onEditRule: EditRuleCallback;
  onEditAdvancedRules: () => void;
  onDelete?: () => void;
} & ViewProps) {
  const [showHelpBanner, setShowHelpBanner] = React.useState(true);
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
            visible={showHelpBanner}
            onDismiss={() => setShowHelpBanner(false)}
          >
            How to customize profile blah blah.
          </Banner>
        )}
        {!unnamed && <SectionTitle>Profile Name</SectionTitle>}
        {!unnamed && <EditProfileName profile={profile} colors={colors} />}
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
        <SectionTitle>More Actions</SectionTitle>
        <ProfileAdvancedActions
          onEditAdvancedRules={onEditAdvancedRules}
          onDelete={onDelete}
        >
          {unnamed && (
            <TightTextButton
              icon={({ size, color }) => (
                <MaterialCommunityIcons
                  name="content-save"
                  size={size}
                  color={color}
                />
              )}
              labelStyle={{ textDecorationLine: "underline" }}
            >
              Save as Standalone Profile
            </TightTextButton>
          )}
        </ProfileAdvancedActions>
      </SlideInView>
    </SlideInView>
  );
}
