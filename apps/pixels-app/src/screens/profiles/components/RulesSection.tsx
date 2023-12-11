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
  flags,
  onEditRule,
}: {
  profileUuid: string;
  conditionType: Profiles.ConditionType;
  flags: string[];
  onEditRule: EditRuleCallback;
}) {
  return (
    <SlideInView style={{ gap: 10 }}>
      <SectionTitle>{getConditionTypeLabel(conditionType)}</SectionTitle>
      {flags.map((flagName) => (
        <RuleCard
          key={flagName}
          profileUuid={profileUuid}
          conditionType={conditionType}
          flagName={flagName}
          onPress={() => onEditRule({ profileUuid, conditionType, flagName })}
        >
          {flagName}
        </RuleCard>
      ))}
    </SlideInView>
  );
}
