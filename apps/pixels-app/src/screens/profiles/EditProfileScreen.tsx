import { Profiles } from "@systemic-games/react-native-pixels-connect";
import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import React from "react";
import {
  Platform,
  Pressable,
  TextInput as RNTextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";
import { Button, Text, TextInput, useTheme } from "react-native-paper";

import { EditProfile } from "./components/EditProfile";
import { ProfileMenu } from "./components/ProfileMenu";
import { RuleIndex } from "./components/RuleCard";

import { AppBackground } from "~/components/AppBackground";
import { ChevronDownIcon } from "~/components/ChevronDownIcon";
import { PageHeader } from "~/components/PageHeader";
import { makeTransparent } from "~/components/utils";
import {
  useCommitEditableProfile,
  useConfirmActionSheet,
  useEditableProfile,
  useEditProfilesList,
} from "~/hooks";
import { EditProfileScreenProps } from "~/navigation";

interface HeaderTextInputHandle {
  focusEditName: () => void;
}

const Header = observer(
  React.forwardRef(function (
    {
      profile,
      onCommitChanges,
      onDiscardChanges,
      onEditAdvancedRules,
      onDeleteProfile,
    }: {
      profile: Profiles.Profile;
      onCommitChanges: () => void;
      onDiscardChanges?: () => void;
      confirmDiscard?: () => void;
      onEditAdvancedRules: () => void;
      onDeleteProfile?: () => void;
    },
    ref: React.ForwardedRef<HeaderTextInputHandle>
  ) {
    const [renameVisible, setRenameVisible] = React.useState(false);
    const textInputRef = React.useRef<RNTextInput>(null);
    React.useEffect(() => {
      if (renameVisible && textInputRef.current) {
        textInputRef.current?.focus();
      }
    }, [renameVisible]);

    React.useImperativeHandle(
      ref,
      () => ({
        focusEditName: () => setRenameVisible(true),
      }),
      []
    );

    const [actionsMenuVisible, setActionsMenuVisible] = React.useState(false);
    const { width: windowWidth } = useWindowDimensions();
    const { colors } = useTheme();
    const color = actionsMenuVisible
      ? colors.onSurfaceDisabled
      : colors.onSurface;

    return (
      <PageHeader
        mode="chevron-down"
        leftElement={
          onDiscardChanges
            ? () => <Button onPress={onDiscardChanges}>Cancel</Button>
            : undefined
        }
        rightElement={
          !onDiscardChanges || profile.isModified
            ? () => <Button onPress={onCommitChanges}>Done</Button>
            : undefined
        }
      >
        {renameVisible ? (
          <TextInput
            ref={textInputRef}
            mode="flat"
            dense
            selectTextOnFocus={Platform.OS !== "android"} // keyboard not appearing on Android
            style={{ marginHorizontal: 60, textAlign: "center" }}
            value={profile.name}
            onChangeText={(t) => runInAction(() => (profile.name = t))}
            onEndEditing={() => setRenameVisible(false)}
          />
        ) : (
          <Pressable
            onPress={() => setActionsMenuVisible(true)}
            style={{
              alignSelf: "center",
              flexDirection: "row",
              alignItems: "flex-end",
            }}
          >
            <Text variant="titleMedium" style={{ paddingHorizontal: 5, color }}>
              {profile.name}
            </Text>
            <ChevronDownIcon
              size={18}
              color={color}
              backgroundColor={makeTransparent(colors.onBackground, 0.2)}
              style={{ marginBottom: 3 }}
            />
            <ProfileMenu
              visible={actionsMenuVisible}
              contentStyle={{
                marginTop: Platform.select({ ios: 10, default: 20 }),
                width: 230,
              }}
              anchor={{ x: (windowWidth - 250) / 2, y: 60 }}
              onDismiss={() => setActionsMenuVisible(false)}
              onRename={() => setRenameVisible(true)}
              onEditAdvancedRules={onEditAdvancedRules}
              onDelete={onDeleteProfile}
            />
          </Pressable>
        )}
      </PageHeader>
    );
  })
);

function EditProfilePage({
  profileUuid,
  noDiscard,
  editName,
  navigation,
}: {
  profileUuid: string;
  noDiscard?: boolean;
  editName?: boolean;
  navigation: EditProfileScreenProps["navigation"];
}) {
  const profile = useEditableProfile(profileUuid);
  const { removeProfile } = useEditProfilesList();
  const { commitProfile, discardProfile } = useCommitEditableProfile();
  const goBack = React.useCallback(() => navigation.goBack(), [navigation]);
  const commitChanges = React.useCallback(() => {
    commitProfile(profileUuid);
    goBack();
  }, [commitProfile, goBack, profileUuid]);
  const discardChanges = React.useCallback(() => {
    discardProfile(profileUuid);
    goBack();
  }, [discardProfile, goBack, profileUuid]);
  const showConfirmDiscard = useConfirmActionSheet(
    "Discard changes",
    discardChanges
  );
  const editRule = React.useCallback(
    (ruleIndex: RuleIndex) => {
      if (ruleIndex.conditionType === "rolled") {
        navigation.navigate("editRollRules", ruleIndex);
      } else {
        navigation.navigate("editRule", ruleIndex);
      }
    },
    [navigation]
  );

  const showConfirmDelete = useConfirmActionSheet("Delete", () => {
    removeProfile(profileUuid);
    goBack();
  });

  const headerRef = React.useRef<HeaderTextInputHandle>(null);
  // Focus on name text input when editName is true
  // When showing the screen for the first time
  React.useEffect(() => {
    editName && headerRef.current?.focusEditName();
  }, [editName]);

  return (
    <View style={{ height: "100%" }}>
      <Header
        ref={headerRef}
        profile={profile}
        onCommitChanges={commitChanges}
        onDiscardChanges={
          noDiscard
            ? undefined
            : () => (profile.isModified ? showConfirmDiscard : discardChanges)()
        }
        onEditAdvancedRules={() =>
          navigation.navigate("editAdvancedRules", { profileUuid })
        }
        onDeleteProfile={showConfirmDelete}
      />
      <GHScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: 10 }}
      >
        <EditProfile
          showActionButtons
          profileUuid={profileUuid}
          onEditRule={editRule}
        />
      </GHScrollView>
    </View>
  );
}

export function EditProfileScreen({
  route: {
    params: { profileUuid, noDiscard, editName },
  },
  navigation,
}: EditProfileScreenProps) {
  return (
    <AppBackground>
      <EditProfilePage
        profileUuid={profileUuid}
        noDiscard={noDiscard}
        editName={editName}
        navigation={navigation}
      />
    </AppBackground>
  );
}
