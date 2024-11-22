import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import {
  DiceUtils,
  PixelDieType,
  useForceUpdate,
  usePixelStatus,
} from "@systemic-games/react-native-pixels-connect";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import React from "react";
import { StyleProp, StyleSheet, View, ViewProps } from "react-native";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";
import {
  CardProps,
  Text,
  TouchableRipple,
  TouchableRippleProps,
  useTheme,
} from "react-native-paper";
import Animated, {
  CurvedTransition,
  Easing,
  FadeIn,
} from "react-native-reanimated";

import { PairedDie } from "~/app/PairedDie";
import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { RollsHistoryScreenProps } from "~/app/navigation";
import { AppStyles } from "~/app/styles";
import { AppBackground } from "~/components/AppBackground";
import { Card } from "~/components/Card";
import { PageHeader } from "~/components/PageHeader";
import { SelectedPixelTransferProgressBar } from "~/components/PixelTransferProgressBar";
import { Banner } from "~/components/banners";
import {
  OutlineButton,
  StatsViewMode,
  StatsViewModeButton,
} from "~/components/buttons";
import {
  RollStats,
  StatsBarGraph,
  StatsGrid,
  StatsList,
} from "~/components/stats";
import {
  DieSession,
  mergeDieSessions,
  newDieSession,
  removeDieSession,
  removeDieSessionLastRoll,
  setDieSessionPaused,
  setShowRollsHelp,
} from "~/features/store";
import {
  useConfirmActionSheet,
  useSetSelectedPairedDie,
  useRegisteredPixel,
} from "~/hooks";

function computeStats(dieType: PixelDieType, rolls: number[]): RollStats {
  const stats: { [key: number]: number } = {};
  for (const face of DiceUtils.getDieFaces(dieType)) {
    stats[face] = 0;
  }
  for (const roll of rolls) {
    if (stats[roll] !== undefined) {
      stats[roll] = stats[roll] + 1;
    }
  }
  return stats;
}

async function shareSession(
  dieType: PixelDieType,
  session: DieSession
): Promise<void> {
  if (FileSystem.cacheDirectory) {
    const rollStats = computeStats(dieType, session.rolls);
    const faces = Object.keys(rollStats).map(Number);
    const rolls = Object.values(rollStats);
    const content = [
      `Session Index,${session.index}`,
      `Start Time,"${session.startTime ? new Date(session.startTime).toISOString() : "N/A"}"`,
      `End Time,"${session.startTime ? new Date(session.endTime).toISOString() : "N/A"}"`,
      `Rolls,${session.rolls.join(",")}`,
    ]
      .concat(faces.map((f, i) => `Face ${f},${rolls[i]}`))
      .join("\n");
    const uri =
      FileSystem.cacheDirectory + `Pixels Session ${session.index}.csv`;
    try {
      await FileSystem.writeAsStringAsync(uri, content);
      await Sharing.shareAsync(uri);
    } finally {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  }
}

function toHHMMSS(ms: number): string {
  ms = Math.max(0, ms);
  const seconds = Math.floor(ms / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds - hours * 3600) / 60);
  if (hours > 0) {
    if (minutes > 0) {
      const m = minutes.toString().padStart(2, "0");
      return `${hours} hours and ${m} minutes`;
    } else {
      return `${hours} hours`;
    }
  } else if (minutes > 1) {
    return `${minutes} minutes`;
  } else if (minutes === 1) {
    return "about 1 minute";
  } else {
    return "less than 1 minute";
  }
}

function TransparentButton({
  children,
  style,
  ...props
}: React.PropsWithChildren<
  Omit<TouchableRippleProps, "children" | "style"> & {
    style?: StyleProp<ViewProps>;
  }
>) {
  const borderRadius = 1000; // Big enough to be a circle
  const { colors } = useTheme();
  return (
    <TouchableRipple
      borderless
      style={[
        {
          borderRadius,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.onSurface,
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 5,
          paddingLeft: 10,
          paddingRight: 15,
          gap: 5,
        },
        style,
      ]}
      {...props}
    >
      <>{children}</>
    </TouchableRipple>
  );
}

function InactivityText({ endTime }: { endTime: number }) {
  const forceUpdate = useForceUpdate();
  React.useEffect(() => {
    const id = setInterval(forceUpdate, 10000);
    return () => clearInterval(id);
  }, [forceUpdate]);
  const t = Date.now() - endTime;
  return t > 0 && <Text>Last roll received {toHHMMSS(t)} ago</Text>;
}

