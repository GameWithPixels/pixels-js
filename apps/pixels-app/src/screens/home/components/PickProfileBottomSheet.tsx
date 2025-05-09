import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Profiles } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { Text, ThemeProvider, useTheme } from "react-native-paper";
import { RootSiblingParent } from "react-native-root-siblings";

import { PairedDie } from "~/app/PairedDie";
import { AppStyles } from "~/app/styles";
import { getBottomSheetProps } from "~/app/themes";
import { ProfilePicker } from "~/components/ProfilePicker";
import { TopRightCloseButton } from "~/components/buttons";
import { useBottomSheetBackHandler } from "~/hooks";

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
            Select a Profile to copy to your die
          </Text>
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
          <TopRightCloseButton onPress={onDismiss} />
        </ThemeProvider>
      </RootSiblingParent>
    </BottomSheetModal>
  );
}
