import React from "react";

/**
 * Copy of Native Base useDisclose() but returns stable functions
 * (the original function returns new functions on each render).
 * @param initialState Initial open state.
 * @returns An object with visible, show, hide and toggle properties.
 */
export function useVisibility(initialState?: boolean) {
  const [visible, setVisible] = React.useState(initialState ?? false);
  const show = React.useCallback(() => {
    setVisible(true);
  }, []);
  const hide = React.useCallback(() => {
    setVisible(false);
  }, []);
  const toggle = React.useCallback(() => {
    setVisible((b) => !b);
  }, []);
  return {
    visible,
    show,
    hide,
    toggle,
  };
}
