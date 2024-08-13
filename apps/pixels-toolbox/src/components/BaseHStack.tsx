import { BaseBox, BaseBoxProps } from "./BaseBox";

/**
 * Simpler version of Native Base HStack without theme support and with less props.
 */
export function BaseHStack(props: BaseBoxProps) {
  // No theming here, so no call to usePropsResolution()
  return <BaseBox {...props} flexDir="row" />;
}
