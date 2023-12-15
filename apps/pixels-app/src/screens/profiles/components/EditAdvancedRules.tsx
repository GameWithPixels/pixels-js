import React from "react";

import { EditRuleCallback, RulesSection } from "./RulesSection";

import { connectionFlags, batteryFlags } from "~/actionTypes";
import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { SlideInView } from "~/components/SlideInView";
import { Banner } from "~/components/banners";
import { setShowProfileAdvancedHelp } from "~/features/store/appSettingsSlice";

export function EditAdvancedRules({
  profileUuid,
  onEditRule,
}: {
  profileUuid: string;
  onEditRule: EditRuleCallback;
}) {
  const appDispatch = useAppDispatch();
  const showHelp = useAppSelector(
    (state) => state.appSettings.showProfileAdvancedHelp
  );
  return (
    <SlideInView style={{ paddingTop: 10, paddingHorizontal: 10, gap: 10 }}>
      <Banner
        visible={showHelp}
        collapsedMarginBottom={-10}
        onDismiss={() => appDispatch(setShowProfileAdvancedHelp(false))}
      >
        Advanced rules blah blah.
      </Banner>
      <RulesSection
        profileUuid={profileUuid}
        onEditRule={onEditRule}
        conditionType="connection"
        flags={connectionFlags}
      />
      <RulesSection
        profileUuid={profileUuid}
        onEditRule={onEditRule}
        conditionType="battery"
        flags={batteryFlags}
      />
    </SlideInView>
  );
}
