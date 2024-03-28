import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Pixel, Profiles } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { IconButton, Text, ThemeProvider, useTheme } from "react-native-paper";
import { RootSiblingParent } from "react-native-root-siblings";

import { useAppSelector } from "~/app/hooks";
import { ProfilePicker } from "~/components/ProfilePicker";
import { useBottomSheetBackHandler } from "~/hooks";
import { AppStyles } from "~/styles";
import { getBottomSheetProps } from "~/themes";

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
    (state) => state.diceTransient.transfer?.profileUuid
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
      snapPoints={["92%"]}
      onDismiss={onDismiss}
      onChange={onChange}
      {...getBottomSheetProps(colors)}
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
