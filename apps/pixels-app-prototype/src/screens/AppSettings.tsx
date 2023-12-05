import {
  BaseButton,
  PixelAppPage,
  PixelThemeProvider,
} from "@systemic-games/react-native-pixels-components";

import { useAppDispatch } from "~/app/hooks";
import { resetProfilesToDefault } from "~/features/appDataSet/profilesLibrarySlice";
import { removeAllPairedDice } from "~/features/pairedDiceSlice";

export function AppSettings() {
  const dispatch = useAppDispatch();
  const resetSettings = () => {
    console.log("Resetting settings...");
    dispatch(removeAllPairedDice());
    dispatch(resetProfilesToDefault());
  };
  return (
    <PixelThemeProvider accent="yellow">
      <PixelAppPage>
        <BaseButton onPress={resetSettings}>Reset Settings</BaseButton>
      </PixelAppPage>
    </PixelThemeProvider>
  );
}
