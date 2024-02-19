import React from "react";

export function useForceUpdate() {
  const [_, forceUpdate] = React.useReducer((x) => (x + 1) & 0xffff, 0);
  return forceUpdate;
}
