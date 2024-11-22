import { MPC, MPCMutableProps } from "@systemic-games/pixels-core-connect";
import React from "react";

import { useForceUpdate } from "./useForceUpdate";

/**
 * React Hook that updates when the given MPC's prop changes.
 * @param pixel The MPC for which to watch the prop.
 * @param prop The prop to watch.
 * @returns The current value of the given prop on the given MPC.
 * @remarks Use {@link usePixelEvent} to watch the RSSI value.
 */
export function useMPCProp<T extends keyof MPCMutableProps>(
  pixel: MPC | undefined,
  prop: T
): MPCMutableProps[T] | undefined {
  const forceUpdate = useForceUpdate();

  // Subscribe to prop event to trigger a React update when the value changes
  React.useEffect(() => {
    pixel?.addPropertyListener(prop, forceUpdate);
    return () => {
      pixel?.removePropertyListener(prop, forceUpdate);
    };
  }, [forceUpdate, pixel, prop]);

  // Return the latest value of the prop
  return pixel?.[prop];
}
