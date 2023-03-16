import { usePropsResolution, View } from "native-base";
import { IViewProps } from "native-base/lib/typescript/components/basic/View/types";
import React from "react";

export interface CardProps extends IViewProps {}

export function Card(props: CardProps) {
  const resolvedProps = usePropsResolution("Card", props) as CardProps;
  return <View flexDir="column" {...resolvedProps} />;
}
