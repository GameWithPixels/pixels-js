import { assert } from "@systemic-games/pixels-core-utils";

import ChargerDispatcher from "./ChargerDispatcher";
import PixelDispatcher from "./PixelDispatcher";

export interface DeviceDispatcherStaticType {
  readonly instances: Map<number, PixelDispatcher | ChargerDispatcher>;
  dfuQueue: {
    active: PixelDispatcher | ChargerDispatcher | undefined;
    readonly pending: (PixelDispatcher | ChargerDispatcher)[];
  };
}

// Keep static data in a separate file so it is not reloaded by Fast Refresh after a change in PixelDispatcher
export const DeviceDispatcherStatic: DeviceDispatcherStaticType = {
  instances: new Map(),
  dfuQueue: {
    active: undefined,
    pending: [],
  },
};

export function getPixelDispatcher(
  pixelId: number
): PixelDispatcher | undefined {
  // We don't use 'instanceof' as it doesn't work after a fast refresh (RN 74)
  const dispatcher = DeviceDispatcherStatic.instances.get(pixelId);
  if (dispatcher?.type === "die") {
    return dispatcher;
  }
  assert(!dispatcher, "Dispatcher is not of pixel type");
}

export function getChargerDispatcher(
  pixelId: number
): ChargerDispatcher | undefined {
  // We don't use 'instanceof' as it doesn't work after a fast refresh (RN 74)
  const dispatcher = DeviceDispatcherStatic.instances.get(pixelId);
  if (dispatcher?.type === "charger") {
    return dispatcher;
  }
  assert(!dispatcher, "Dispatcher is not of charger type");
}

export function getDispatcher(
  pixelId: number
): PixelDispatcher | ChargerDispatcher | undefined {
  return DeviceDispatcherStatic.instances.get(pixelId);
}
