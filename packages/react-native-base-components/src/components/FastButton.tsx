import {
  IPressableProps,
  Pressable,
  Text,
  usePropsResolution,
} from "native-base";

export interface FastButtonProps extends IPressableProps {
  children?: React.ReactNode;
}

export function FastButton(props: FastButtonProps) {
  const { children, ...resolvedProps } = usePropsResolution(
    "FastButton",
    props
  ) as FastButtonProps;
  return (
    <Pressable {...resolvedProps}>
      <Text p={3}>{children}</Text>
    </Pressable>
  );
}
