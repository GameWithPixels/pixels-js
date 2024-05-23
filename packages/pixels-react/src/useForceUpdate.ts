import React from "react";

// useRerender
// useTriggerUpdate is a React Hook that returns a function that can be called to trigger a re-render of the component.
export function useForceUpdate() {
  const [_, forceUpdate] = React.useReducer((x) => (x + 1) & 0xffff, 0);
  return forceUpdate;
}
