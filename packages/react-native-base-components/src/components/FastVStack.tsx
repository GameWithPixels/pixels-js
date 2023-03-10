import { FastBox, FastBoxProps } from "./FastBox";

/**
 * Simpler version of Native Base HStack without theme support and with less props.
 */
export function FastVStack(props: FastBoxProps) {
  // No theming here, so no call to usePropsResolution()
  return <FastBox {...props} flexDir="column" />;
}
