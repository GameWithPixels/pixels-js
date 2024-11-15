import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  PixelColorway,
  PixelDieType,
} from "@systemic-games/react-native-pixels-connect";

import { DiceSetType } from "~/features/validation";

export interface ValidationSettingsState {
  dieLabel: {
    smallLabel: boolean;
  };
  cartonLabel: {
    asn: string;
    productType: PixelDieType | DiceSetType;
    colorway: PixelColorway;
    quantity: number;
    numCopies: number;
  };
  diceSetLabel: {
    setType: DiceSetType;
    colorway: PixelColorway;
    numCopies: number;
  };
}

const initialState: ValidationSettingsState = {
  dieLabel: {
    smallLabel: false,
  },
  cartonLabel: {
    asn: "",
    productType: "d20",
    colorway: "unknown",
    quantity: 64,
    numCopies: 1,
  },
  diceSetLabel: {
    setType: "rpg",
    colorway: "unknown",
    numCopies: 1,
  },
};

// Redux slice that stores validation settings
const validationSettingsSlice = createSlice({
  name: "validationSettings",
  initialState,
  reducers: {
    setPrintDieSmallLabel(state, action: PayloadAction<boolean>) {
      state.dieLabel.smallLabel = action.payload;
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

    setCartonLabelNumCopies(state, action: PayloadAction<number>) {
      state.cartonLabel.numCopies = action.payload;
    },

    setDiceSetLabelSetType(state, action: PayloadAction<DiceSetType>) {
      state.diceSetLabel.setType = action.payload;
    },

    setDiceSetLabelDiceColorway(state, action: PayloadAction<PixelColorway>) {
      state.diceSetLabel.colorway = action.payload;
    },

    setDiceSetLabelNumCopies(state, action: PayloadAction<number>) {
      state.diceSetLabel.numCopies = action.payload;
    },
  },
});

export const {
  setPrintDieSmallLabel,
  setCartonLabelAsn,
  setCartonLabelProductType,
  setCartonLabelDieColorway,
  setCartonLabelQuantity,
  setCartonLabelNumCopies,
  setDiceSetLabelSetType,
  setDiceSetLabelDiceColorway,
  setDiceSetLabelNumCopies,
} = validationSettingsSlice.actions;
export default validationSettingsSlice.reducer;
