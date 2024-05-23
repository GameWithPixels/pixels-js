import { Pixel, PixelMutableProps } from "@systemic-games/pixels-core-connect";
import React from "react";

import { useForceUpdate } from "./useForceUpdate";

/**
 * React Hook that updates when the given Pixel's prop changes.
 * @param pixel The Pixel for which to watch the prop.
 * @param prop The prop to watch.
 * @returns The value of the given prop on the given Pixel.
 * @remarks Use {@link usePixelEvent} to watch the RSSI value.
 */
export function usePixelProp<T extends keyof PixelMutableProps>(
  pixel: Pixel | undefined,
  prop: T
): PixelMutableProps[T] | undefined {
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
