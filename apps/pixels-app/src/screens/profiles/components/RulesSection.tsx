import { Profiles } from "@systemic-games/react-native-pixels-connect";
import { Text } from "react-native-paper";

import { RuleCard, RuleIndex } from "./RuleCard";

import { SlideInView } from "~/components/SlideInView";
import {
  getConditionFlagLabel,
  getConditionTypeLabel,
} from "~/features/profiles";

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
  flags: Readonly<string[]>;
  onEditRule: EditRuleCallback;
}) {
  return (
    <SlideInView style={{ gap: 10 }}>
      <SectionTitle>{getConditionTypeLabel(conditionType)}</SectionTitle>
      {flags.map((flagName, i) => (
        <RuleCard
          key={flagName + i} // In case we have multiple of actions of same type
          profileUuid={profileUuid}
          conditionType={conditionType}
          flagName={flagName}
          onPress={() => onEditRule({ profileUuid, conditionType, flagName })}
        >
          {getConditionFlagLabel(flagName)}
        </RuleCard>
      ))}
    </SlideInView>
  );
}
