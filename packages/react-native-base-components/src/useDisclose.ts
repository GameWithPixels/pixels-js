import React from "react";

/**
 * Copy of Native Base useDisclose() but returns stable functions
 * (the original function returns new functions on each render).
 * @param initState Initial open state.
 * @returns An object with isOpen, onOpen, onClose, onToggle properties.
 */
export function useDisclose(initState?: boolean) {
  const [isOpen, setIsOpen] = React.useState(initState ?? false);
  const onOpen = React.useCallback(() => {
    setIsOpen(true);
  }, []);
  const onClose = React.useCallback(() => {
    setIsOpen(false);
  }, []);
  const onToggle = React.useCallback(() => {
    setIsOpen((b) => !b);
  }, []);
  return {
    isOpen,
    onOpen,
    onClose,
    onToggle,
  };
}
