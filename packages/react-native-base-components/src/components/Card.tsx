import { VStack, IStackProps, usePropsResolution } from "native-base";
import React from "react";

export interface CardProps extends IStackProps {}
export function Card(props: CardProps) {
  const resolvedProps = usePropsResolution("Card", props) as CardProps;
  return <VStack {...resolvedProps}>{resolvedProps.children}</VStack>;
}
