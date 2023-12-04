import { Pixel } from "@systemic-games/react-native-pixels-connect";
import React from "react";

export interface PixelDfuStatus {
  pixel: Pixel;
  progress: number;
}

export interface PixelDfuStatusesContextData {
  statuses: PixelDfuStatus[];
}
export const PixelDfuStatusesContext =
  React.createContext<PixelDfuStatusesContextData>({ statuses: [] });

export function usePixelDfuStatus(pixel: Pixel): string | undefined {
  const { statuses } = React.useContext(PixelDfuStatusesContext);
  const dfuStatus = statuses.find((s) => s.pixel === pixel)?.progress;
  if (dfuStatus) {
    return `Updating ${Math.round(dfuStatus * 100)} %`;
  }
}
