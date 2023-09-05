import PixelDispatcher from "./PixelDispatcher";

export interface PixelDispatcherStaticType {
  readonly instances: Map<number, PixelDispatcher>;
  dfuQueue: {
    active: PixelDispatcher | undefined;
    readonly pending: PixelDispatcher[];
  };
}

// Keep static data in a separate file so it is not reloaded by Fast Refresh after a change in PixelDispatcher
export const PixelDispatcherStatic: PixelDispatcherStaticType = {
  instances: new Map(),
  dfuQueue: {
    active: undefined,
    pending: [],
  },
};
