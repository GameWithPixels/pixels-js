import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { DfuFilesBundleKind } from "../dfu/DfuFilesBundle";

export interface DfuBundleState {
  selected: number;
  available: { pathnames: string[]; kind: DfuFilesBundleKind }[];
}

const initialState: DfuBundleState = { selected: -1, available: [] };

function hasUniqueValue(strings: string[]): boolean {
  return strings.every(
    (p1, i1) => strings.findIndex((p2, i2) => i1 !== i2 && p1 === p2) < 0
  );
}

// Redux slice that stores theme mode
const dfuBundlesSlice = createSlice({
  name: "dfuBundles",
  initialState,
  reducers: {
    // Change index of selected bundle
    setSelectedDfuBundle(state, action: PayloadAction<number>) {
      state.selected = action.payload;
    },

    // Replace embedded bundles by a new list
    resetEmbeddedDfuBundles(
      state,
      action: PayloadAction<{ app?: string[][]; factory?: string[] }>
    ) {
      const { app, factory } = action.payload;
      // Get factory files
      const bundles = [];
      if (factory) {
        bundles.push({
          pathnames: factory,
          kind: "factory" as DfuFilesBundleKind,
        });
      }
      // Build array of app files
      if (app) {
        bundles.push(
          ...app?.map((files) => ({
            pathnames: files,
            kind: "app" as DfuFilesBundleKind,
          }))
        );
      }
      // Get imported files
      bundles.push(...state.available.filter((b) => b.kind === "imported"));

      // Update state
      return {
        available: bundles,
        selected: 0,
      };
    },

    // Add an imported bundle (it will remove other imported bundles with same files)
    addImportedDfuBundle(state, action: PayloadAction<string[]>) {
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
  setSelectedDfuBundle,
  resetEmbeddedDfuBundles,
  addImportedDfuBundle,
} = dfuBundlesSlice.actions;
export default dfuBundlesSlice.reducer;
