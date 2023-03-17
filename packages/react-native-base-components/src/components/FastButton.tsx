import {
  IPressableProps,
  ITextProps,
  Pressable,
  Text,
  usePropsResolution,
} from "native-base";
import React from "react";

export interface FastButtonProps extends IPressableProps {
  children?: React.ReactNode;
  _text?: ITextProps;
}

/**
 * Simpler and faster version of Native Base Button component.
 * It has theme support and props resolution.
 */
export function FastButton(props: FastButtonProps) {
  const { children, _text, ...resolvedProps } = usePropsResolution(
    "FastButton",
    props
  ) as FastButtonProps;
  const childrenNode = React.useMemo(
    () =>
      typeof children === "string" || typeof children === "number" ? (
        <Text {..._text}>{children}</Text>
      ) : (
        children
      ),
    [_text, children]
  );
  return (
    <Pressable alignItems="center" justifyContent="center" {...resolvedProps}>
      {childrenNode}
    </Pressable>
  );
}
