import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  PixelColorway,
  PixelDieType,
} from "@systemic-games/react-native-pixels-connect";

export interface ValidationSettingsState {
  openOnStart: boolean;
  useSelectedFirmware: boolean;
  boxShipment: {
    asn: string;
    dieType: PixelDieType;
    colorway: PixelColorway;
  };
}

const initialState: ValidationSettingsState = {
  openOnStart: true,
  useSelectedFirmware: false,
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
    setOpenOnStart(state, action: PayloadAction<boolean>) {
      state.openOnStart = action.payload;
    },
    setUseSelectedFirmware(state, action: PayloadAction<boolean>) {
      state.useSelectedFirmware = action.payload;
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
  setOpenOnStart,
  setUseSelectedFirmware,
  setBoxShipmentAsn,
  setBoxShipmentDieType,
  setBoxShipmentDieColorway,
} = validationSettingsSlice.actions;
export default validationSettingsSlice.reducer;
