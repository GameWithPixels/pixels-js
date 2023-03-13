import { PixelAppPage } from "@systemic-games/react-native-pixels-components";
import React from "react";

import ObservableRuleEditor from "./components/ObservableRuleEditor";

import { RuleEditScreenProps } from "~/navigation";

export default function RuleEditScreen({ route }: RuleEditScreenProps) {
  const { observableRule: rule } = route.params;
  return (
    <PixelAppPage>
      <ObservableRuleEditor observableRule={rule} />
    </PixelAppPage>
  );
}