function DieStatsCard({
  pixelId,
  sessionId,
  dieType,
  isNewestSession,
  isOldestSession,
  contentStyle,
  ...props
}: {
  pixelId: number;
  sessionId: number;
  dieType: PixelDieType;
  isNewestSession?: boolean;
  isOldestSession?: boolean;
} & Omit<CardProps, "children">) {
  const appDispatch = useAppDispatch();
  const session = useAppSelector(
    (state) => state.diceStats.entities[pixelId]?.sessions.entities[sessionId]
  );
  const rollStats = React.useMemo(
    () => !!session?.rolls.length && computeStats(dieType, session.rolls),
    [dieType, session]
  );

  const confirmDelete = useConfirmActionSheet(
    `Delete Session #${session?.index ?? 0}`,
    () => {
      session &&
        appDispatch(removeDieSession({ pixelId, index: session.index }));
    }
  );

  const confirmRemoveLast = useConfirmActionSheet(
    `Remove Last Roll (${session?.rolls.at(-1) ?? -1})`,
    () => {
      session &&
        appDispatch(
          removeDieSessionLastRoll({ pixelId, index: session.index })
        );
    }
  );

  const [viewMode, setViewMode] = React.useState<StatsViewMode>("bars");
  const { colors } = useTheme();
  return session ? (
    <Card
      contentStyle={[
        { alignItems: "stretch", padding: 10, gap: 10 },
        contentStyle,
      ]}
      {...props}
    >
      <Text variant="bodyLarge" style={{ alignSelf: "center" }}>
        Session #{session.index}
      </Text>
      <TouchableRipple
        sentry-label="delete-die-session"
        borderless
        style={{
          position: "absolute",
          right: 0,
          padding: 10,
          borderRadius: 20,
        }}
        onPress={() =>
          rollStats
            ? confirmDelete()
            : appDispatch(removeDieSession({ pixelId, index: session.index }))
        }
      >
        <MaterialCommunityIcons
          name="trash-can-outline"
          size={24}
          color={colors.onSurface}
        />
      </TouchableRipple>
      {rollStats ? (
        <>
          <View style={styles.cardIconText}>
            <MaterialCommunityIcons
              name="dice-multiple-outline"
              size={15}
              color={colors.onSurface}
            />
            <Text>Number of Rolls: {session.rolls.length}</Text>
          </View>
          <View style={styles.cardIconText}>
            <MaterialCommunityIcons
              name="calendar-today"
              size={15}
              color={colors.onSurface}
            />
            <Text>
              Started on: {new Date(session.startTime).toLocaleString()}
            </Text>
          </View>
          <View style={styles.cardIconText}>
            <MaterialCommunityIcons
              name="av-timer"
              size={15}
              color={colors.onSurface}
            />
            <Text>
              Duration:{" " + toHHMMSS(session.endTime - session.startTime)}
            </Text>
            <View style={{ flexGrow: 1 }} />
            <View
              style={{
                position: "absolute",
                right: 0,
                flexDirection: "row",
                top: -10,
              }}
            >
              {["bars", "list", "grid"].map((vm) => (
                <StatsViewModeButton
                  key={vm}
                  viewMode={vm as StatsViewMode}
                  activeMode={viewMode}
                  sentry-label={"session-view-mode-" + vm}
                  borderless
                  style={{ padding: 10, borderRadius: 100 }}
                  onChange={setViewMode}
                />
              ))}
            </View>
          </View>
          {viewMode === "bars" ? (
            <StatsBarGraph rollStats={rollStats} />
          ) : viewMode === "list" ? (
            <StatsList rollStats={rollStats} dieType={dieType} />
          ) : (
            <StatsGrid rollStats={rollStats} dieType={dieType} />
          )}
          <View style={styles.cardIconText}>
            <MaterialCommunityIcons
              name="lastpass"
              size={15}
              color={colors.onSurface}
            />
            <Text>
              Last {session.rolls.length > 10 ? "10 " : ""}Rolls:{" "}
              {session.rolls.slice(-10).reverse().join(", ")}
            </Text>
          </View>
          {isNewestSession && (
            <View style={styles.cardIconText}>
              <MaterialIcons
                name="more-time"
                size={15}
                color={colors.onSurface}
              />
              <InactivityText endTime={session.endTime} />
            </View>
          )}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <TransparentButton onPress={confirmRemoveLast}>
              <MaterialCommunityIcons
                name="selection-ellipse-remove"
                size={24}
                color={colors.onSurface}
              />
              <Text>Remove Last Roll ({session.rolls.at(-1)})</Text>
            </TransparentButton>
            <TransparentButton onPress={() => shareSession(dieType, session)}>
              <MaterialCommunityIcons
                name="file-export-outline"
                size={24}
                color={colors.onSurface}
              />
              <Text>Export</Text>
            </TransparentButton>
            {!isOldestSession && (
              <TransparentButton
                onPress={() =>
                  appDispatch(
                    mergeDieSessions({
                      pixelId,
                      index1: session.index,
                      index2: session.index - 1,
                    })
                  )
                }
              >
                <MaterialCommunityIcons
                  name="table-merge-cells"
                  size={24}
                  color={colors.onSurface}
                />
                <Text>Merge With Previous Session</Text>
              </TransparentButton>
            )}
            {isNewestSession && (
              <TransparentButton
                onPress={() => appDispatch(newDieSession({ pixelId }))}
              >
                <MaterialCommunityIcons
                  name="stop"
                  size={24}
                  color={colors.onSurface}
                />
                <Text>End Session</Text>
              </TransparentButton>
            )}
          </View>
        </>
      ) : (
        <Text style={AppStyles.selfCentered}>No rolls received yet</Text>
      )}
    </Card>
  ) : null;
}

