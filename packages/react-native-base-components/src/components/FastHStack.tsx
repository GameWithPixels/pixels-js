import { Box, IBoxProps } from "native-base";

export function FastHStack(props: IBoxProps) {
  // No theming here, so no call to usePropsResolution()
  return <Box {...props} flexDir="row" />;
}
