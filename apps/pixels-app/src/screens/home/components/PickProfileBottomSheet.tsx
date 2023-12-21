import { BottomSheetBackdrop, BottomSheetModal } from "@gorhom/bottom-sheet";
import { Pixel, Profiles } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { Text, ThemeProvider, useTheme } from "react-native-paper";

import { ProfilePicker } from "~/components/ProfilePicker";
import { getBottomSheetBackgroundStyle } from "~/themes";

// export function PickProfileBottomSheet({
//   dieType,
//   selected,
//   visible,
//   onDismiss,
// }: {
//   dieType: PixelDieType;
//   selected?: Profiles.Profile;
//   visible: boolean;
//   onDismiss?: (profile: Profiles.Profile) => void;
// }) {
//   return <></>;
// }

export function PickProfileBottomSheet({
  pixel,
  profile,
  transferring,
  onSelectProfile,
  visible,
  onDismiss,
}: {
  pixel: Pixel;
  profile?: Readonly<Profiles.Profile>;
  transferring: boolean;
  onSelectProfile: (profile: Readonly<Profiles.Profile>) => void;
  visible: boolean;
  onDismiss: () => void;
}) {
  const sheetRef = React.useRef<BottomSheetModal>(null);
  React.useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  const theme = useTheme();
  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={["50%", "92%"]}
      index={1}
      onDismiss={onDismiss}
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
      <ThemeProvider theme={theme}>
        <Text
          variant="titleMedium"
          style={{ alignSelf: "center", paddingVertical: 10 }}
        >
          Active Profile on {pixel.name}
        </Text>
        <ProfilePicker
          selected={profile}
          dieType={pixel.dieType}
          transferring={transferring}
          onSelectProfile={onSelectProfile}
          style={{ flex: 1, flexGrow: 1, marginHorizontal: 10 }}
        />
      </ThemeProvider>
    </BottomSheetModal>
  );
}
