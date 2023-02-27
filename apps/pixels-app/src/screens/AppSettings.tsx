import { PixelAppPage } from "@systemic-games/react-native-pixels-components";
import { Button } from "native-base";

import { useAppDispatch } from "~/app/hooks";
import { resetProfilesToDefault } from "~/features/appDataSet/profilesSetSlice";
import { removeAllPairedDice } from "~/features/pairedDiceSlice";

export default function () {
  const dispatch = useAppDispatch();
  const resetSettings = () => {
    console.log("Resetting settings");
    dispatch(removeAllPairedDice());
    dispatch(resetProfilesToDefault());
  };
  return (
    <PixelAppPage>
      <Button onPress={resetSettings}>Reset Settings</Button>
    </PixelAppPage>
  );
}
