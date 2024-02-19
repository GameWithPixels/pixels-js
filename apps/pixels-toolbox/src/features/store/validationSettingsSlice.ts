import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  PixelColorway,
  PixelDieType,
} from "@systemic-games/react-native-pixels-connect";

import { PrebuildProfileName } from "~/features/pixels/PrebuildProfiles";

export interface ValidationSettingsState {
  customFirmwareAndProfile?: boolean; // Select with selectCustomFirmwareAndProfile
  profileName?: PrebuildProfileName; // Select with selectProfileName
  skipPrintLabel?: boolean; // Select with selectSkipPrintLabel
  boxShipment: {
    asn: string;
    dieType: PixelDieType;
    colorway: PixelColorway;
  };
}

const initialState: ValidationSettingsState = {
  boxShipment: {
    asn: "",
    dieType: "unknown",
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
    setBoxShipmentAsn(state, action: PayloadAction<string>) {
      state.boxShipment.asn = action.payload;
    },
    setBoxShipmentDieType(state, action: PayloadAction<PixelDieType>) {
      state.boxShipment.dieType = action.payload;
    },
    setBoxShipmentDieColorway(state, action: PayloadAction<PixelColorway>) {
      state.boxShipment.colorway = action.payload;
    },
  },
});

export const {
  setCustomFirmwareAndProfile,
  setFactoryProfile,
  setSkipPrintLabel,
  setBoxShipmentAsn,
  setBoxShipmentDieType,
  setBoxShipmentDieColorway,
} = validationSettingsSlice.actions;
export default validationSettingsSlice.reducer;