function PlopControls({
  pixelId,
  hasNoSession,
}: {
  pixelId: number;
  hasNoSession: boolean;
}) {
  const pixel = useRegisteredPixel(pixelId);
  const status = usePixelStatus(pixel);
  return status !== "ready" || hasNoSession ? (
    <Text
      variant="bodyLarge"
      style={{ alignSelf: "center", marginVertical: 10 }}
    >
      {status !== "ready"
        ? "Waiting for your die to connect..."
        : "Roll your die to get started"}
    </Text>
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
  const paused = useAppSelector(
    (state) => state.diceStats.entities[pairedDie.pixelId]?.paused
  );
  const sessionIds = useAppSelector(
    (state) => state.diceStats.entities[pairedDie.pixelId]?.sessions.ids
  );
  const [maxSessionsToShow, setMaxSessionsToShow] = React.useState(20);

  const { colors } = useTheme();
  return (
    <View style={{ height: "100%" }}>
      <PageHeader
        mode="chevron-down"
        rightElement={() => (
          <TouchableRipple
            borderless
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 5,
              paddingHorizontal: 10,
              gap: 5,
            }}
            onPress={() =>
              appDispatch(
                setDieSessionPaused({
                  pixelId: pairedDie.pixelId,
                  paused: !paused,
                })
              )
            }
          >
            <>
              {paused ? (
                <MaterialCommunityIcons
                  name="play-outline"
                  size={24}
                  color={colors.onSurface}
                />
              ) : (
                <MaterialIcons
                  name="pause"
                  size={24}
                  color={colors.onSurface}
                />
              )}
              <Text>{paused ? "Paused" : "Running"}</Text>
            </>
          </TouchableRipple>
        )}
        onGoBack={() => navigation.goBack()}
      >
        {pairedDie.name}
      </PageHeader>
      <GHScrollView
        contentContainerStyle={{
          paddingHorizontal: 10,
          paddingBottom: 20,
          gap: 10,
        }}
      >
        <Banner
          visible={showHelp}
          collapsedMarginBottom={-10}
          onDismiss={() => appDispatch(setShowRollsHelp(false))}
        >
          Here you will find all the rolls, grouped by session, that your dice
          made while connected to the app.
        </Banner>
        <PlopControls
          pixelId={pairedDie.pixelId}
          hasNoSession={!sessionIds?.length}
        />
        {!!sessionIds?.length && (
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
                  <DieStatsCard
                    pixelId={pairedDie.pixelId}
                    sessionId={id as number}
                    dieType={pairedDie.dieType}
                    isNewestSession={id === sessionIds.at(-1)}
                    isOldestSession={id === sessionIds[0]}
                  />
                </Animated.View>
              ))}
            {sessionIds.length > maxSessionsToShow && (
              <OutlineButton
                style={{ marginTop: 20 }}
                onPress={() => setMaxSessionsToShow((i) => i + 20)}
              >
                Show More Sessions
              </OutlineButton>
            )}
          </View>
        )}
      </GHScrollView>
    </View>
  );
}

export function RollsHistoryScreen({
  route: {
    params: { pixelId },
  },
  navigation,
}: RollsHistoryScreenProps) {
  const pairedDie = useSetSelectedPairedDie(pixelId);
  React.useEffect(() => {
    if (!pairedDie) {
      navigation.goBack();
    }
  }, [pairedDie, navigation]);
  return !pairedDie ? null : (
    <AppBackground>
      <RollsHistoryPage pairedDie={pairedDie} navigation={navigation} />
      <SelectedPixelTransferProgressBar />
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  cardIconText: {
    flexDirection: "row",
    marginLeft: 5,
    gap: 10,
  },
});
