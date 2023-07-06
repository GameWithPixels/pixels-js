import {
  FastButton,
  PixelAppPage,
} from "@systemic-games/react-native-pixels-components";

import { useAppDispatch } from "~/app/hooks";
import { resetProfilesToDefault } from "~/features/appDataSet/profilesSetSlice";
import { removeAllPairedDice } from "~/features/pairedDiceSlice";

export function AppSettings() {
  const dispatch = useAppDispatch();
  const resetSettings = () => {
    console.log("Resetting settings");
    dispatch(removeAllPairedDice());
    dispatch(resetProfilesToDefault());
  };
  return (
    <PixelAppPage>
      <FastButton onPress={resetSettings}>Reset Settings</FastButton>
    </PixelAppPage>
  );
}
