import { Pixel, Profiles } from "@systemic-games/react-native-pixels-connect";
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

import { RuleCard } from "./RuleCard";
import { EditRuleCallback, RulesSection, SectionTitle } from "./RulesSection";

import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { PickDieBottomSheet } from "~/components/PickDieBottomSheet";
import { SlideInView } from "~/components/SlideInView";
import { Banner } from "~/components/banners";
import { GradientButton } from "~/components/buttons";
import { ProfileDieRenderer } from "~/components/profile";
import {
  EditorAnimationFlags,
  EditorRollRulesTypes,
  getCompatibleDiceTypes,
  getConditionTypeLabel,
} from "~/features/profiles";
import { setShowProfileHelp } from "~/features/store/appSettingsSlice";
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
      dense
      maxLength={200}
      style={{ backgroundColor: colors.elevation.level0 }}
      contentStyle={{ marginVertical: 10 }}
      value={profile.description}
      onChangeText={(t) => runInAction(() => (profile.description = t))}
      placeholder="This profile has no description"
      placeholderTextColor={colors.onSurfaceDisabled}
    />
  );
});

function ProfileDiceNames({ profileUuid }: { profileUuid: string }) {
  const diceNames = useAppSelector((state) => state.pairedDice.dice)
    .filter((d) => d.isPaired && d.profileUuid === profileUuid)
    .map((d) => d.name);
  return (
    <Text>
      {diceNames.length
        ? `Currently applied to: ${diceNames.join(", ")}`
        : "Profile not in use."}
    </Text>
  );
}

function TransferProfileButton({ onPress }: { onPress: () => void }) {
  const profileUuid = useAppSelector(
    (state) => state.diceRolls.transfer?.profileUuid
  );
  const { colors } = useTheme();
  return (
    <View>
      <GradientButton
        disabled={!!profileUuid}
        sentry-label="activate-on-die"
        onPress={onPress}
      >
        Activate On Die
      </GradientButton>
      {!!profileUuid && (
        <ActivityIndicator
          style={{ position: "absolute", alignSelf: "center", top: 5 }}
        />
      )}
      <Text style={{ marginVertical: 5, color: colors.onSurfaceDisabled }}>
        Activating this profile will also save your changes.
      </Text>
    </View>
  );
}

export function EditProfile({
  profileUuid,
  unnamed,
  onEditRule,
  onTransfer,
  style,
  ...props
}: {
  profileUuid: string;
  unnamed?: boolean;
  onEditRule: EditRuleCallback;
  onTransfer?: (pixel: Pixel) => void;
} & ViewProps) {
  const appDispatch = useAppDispatch();
  const showHelp = useAppSelector((state) => state.appSettings.showProfileHelp);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialShowHelp = React.useMemo(() => showHelp, []); // TODO need banner fix to not initially show empty view
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
        {onTransfer && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-evenly",
              marginVertical: 10,
            }}
          >
            {/* <OutlineButton
              sentry-label="preview-on-die"
              style={{ width: "40%" }}
              onPress={() => {}}
            >
              Preview
            </OutlineButton> */}
            <TransferProfileButton onPress={() => setPickDieVisible(true)} />
          </View>
        )}
        <SlideInView
          delay={unnamed ? 0 : 250}
          style={{ paddingHorizontal: 10, gap: 10 }}
        >
          {initialShowHelp && (
            <Banner
              visible={showHelp}
              collapsedMarginBottom={-10}
              onDismiss={() => appDispatch(setShowProfileHelp(false))}
            >
              A Profile is composed of rules that dictate what action to take on
              rolls and others dice events.{"\n\n"}
              Tap on the Activate button above to apply a Profile to one of your
              die.
            </Banner>
          )}
          <SectionTitle>Roll Rules</SectionTitle>
          {EditorRollRulesTypes.map((ct) => (
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
            flags={EditorAnimationFlags.helloGoodbye}
          />
          <SectionTitle>Profile Usage</SectionTitle>
          <View style={{ paddingLeft: 10, paddingBottom: 10 }}>
            <ProfileDiceNames profileUuid={profileUuid} />
          </View>
        </SlideInView>
      </SlideInView>
      <PickDieBottomSheet
        dieTypes={getCompatibleDiceTypes(profile.dieType)}
        visible={pickDieVisible}
        onDismiss={(pixel) => {
          if (pixel) {
            onTransfer?.(pixel);
          }
          setPickDieVisible(false);
        }}
      />
    </>
  );
}
