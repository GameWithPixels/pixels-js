import { Profiles } from "@systemic-games/react-native-pixels-connect";
import { Text } from "react-native-paper";

import { RuleCard, RuleIndex } from "./RuleCard";

import { SlideInView } from "~/components/SlideInView";
import { getConditionTypeLabel } from "~/descriptions";

export type EditRuleCallback = (ruleIndex: RuleIndex) => void;

export function SectionTitle({ children }: React.PropsWithChildren) {
  return <Text variant="titleMedium">{children}</Text>;
}

export function RulesSection({
  profileUuid,
  conditionType,
  options,
  onEditRule,
}: {
  profileUuid: string;
  conditionType: Profiles.ConditionType;
  options: string[];
  onEditRule: EditRuleCallback;
}) {
  return (
    <SlideInView style={{ gap: 10 }}>
      <SectionTitle>{getConditionTypeLabel(conditionType)}</SectionTitle>
      {options.map((opt) => (
        <RuleCard
          key={opt}
          profileUuid={profileUuid}
          conditionType={conditionType}
          option={opt}
          onPress={() =>
            onEditRule({ profileUuid, conditionType, option: opt })
          }
        >
          {opt}
        </RuleCard>
      ))}
    </SlideInView>
  );
}
