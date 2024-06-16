import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import {
  DiceUtils,
  PixelDieType,
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
import { StatsBarGraph, StatsGrid, StatsList } from "~/components/stats";
import {
  DieSession,
  removeDieSession,
  removeDieSessionLastRoll,
  sessionMaxDuration,
  setDieSessionPaused,
  setShowRollsHelp,
} from "~/features/store";
import {
  useConfirmActionSheet,
  useSetSelectedPairedDie,
  useWatchedPixel,
} from "~/hooks";
import { RollsHistoryScreenProps } from "~/navigation";

async function shareSession(session: DieSession): Promise<void> {
  // const keys = Object.keys(data[0]);
  // const header = keys.join(",");
  // const lines = data.map((d) => keys.map((k) => d[k].toString()).join(","));
  // const contents = header + "\n" + lines.join("\n");
  // if (Platform.OS === "android") {
  //   const uri = await requestUserFileAsync(filename);
  //   console.log(`About to write ${contents.length} characters to ${filename}`);
  //   await StorageAccessFramework.writeAsStringAsync(uri, contents);
  // } else {
  //   const uri = await Pathname.generateTempPathnameAsync(".csv");
  if (FileSystem.cacheDirectory) {
    const uri =
      FileSystem.cacheDirectory + Math.round(1e9 * Math.random()) + ".csv";
    try {
      await FileSystem.writeAsStringAsync(
        uri,
        "session\n" + session.rolls.join("\n")
      );
      await Sharing.shareAsync(uri);
    } finally {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  }
}

function toHHMMSS(ms: number): string {
  const numSecs = Math.floor(ms / 1000);
  const hours = Math.floor(numSecs / 3600);
  const minutes = Math.floor((numSecs - hours * 3600) / 60);
  if (hours > 0) {
    const m = minutes.toString().padStart(2, "0");
    return `${hours} hours and ${m} minutes`;
  } else if (minutes > 1) {
    return `${minutes} minutes`;
  } else if (minutes > 1) {
    return "1 minute";
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

function CurrentSessionMessage({
  isEmpty,
  endTime,
}: {
  isEmpty?: boolean;
  endTime: number;
}) {
  const [timeLeft, setTimeLeft] = React.useState(endTime - Date.now());
  React.useEffect(() => {
    if (!isEmpty) {
      const id = setInterval(() => {
        setTimeLeft(endTime - Date.now());
      }, 10000); // Refresh every 10s
      return () => clearInterval(id);
    }
  }, [endTime, isEmpty]);
  return (
    <Text style={{ marginTop: 5 }}>
      {isEmpty
        ? "Roll your die to start this new session"
        : `This session will automatically end in ${toHHMMSS(timeLeft)} unless a roll happens before then.`}
    </Text>
  );
}

function CurrentSessionControls({
  pixelId,
  startTime,
  isEmpty,
}: {
  pixelId: number;
  startTime: number;
  isEmpty?: boolean;
}) {
  const appDispatch = useAppDispatch();
  const paused = useAppSelector(
    (state) => state.diceStats.entities[pixelId]?.paused
  );
  const pixel = useWatchedPixel(pixelId);
  const status = usePixelStatus(pixel);
  const { colors } = useTheme();
  return (
    <>
      {status === "ready" ? (
        <CurrentSessionMessage
          isEmpty={isEmpty}
          endTime={startTime + sessionMaxDuration}
        />
      ) : (
        <Text
          variant="bodyLarge"
          style={{ alignSelf: "center", marginVertical: 10 }}
        >
          ⚠️ Connect your die to track rolls.
        </Text>
      )}
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <TransparentButton
          onPress={() =>
            appDispatch(setDieSessionPaused({ pixelId, paused: !paused }))
          }
        >
          {paused ? (
            <MaterialIcons name="pause" size={28} color={colors.onSurface} />
          ) : (
            <MaterialCommunityIcons
              name="play-outline"
              size={24}
              color={colors.onSurface}
            />
          )}
          <Text style={{ minWidth: 110 }}>
            {paused ? "Resume" : "Pause"} reading rolls
          </Text>
        </TransparentButton>
        {!isEmpty && (
          <TransparentButton onPress={() => {}}>
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
  );
}

function DieStatsCard({
  pixelId,
  sessionId,
  dieType,
  isCurrentSession,
  contentStyle,
  ...props
}: {
  pixelId: number;
  sessionId: number;
  dieType: PixelDieType;
  isCurrentSession?: boolean;
} & Omit<CardProps, "children">) {
  const appDispatch = useAppDispatch();
  const session = useAppSelector(
    (state) => state.diceStats.entities[pixelId]?.sessions.entities[sessionId]
  );
  const isEmpty = !session?.rolls.length;
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

  const confirmRemoveLast = useConfirmActionSheet(
    `Remove Last Roll (${session?.rolls.at(-1) ?? 0})?`,
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
        { alignItems: "stretch", padding: 10, gap: 5 },
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
        onPress={() => confirmDelete()}
      >
        <MaterialCommunityIcons
          name="trash-can-outline"
          size={24}
          color={colors.onSurface}
        />
      </TouchableRipple>
      {isCurrentSession && (
        <CurrentSessionControls
          pixelId={pixelId}
          startTime={session.startTime}
          isEmpty={isEmpty}
        />
      )}
      {!isEmpty && (
        <>
          <View
            style={{
              flexDirection: "row",
              marginLeft: 5,
              gap: 10,
            }}
          >
            <MaterialCommunityIcons
              name="dice-multiple-outline"
              size={15}
              color={colors.onSurface}
            />
            <Text>Rolls: {session.rolls.length}</Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              marginLeft: 5,
              gap: 10,
            }}
          >
            <MaterialCommunityIcons
              name="calendar-today"
              size={15}
              color={colors.onSurface}
            />
            <Text>
              Started on: {new Date(session.startTime).toLocaleString()}
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              marginLeft: 5,
              gap: 10,
            }}
          >
            <MaterialCommunityIcons
              name="clock-time-four"
              size={15}
              color={colors.onSurface}
            />
            <Text>
              Duration: {toHHMMSS(session.endTime - session.startTime)}
            </Text>
            <View style={{ flexGrow: 1 }} />
            <View style={{ flexDirection: "row", marginTop: -10 }}>
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
          <Text style={{ margin: 5 }}>
            Last Few Rolls: {session.rolls.slice(-10).join(", ")}{" "}
          </Text>
          <View
            style={{
              flexDirection: "row",
              marginTop: 5,
              justifyContent: "space-between",
            }}
          >
            <TransparentButton onPress={() => shareSession(session)}>
              <MaterialCommunityIcons
                name="file-export-outline"
                size={24}
                color={colors.onSurface}
              />
              <Text>Export Session</Text>
            </TransparentButton>
            <TransparentButton onPress={confirmRemoveLast}>
              <MaterialCommunityIcons
                name="selection-ellipse-remove"
                size={24}
                color={colors.onSurface}
              />
              <Text>Remove Last Roll</Text>
            </TransparentButton>
          </View>
        </>
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

  const sessionIds = useAppSelector(
    (state) => state.diceStats.entities[pairedDie.pixelId]?.sessions?.ids
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
        <Banner
          visible={showHelp}
          collapsedMarginBottom={-10}
          onDismiss={() => appDispatch(setShowRollsHelp(false))}
        >
          Here you will find all the rolls, grouped by session, that your dice
          made while connected to the app.
        </Banner>
        {!!sessionIds?.length && (
          <View style={{ gap: 20 }}>
            {sessionIds
              .slice(sessionIds.length - maxSessionsToShow)
              .reverse()
              .map((id, i) => (
                <Animated.View
                  key={id}
                  entering={FadeIn.duration(300)}
                  layout={CurvedTransition.easingY(Easing.linear).duration(300)}
                >
                  <DieStatsCard
                    pixelId={pairedDie.pixelId}
                    sessionId={id as number}
                    dieType={pairedDie.dieType}
                    isCurrentSession={i === 0}
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
  if (!pairedDie) {
    navigation.goBack();
    return null;
  }
  return (
    <AppBackground>
      <RollsHistoryPage pairedDie={pairedDie} navigation={navigation} />
      <SelectedPixelTransferProgressBar />
    </AppBackground>
  );
}
