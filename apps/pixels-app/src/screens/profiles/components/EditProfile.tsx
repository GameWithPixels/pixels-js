import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Profiles } from "@systemic-games/react-native-pixels-connect";
import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import React from "react";
import { View, ViewProps } from "react-native";
import {
  MD3Theme,
  Text,
  TextInput,
  TextProps,
  useTheme,
} from "react-native-paper";

import { RuleCard } from "./RuleCard";
import { EditRuleCallback, RulesSection, SectionTitle } from "./RulesSection";

import { PairedDie } from "~/app/PairedDie";
import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { PickDieBottomSheet } from "~/components/PickDieBottomSheet";
import { ProfileDieRenderer } from "~/components/ProfileDieRenderer";
import { SlideInView } from "~/components/SlideInView";
import { SliderWithValue } from "~/components/SliderWithValue";
import { Banner } from "~/components/banners";
import { GradientButton } from "~/components/buttons";
import {
  EditorAnimationFlags,
  EditorRollRulesTypes,
  getCompatibleDiceTypes,
  getConditionTypeLabel,
} from "~/features/profiles";
import { setShowProfileHelp } from "~/features/store";
import { useDiceNamesForProfile, useEditableProfile } from "~/hooks";

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

function ProfileDiceNames({
  profileUuid,
  ...props
}: { profileUuid: string } & Omit<TextProps<string>, "children">) {
  const diceNames = useDiceNamesForProfile(profileUuid);
  return (
    diceNames.length > 0 && (
      <Text {...props}>Copied to {diceNames.join(", ")}</Text>
    )
  );
}

function SourceProfileName({
  profileUuid,
  ...props
}: { profileUuid: string } & Omit<TextProps<string>, "children">) {
  const sourceUuid = useAppSelector(
    (state) => state.library.profiles.entities[profileUuid]
  )?.sourceUuid;
  const sourceProfileName = useAppSelector((state) =>
    sourceUuid ? state.library.profiles.entities[sourceUuid] : undefined
  )?.name;
  return (
    sourceProfileName && <Text {...props}>Copied from {sourceProfileName}</Text>
  );
}

const BrightnessSlider = observer(function BrightnessSlider({
  profile,
}: {
  profile: Profiles.Profile;
}) {
  return (
    <SliderWithValue
      percentage
      value={profile.brightness}
      onEndEditing={(v) => runInAction(() => (profile.brightness = v))}
    />
  );
});

export function EditProfile({
  profileUuid,
  unnamed,
  onEditRule,
  onProgramDie,
  style,
  ...props
}: {
  profileUuid: string;
  unnamed?: boolean;
  onEditRule: EditRuleCallback;
  onProgramDie?: (pairedDie: PairedDie) => void;
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
        <ProfileDiceNames
          profileUuid={profileUuid}
          variant="bodyLarge"
          style={{ alignSelf: "center", marginTop: 10 }}
        />
        <SourceProfileName
          profileUuid={profileUuid}
          variant="bodyLarge"
          style={{ alignSelf: "center", marginTop: 10 }}
        />
        {onProgramDie && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-evenly",
              marginVertical: 10,
            }}
          >
            <View>
              <GradientButton
                sentry-label="copy-to-dice"
                icon={({ size, color }) => (
                  <MaterialCommunityIcons
                    name="send"
                    size={size}
                    color={color}
                  />
                )}
                onPress={() => setPickDieVisible(true)}
              >
                Copy To Dice
              </GradientButton>
              <Text
                style={{ marginVertical: 5, color: colors.onSurfaceDisabled }}
              >
                Copying this profile to a die will also save your changes.
              </Text>
            </View>
          </View>
        )}
        <SlideInView
          delay={unnamed ? 0 : 250}
          style={{ paddingHorizontal: 10, gap: 10 }}
        >
          <Banner
            visible={showHelp}
            collapsedMarginBottom={-10}
            onDismiss={() => appDispatch(setShowProfileHelp(false))}
          >
            A Profile is composed of rules that dictate what action to take on
            rolls and others dice events.{"\n\n"}
            Tap on the "Copy To Dice" button above to copy the Profile to one or
            more of your dice.
          </Banner>
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
          <SectionTitle>Brightness</SectionTitle>
          <BrightnessSlider profile={profile} />
          {!unnamed && <SectionTitle>Description</SectionTitle>}
          {!unnamed && (
            <EditProfileDescription profile={profile} colors={colors} />
          )}
          <RulesSection
            profileUuid={profileUuid}
            onEditRule={onEditRule}
            conditionType="helloGoodbye"
            flags={EditorAnimationFlags.helloGoodbye}
          />
        </SlideInView>
      </SlideInView>
      <PickDieBottomSheet
        dieTypes={getCompatibleDiceTypes(profile.dieType)}
        visible={pickDieVisible}
        onDismiss={(pairedDie) => {
          if (pairedDie) {
            onProgramDie?.(pairedDie);
          }
          setPickDieVisible(false);
        }}
      />
    </>
  );
}
