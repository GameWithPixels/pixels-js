import React from "react";

export default function () {
  const [_, forceUpdate] = React.useReducer((x) => x + 1, 0);
  return forceUpdate;
}
