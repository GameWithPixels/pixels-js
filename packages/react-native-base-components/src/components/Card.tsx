import { usePropsResolution, IBoxProps, Box } from "native-base";
import React from "react";

export interface CardProps extends IBoxProps {}

export function Card(props: CardProps) {
  const resolvedProps = usePropsResolution("Card", props) as CardProps;
  return <Box flexDir="column" {...resolvedProps} />;
}
