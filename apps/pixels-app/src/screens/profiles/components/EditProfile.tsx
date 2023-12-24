import { createDataSetForProfile } from "@systemic-games/pixels-edit-animation";
import { Profiles } from "@systemic-games/react-native-pixels-connect";
import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import React from "react";
import { View, ViewProps } from "react-native";
import {
  ActivityIndicator,
  MD3Theme,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

import { PickDieBottomSheet } from "./PickDieBottomSheet";
import { RuleCard } from "./RuleCard";
import { EditRuleCallback, RulesSection, SectionTitle } from "./RulesSection";

import { helloGoodbyeFlags } from "~/actionTypes";
import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { SlideInView } from "~/components/SlideInView";
import { Banner } from "~/components/banners";
import { GradientButton } from "~/components/buttons";
import { ProfileDieRenderer } from "~/components/profile";
import { getConditionTypeLabel } from "~/descriptions";
import { setShowProfileHelp } from "~/features/store/appSettingsSlice";
import { transferProfile } from "~/features/transferProfile";
import { useEditableProfile } from "~/hooks";

const EditProfileDescription = observer(function EditProfileDescription({
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

function ProfileDiceNames({ profileUuid }: { profileUuid: string }) {
  const diceNames = useAppSelector((state) => state.pairedDice.dice)
    .filter((d) => d.isPaired && d.profileUuid === profileUuid)
    .map((d) => d.name);
  return diceNames.length ? (
    <Text>Currently applied to: {diceNames.join(", ")}</Text>
  ) : null;
}

const ProfileUsage = observer(function ProfileUsage({
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

export function TransferProfileButton({ onPress }: { onPress: () => void }) {
  const profileUuid = useAppSelector(
    (state) => state.diceRolls.transfer?.profileUuid
  );
  return (
    <View>
      <GradientButton disabled={!!profileUuid} onPress={onPress}>
        Activate On Die
      </GradientButton>
      {!!profileUuid && (
        <ActivityIndicator
          style={{ position: "absolute", alignSelf: "center", top: 5 }}
        />
      )}
    </View>
  );
}

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
  const [pickDieVisible, setPickDieVisible] = React.useState(false);
  const { colors } = useTheme();
  return (
    <>
      <SlideInView
        delay={unnamed ? 0 : 50}
        style={[{ gap: 10 }, style]}
        {...props}
      >
        <View style={{ width: "70%", aspectRatio: 1.4, alignSelf: "center" }}>
          <ProfileDieRenderer profile={profile} pedestal />
        </View>
        {showActionButtons && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-evenly",
              marginVertical: 10,
            }}
          >
            {/* <OutlineButton style={{ width: "40%" }} onPress={() => {}}>
              Preview
            </OutlineButton> */}
            <TransferProfileButton onPress={() => setPickDieVisible(true)} />
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
              In this screen you may customize the profile running on your die.
            </Banner>
          )}
          <SectionTitle>Roll Rules</SectionTitle>
          {(["rolled", "rolling"] as Profiles.ConditionType[]).map((ct) => (
            <RuleCard
              key={ct}
              profileUuid={profileUuid}
              conditionType={ct}
              onPress={() => onEditRule({ profileUuid, conditionType: ct })}
            >
              {getConditionTypeLabel(ct)}
            </RuleCard>
          ))}
          <SectionTitle>Description</SectionTitle>
          <EditProfileDescription profile={profile} colors={colors} />
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
      <PickDieBottomSheet
        dieType={profile.dieType}
        visible={pickDieVisible}
        onDismiss={(pixel) => {
          if (pixel) {
            transferProfile(pixel, profile);
          }
          setPickDieVisible(false);
        }}
      />
    </>
  );
}
