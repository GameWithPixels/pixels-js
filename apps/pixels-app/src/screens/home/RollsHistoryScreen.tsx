import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  DiceUtils,
  PixelDieType,
  usePixelStatus,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { View } from "react-native";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";
import { CardProps, Text, TouchableRipple, useTheme } from "react-native-paper";
import Animated, {
  CurvedTransition,
  Easing,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";

import { PairedDie } from "~/app/PairedDie";
import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { AppBackground } from "~/components/AppBackground";
import { Card } from "~/components/Card";
import { PageHeader } from "~/components/PageHeader";
import { Banner } from "~/components/banners";
import {
  FloatingAddButton,
  OutlineButton,
  StatsViewMode,
  StatsViewModeButton,
} from "~/components/buttons";
import { StatsBarGraph, StatsGrid, StatsList } from "~/components/stats";
import { setShowRollsHelp } from "~/features/store/appSettingsSlice";
import {
  newDieSessionOnRoll,
  removeDieSession,
} from "~/features/store/diceStatsSlice";
import { useConfirmActionSheet, useWatchedPixel } from "~/hooks";
import { RollsHistoryScreenProps } from "~/navigation";

function toHHMMSS(ms: number): string {
  const numSecs = Math.floor(ms / 1000);
  const hours = Math.floor(numSecs / 3600);
  const minutes = Math.floor((numSecs - hours * 3600) / 60);
  if (hours > 0) {
    const m = minutes.toString().padStart(2, "0");
    return `${hours}:${m}`;
  } else if (minutes > 1) {
    return `${minutes} minutes`;
  } else {
    return "1 minute";
  }
}

export function DieStats({
  pixelId,
  sessionId,
  dieType,
  contentStyle,
  ...props
}: { pixelId: number; sessionId: number; dieType: PixelDieType } & Omit<
  CardProps,
  "children"
>) {
  const appDispatch = useAppDispatch();
  const session = useAppSelector(
    (state) => state.diceStats.entities[pixelId]?.sessions.entities[sessionId]
  );
  const rollStats = React.useMemo(() => {
    const stats: { [key: number]: number } = {};
    for (const face of DiceUtils.getDieFaces(dieType)) {
      stats[face] = 0;
    }
    if (session?.rolls) {
      for (const roll of session.rolls) {
        if (stats[roll] !== undefined) {
          stats[roll] = stats[roll] + 1;
        }
      }
    }
    return stats;
  }, [dieType, session?.rolls]);
  const confirmDelete = useConfirmActionSheet(
    `Delete Session ${session?.index}`,
    () => {
      session &&
        appDispatch(removeDieSession({ pixelId, index: session.index }));
    }
  );

  const [viewMode, setViewMode] = React.useState<StatsViewMode>("bars");
  const { colors } = useTheme();
  return session ? (
    <Card
      contentStyle={[{ alignItems: "stretch", padding: 10 }, contentStyle]}
      {...props}
    >
      <Text variant="bodyLarge" style={{ alignSelf: "center" }}>
        Session {session.index} - {session.rolls.length} rolls
      </Text>
      <TouchableRipple
        sentry-label="delete-die-session"
        style={{ position: "absolute", right: 10, top: 10 }}
        onPress={() => confirmDelete()}
      >
        <MaterialCommunityIcons
          name="trash-can-outline"
          size={20}
          color={colors.onSurface}
        />
      </TouchableRipple>
      <View
        style={{ flexDirection: "row", marginTop: 10, alignItems: "center" }}
      >
        <MaterialCommunityIcons
          name="calendar-today"
          size={15}
          color={colors.onSurface}
          style={{ textAlign: "center", width: 30 }}
        />
        <Text>Start: {new Date(session.startTime).toLocaleString()}</Text>
      </View>
      <View
        style={{ flexDirection: "row", marginBottom: 5, alignItems: "center" }}
      >
        <View style={{ gap: 5 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <MaterialCommunityIcons
              name="clock-time-four"
              size={15}
              color={colors.onSurface}
              style={{ textAlign: "center", width: 30 }}
            />
            <Text>
              Duration: {toHHMMSS(session.endTime - session.startTime)}
            </Text>
          </View>
        </View>
        <View style={{ flexGrow: 1 }} />
        {["bars", "list", "grid"].map((vm) => (
          <StatsViewModeButton
            key={vm}
            viewMode={vm as StatsViewMode}
            activeMode={viewMode}
            sentry-label={"session-view-mode-" + vm}
            style={{ padding: 10, borderRadius: 5 }}
            onChange={setViewMode}
          />
        ))}
      </View>
      {viewMode === "bars" ? (
        <StatsBarGraph rollStats={rollStats} />
      ) : viewMode === "list" ? (
        <StatsList rollStats={rollStats} dieType={dieType} />
      ) : (
        <StatsGrid rollStats={rollStats} dieType={dieType} />
      )}
    </Card>
  ) : null;
}

function RollsHistoryPage({
  pairedDie,
  navigation,
}: {
  pairedDie: PairedDie;
  navigation: RollsHistoryScreenProps["navigation"];
}) {
  const appDispatch = useAppDispatch();
  const showHelp = useAppSelector((state) => state.appSettings.showRollsHelp);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialShowHelp = React.useMemo(() => showHelp, []); // TODO need banner fix to not initially show empty view
  const pixel = useWatchedPixel(pairedDie);
  const status = usePixelStatus(pixel);
  const sessionIds = useAppSelector(
    (state) => state.diceStats.entities[pairedDie.pixelId]?.sessions?.ids
  );
  const forceNewSession = useAppSelector(
    (state) => state.diceStats.entities[pairedDie.pixelId]?.forceNewSession
  );
  const [maxSessionsToShow, setMaxSessionsToShow] = React.useState(20);
  return (
    <View style={{ height: "100%" }}>
      <PageHeader mode="chevron-down" onGoBack={() => navigation.goBack()}>
        {pairedDie.name}
      </PageHeader>
      <GHScrollView
        contentContainerStyle={{
          paddingHorizontal: 10,
          paddingBottom: 20,
          gap: 10,
        }}
      >
        {initialShowHelp && (
          <Banner
            visible={showHelp}
            collapsedMarginBottom={-10}
            onDismiss={() => appDispatch(setShowRollsHelp(false))}
          >
            Welcome to the new rolls history page!{"\n\n"}
            Rolls are grouped by session; a new session is automatically started
            when getting a roll after more than 4 hours of inactivity. A new
            session can also be started manually by tapping the "New Session"
            button.
            {"\n\n"}You can switch between different stats views by tapping the
            buttons at the top right corner of each session.
            {"\n\n"}Feel free to submit feedback to us!
          </Banner>
        )}
        {status !== "ready" && (
          <Text
            variant="bodyLarge"
            style={{ alignSelf: "center", marginTop: 20 }}
          >
            ⚠️ Connect your die to track rolls.
          </Text>
        )}
        {sessionIds?.length ? (
          <View style={{ gap: 20 }}>
            {sessionIds
              .slice(sessionIds.length - maxSessionsToShow)
              .reverse()
              .map((id) => (
                <Animated.View
                  key={id}
                  entering={FadeIn.duration(300)}
                  layout={CurvedTransition.easingY(Easing.linear).duration(300)}
                >
                  <DieStats
                    pixelId={pairedDie.pixelId}
                    sessionId={id as number}
                    dieType={pairedDie.dieType}
                  />
                </Animated.View>
              ))}
            {sessionIds.length > maxSessionsToShow && (
              <OutlineButton
                onPress={() => setMaxSessionsToShow((i) => i + 20)}
              >
                Show More Sessions
              </OutlineButton>
            )}
          </View>
        ) : (
          <Text
            variant="bodyLarge"
            style={{ alignSelf: "center", marginTop: 20 }}
          >
            No sessions yet, roll your die to start a new session!
          </Text>
        )}
      </GHScrollView>
      {!!sessionIds?.length && !forceNewSession && (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
        >
          <FloatingAddButton
            sentry-label="new-die-session"
            onPress={() =>
              appDispatch(newDieSessionOnRoll({ pixelId: pairedDie.pixelId }))
            }
          />
        </Animated.View>
      )}
    </View>
  );
}

export function RollsHistoryScreen({
  route: {
    params: { pixelId },
  },
  navigation,
}: RollsHistoryScreenProps) {
  const pairedDie = useAppSelector((state) =>
    state.pairedDice.paired.find((p) => p.pixelId === pixelId)
  );
  React.useEffect(() => {
    if (!pairedDie) {
      navigation.goBack();
    }
  }, [navigation, pairedDie]);
  return (
    <AppBackground>
      {pairedDie && (
        <RollsHistoryPage pairedDie={pairedDie} navigation={navigation} />
      )}
    </AppBackground>
  );
}
