import React from "react";

export function useNewArrayItems<Type>(
  items: readonly Readonly<Type>[] | undefined
): Type[] {
  const lastItems = React.useRef(items ?? []);
  const newItems = React.useMemo(
    () =>
      !items || lastItems.current === items
        ? []
        : items.filter((r) => !lastItems.current.includes(r)),
    [items]
  );
  lastItems.current = items ?? [];
  return newItems;
}
