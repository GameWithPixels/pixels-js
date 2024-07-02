import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  PixelColorway,
  PixelDieType,
} from "@systemic-games/react-native-pixels-connect";

import { DiceSetType } from "~/features/validation";

export interface ValidationSettingsState {
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
  setCartonLabelAsn,
  setCartonLabelProductType,
  setCartonLabelDieColorway,
  setCartonLabelQuantity,
  setDiceSetLabelSetType,
  setDiceSetLabelDiceColorway,
} = validationSettingsSlice.actions;
export default validationSettingsSlice.reducer;
