import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Profiles } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { IconButton, Text, ThemeProvider, useTheme } from "react-native-paper";
import { RootSiblingParent } from "react-native-root-siblings";

import { PairedDie } from "~/app/PairedDie";
import { ProfilePicker } from "~/components/ProfilePicker";
import { useBottomSheetBackHandler, useIsTransferring } from "~/hooks";
import { AppStyles } from "~/styles";
import { getBottomSheetProps } from "~/themes";

export function PickProfileBottomSheet({
  pairedDie,
  visible,
  onSelectProfile,
  onDismiss,
}: {
  pairedDie: PairedDie;
  visible: boolean;
  onSelectProfile: (profile: Readonly<Profiles.Profile>) => void;
  onDismiss: () => void;
}) {
  const transferring = useIsTransferring(pairedDie);
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
            Select Profile for {pairedDie.name}
          </Text>
          {transferring ? (
            <Text
              variant="bodyLarge"
              style={{ alignSelf: "center", paddingVertical: 20 }}
            >
              A Profile activation is already in progress.
            </Text>
          ) : (
            <ProfilePicker
              dieType={pairedDie.dieType}
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
