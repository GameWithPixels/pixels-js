import { BottomSheetBackdrop, BottomSheetModal } from "@gorhom/bottom-sheet";
import { Pixel, Profiles } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { IconButton, Text, ThemeProvider, useTheme } from "react-native-paper";
import { RootSiblingParent } from "react-native-root-siblings";

import { useAppSelector } from "~/app/hooks";
import { ProfilePicker } from "~/components/ProfilePicker";
import { bottomSheetAnimationConfigFix } from "~/fixes";
import { useBottomSheetBackHandler } from "~/hooks/useBottomSheetBackHandler";
import { AppStyles } from "~/styles";
import { getBottomSheetBackgroundStyle } from "~/themes";

export function PickProfileBottomSheet({
  pixel,
  profile,
  onSelectProfile,
  visible,
  onDismiss,
}: {
  pixel: Pixel;
  profile?: Readonly<Profiles.Profile>;
  onSelectProfile: (profile: Readonly<Profiles.Profile>) => void;
  visible: boolean;
  onDismiss: () => void;
}) {
  const profileUuid = useAppSelector(
    (state) => state.diceRolls.transfer?.profileUuid
  );

  const sheetRef = React.useRef<BottomSheetModal>(null);
  const onChange = useBottomSheetBackHandler(sheetRef);
  React.useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  const theme = useTheme();
  const { colors } = theme;
  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={["50%", "92%"]}
      index={1}
      onDismiss={onDismiss}
      onChange={onChange}
      animationConfigs={bottomSheetAnimationConfigFix}
      backgroundStyle={getBottomSheetBackgroundStyle()}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          appearsOnIndex={1}
          disappearsOnIndex={-1}
          pressBehavior="close"
          {...props}
        />
      )}
    >
      <RootSiblingParent>
        <ThemeProvider theme={theme}>
          <Text variant="titleMedium" style={AppStyles.selfCentered}>
            Select Profile for {pixel.name}
          </Text>
          {profileUuid ? (
            <Text
              variant="bodyLarge"
              style={{ alignSelf: "center", paddingVertical: 20 }}
            >
              A Profile activation is already in progress.
            </Text>
          ) : (
            <ProfilePicker
              selected={profile}
              dieType={pixel.dieType}
              onSelectProfile={onSelectProfile}
              style={{
                flex: 1,
                flexGrow: 1,
                marginHorizontal: 10,
                marginTop: 10,
              }}
            />
          )}
          <IconButton
            icon="close"
            iconColor={colors.primary}
            sentry-label="close-pick-profile"
            style={{ position: "absolute", right: 0, top: -15 }}
            onPress={onDismiss}
          />
        </ThemeProvider>
      </RootSiblingParent>
    </BottomSheetModal>
  );
}
