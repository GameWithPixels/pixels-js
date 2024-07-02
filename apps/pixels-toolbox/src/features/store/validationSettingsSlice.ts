import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { PrebuildProfileName } from "@systemic-games/pixels-edit-animation";
import {
  PixelColorway,
  PixelDieType,
} from "@systemic-games/react-native-pixels-connect";

import { DiceSetType } from "~/features/validation";

export interface ValidationSettingsState {
  customFirmwareAndProfile?: boolean; // Select with selectCustomFirmwareAndProfile
  profileName?: PrebuildProfileName; // Select with selectProfileName
  skipPrintLabel?: boolean; // Select with selectSkipPrintLabel
  skipBatteryLevel?: boolean; // Select with selectSkipBatteryLevel
  cartonLabel: {
    asn: string;
    productType: PixelDieType | DiceSetType;
    colorway: PixelColorway;
    quantity: number;
  };
  diceSetLabel: {
    setType: DiceSetType;
    colorway: PixelColorway;
  };
}

const initialState: ValidationSettingsState = {
  cartonLabel: {
    asn: "",
    productType: "unknown",
    colorway: "unknown",
    quantity: 64,
  },
  diceSetLabel: {
    setType: "unknown",
    colorway: "unknown",
  },
};

// Redux slice that stores validation settings
const validationSettingsSlice = createSlice({
  name: "validationSettings",
  initialState,
  reducers: {
    setCustomFirmwareAndProfile(state, action: PayloadAction<boolean>) {
      state.customFirmwareAndProfile = action.payload;
    },

    setFactoryProfile(state, action: PayloadAction<PrebuildProfileName>) {
      state.profileName = action.payload;
    },

    setSkipPrintLabel(state, action: PayloadAction<boolean>) {
      state.skipPrintLabel = action.payload;
    },

    setSkipBatteryLevel(state, action: PayloadAction<boolean>) {
      state.skipBatteryLevel = action.payload;
    },

    setCartonLabelAsn(state, action: PayloadAction<string>) {
      state.cartonLabel.asn = action.payload;
    },

    setCartonLabelProductType(
      state,
      action: PayloadAction<PixelDieType | DiceSetType>
    ) {
      state.cartonLabel.productType = action.payload;
    },

    setCartonLabelDieColorway(state, action: PayloadAction<PixelColorway>) {
      state.cartonLabel.colorway = action.payload;
    },

    setCartonLabelQuantity(state, action: PayloadAction<number>) {
      state.cartonLabel.quantity = action.payload;
    },

    setDiceSetLabelSetType(state, action: PayloadAction<DiceSetType>) {
      state.diceSetLabel.setType = action.payload;
    },

    setDiceSetLabelDiceColorway(state, action: PayloadAction<PixelColorway>) {
      state.diceSetLabel.colorway = action.payload;
    },
  },
});

export const {
  setCustomFirmwareAndProfile,
  setFactoryProfile,
  setSkipPrintLabel,
  setSkipBatteryLevel,
  setCartonLabelAsn,
  setCartonLabelProductType,
  setCartonLabelDieColorway,
  setCartonLabelQuantity,
  setDiceSetLabelSetType,
  setDiceSetLabelDiceColorway,
} = validationSettingsSlice.actions;
export default validationSettingsSlice.reducer;
