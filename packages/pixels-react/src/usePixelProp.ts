import {
  Pixel,
  PixelInfoNotifier,
  PixelInfoNotifierMutableProps,
  PixelMutableProps,
} from "@systemic-games/pixels-core-connect";
import React from "react";

import { useForceUpdate } from "./useForceUpdate";

/**
 * React Hook that updates when the given Pixel's prop changes.
 * @param pixel The Pixel for which to watch the prop.
 * @param prop The prop to watch.
 * @returns The current value of the given prop on the given Pixel.
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

/**
 * React Hook that updates when the given PixelInfoNotifier's prop changes.
 * @param pixelInfo The PixelInfoNotifier for which to watch the prop.
 * @param prop The prop to watch.
 * @returns The current value of the given prop on the given PixelInfoNotifier.
 */
export function usePixelInfoProp<T extends keyof PixelInfoNotifierMutableProps>(
  pixelInfo: PixelInfoNotifier | undefined,
  prop: T
): PixelInfoNotifierMutableProps[T] | undefined {
  const forceUpdate = useForceUpdate();

  // Subscribe to prop event to trigger a React update when the value changes
  React.useEffect(() => {
    pixelInfo?.addPropertyListener(prop, forceUpdate);
    return () => {
      pixelInfo?.removePropertyListener(prop, forceUpdate);
    };
  }, [forceUpdate, pixelInfo, prop]);

  // Return the latest value of the prop
  return pixelInfo?.[prop];
}
