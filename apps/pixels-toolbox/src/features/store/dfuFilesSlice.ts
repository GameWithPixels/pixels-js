import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { DfuFileSource } from "~/features/dfu/DfuFilesBundle";

export interface AppDfuFiles {
  available: { pathnames: string[]; kind: DfuFileSource }[];
  selected: number;
}

const initialState: AppDfuFiles = { available: [], selected: -1 };

function hasUniqueValue(strings: string[]): boolean {
  return strings.every(
    (p1, i1) => strings.findIndex((p2, i2) => i1 !== i2 && p1 === p2) < 0
  );
}

// Redux slice that stores theme mode
const dfuFilesSlice = createSlice({
  name: "dfuFiles",
  initialState,
  reducers: {
    // Change index of selected bundle
    setSelectedDfuFiles(state, action: PayloadAction<number>) {
      state.selected = action.payload;
    },

    // Replace embedded bundles by a new list
    resetEmbeddedDfuFiles(
      state,
      action: PayloadAction<{
        selected: number;
        bundles: { pathnames: string[]; kind: DfuFileSource }[];
      }>
    ) {
      const { selected, bundles } = action.payload;
      // Keep imported files, but put them last
      const available = bundles.concat(
        state.available.filter((b) => b.kind === "imported")
      );

      // Update state
      return {
        available,
        selected,
      };
    },

    // Add an imported bundle (it will remove other imported bundles with same files)
    addImportedDfuFiles(state, action: PayloadAction<string[]>) {
      if (action.payload.length) {
        // Remove duplicates
        // TODO
        // Check if we have already have one of those files in store
        const dup = state.available.findIndex(
          (b) =>
            b.kind === "imported" &&
            !hasUniqueValue([...action.payload, ...b.pathnames])
        );
        // Remove it if found
        if (dup >= 0) {
          state.available.splice(dup, 1);
        }
        // Add new data
        state.available.push({
          pathnames: action.payload,
          kind: "imported",
        });
      }
    },
  },
});

export const {
  setSelectedDfuFiles,
  resetEmbeddedDfuFiles,
  addImportedDfuFiles,
} = dfuFilesSlice.actions;
export default dfuFilesSlice.reducer;
