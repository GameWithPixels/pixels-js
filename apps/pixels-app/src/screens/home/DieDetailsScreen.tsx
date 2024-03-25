import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Pixel,
  Profiles,
  usePixelStatus,
  usePixelValue,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";
import { Switch, Text, useTheme } from "react-native-paper";

import RollsPerFaceIcon from "#/icons/home/rolls-per-face";
import { PairedDie } from "~/app/PairedDie";
import { useAppSelector } from "~/app/hooks";
import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import { ProfileUsage } from "~/components/ProfileUsage";
import { Banner } from "~/components/banners";
import { StatsViewMode, StatsViewModeButton } from "~/components/buttons";
import { StatsBarGraph, StatsGrid, StatsList } from "~/components/stats";
import {
  getColorwayLabel,
  getDieTypeLabel,
  getRollStateLabel,
} from "~/features/profiles";
import { unsigned32ToHex } from "~/features/utils";
import {
  useActiveProfile,
  useHasFirmwareUpdate,
  useWatchedPixel,
  usePixelDataTransfer,
} from "~/hooks";
import { DieDetailsScreenProps } from "~/navigation";
import { Colors } from "~/themes";

function SectionTitle({ children }: React.PropsWithChildren) {
  return (
    <Text variant="titleMedium" style={{ paddingTop: 8, marginBottom: -2 }}>
      {children}
    </Text>
  );
}

export function DieStatus({
  pixel,
  style,
  ...props
}: { pixel: Pixel } & ViewProps) {
  const status = usePixelStatus(pixel);
  const [rssi] = usePixelValue(pixel, "rssi");
  const [battery] = usePixelValue(pixel, "battery");
  const [rollState] = usePixelValue(pixel, "rollState");
  const transferProgress = usePixelDataTransfer(pixel);
  const transferring = transferProgress >= 0 && transferProgress < 100;
  return (
    <View style={[{ gap: 10 }, style]} {...props}>
      <SectionTitle>General</SectionTitle>
      <View style={styles.paragraph}>
        <Text>Connection Status: {status}</Text>
        {status === "ready" && (
          <>
            <Text>RSSI: {rssi ?? 0} dBm</Text>
            <Text>Battery: {battery?.level ?? 0}%</Text>
            <Text>Charging: {battery?.isCharging ? "yes" : "no"}</Text>
            <Text>
              Roll Status:{" "}
              {getRollStateLabel(rollState?.state).toLocaleLowerCase()}
            </Text>
            <Text>Face Up: {rollState?.face ?? ""}</Text>
            <Text>
              Activating Profile:{" "}
              {transferring ? `${transferProgress}%` : "done"}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

export function DieProfile({
  profile,
}: {
  profile: Readonly<Profiles.Profile>;
}) {
  return (
    <>
      <SectionTitle>Active Profile</SectionTitle>
      <View style={styles.paragraph}>
        {profile ? (
          <>
            <Text>Name: {profile.name}</Text>
            <ProfileUsage profile={profile} />
          </>
        ) : (
          <Text>No Profile!</Text>
        )}
      </View>
    </>
  );
}

export function DieStats({
  pixel,
  style,
  ...props
}: { pixel: Pixel } & ViewProps) {
  const [viewType, setViewType] = React.useState<"session" | "lifetime">(
    "session"
  );
  const sessionValues = React.useMemo(() => [1, 2, 3, 4, 5], []);
  const lifetimeValues = React.useMemo(() => [1, 2, 3, 4, 5], []);
  const values = viewType === "session" ? sessionValues : lifetimeValues;
  const isSession = viewType === "session";
  const [viewMode, setViewMode] = React.useState<StatsViewMode>("bars");
  const { colors } = useTheme();
  const textColor = { color: colors.primary };
  return (
    <View style={style} {...props}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          <Text style={isSession ? textColor : undefined}>Session</Text>
          <Switch
            value={!isSession}
            color={Colors.grey400}
            onValueChange={() =>
              setViewType((t) => (t === "lifetime" ? "session" : "lifetime"))
            }
          />
          <Text style={isSession ? undefined : textColor}>Lifetime</Text>
        </View>
        <View style={{ flexGrow: 1 }} />
        {["bars", "list", "grid"].map((vm) => (
          <StatsViewModeButton
            key={vm}
            viewMode={vm as StatsViewMode}
            activeMode={viewMode}
            sentry-label="view-mode"
            style={{ padding: 10 }}
            onChange={setViewMode}
          />
        ))}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <FontAwesome5
          name="dice"
          size={16}
          color={colors.onSurface}
          style={{ marginRight: 10 }}
        />
        <Text>Die Rolls: 328</Text>
        <View style={{ flexGrow: 1 }} />
        <MaterialCommunityIcons
          name="clock-time-four"
          size={15}
          color={colors.onSurface}
          style={{ marginRight: 10 }}
        />
        <Text>Usage Time: 2h 23m</Text>
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 10,
        }}
      >
        <RollsPerFaceIcon style={{ marginRight: 10 }} size={15} />
        <Text>Rolls Per Face</Text>
      </View>
      {viewMode === "bars" ? (
        <StatsBarGraph rollStats={values} />
      ) : viewMode === "list" ? (
        <StatsList rollStats={values} dieType={pixel.dieType} />
      ) : (
        <StatsGrid rollStats={values} dieType={pixel.dieType} />
      )}
    </View>
  );
}

function DieAdvancedInfo({
  pixel,
  style,
  ...props
}: {
  pixel: Pixel;
  onUnpair?: (pixel: Pixel) => void;
} & ViewProps) {
  return (
    <View style={[{ gap: 10 }, style]} {...props}>
      <SectionTitle>Die</SectionTitle>
      <View style={styles.paragraph}>
        <Text>Pixel ID: {unsigned32ToHex(pixel.pixelId)}</Text>
        <Text>Chip Model: nRF52810</Text>
        <Text>LED Count: {pixel.ledCount}</Text>
        <Text>Die Type: {getDieTypeLabel(pixel.dieType)}</Text>
        <Text>Colorway: {getColorwayLabel(pixel.colorway)}</Text>
        <Text>Total Usable Flash: 8192kB</Text>
        {/* <Text>Available Flash: 1212kB</Text>
        <Text>Last Connected: {new Date().toLocaleString()}</Text> */}
      </View>
      <SectionTitle>Firmware</SectionTitle>
      <View style={styles.paragraph}>
        <Text>
          Build Timestamp:{" "}
          {pixel.firmwareDate.getTime()
            ? pixel.firmwareDate.toLocaleString()
            : "unknown"}
        </Text>
        {/* <Text>Firmware Version: 12.3</Text>
        <Text>Settings Version: 12.3</Text>
        <Text>Compat Standard Api Version: 12.3</Text>
        <Text>Compat Extended Api Version: 12.3</Text>
        <Text>Compat Management Api Version: 12.3</Text> */}
      </View>
    </View>
  );
}

function FirmwareUpdateBanner({
  pixel,
  onAction,
}: {
  pixel: Pixel;
  onAction?: () => void;
}) {
  const hasFirmwareUpdate = useHasFirmwareUpdate(pixel);
  const [firmwareUpdateVisible, setFirmwareUpdateVisible] =
    React.useState(true);
  return hasFirmwareUpdate ? (
    <Banner
      visible={firmwareUpdateVisible}
      title="Update Available!"
      actionText="Update Now"
      onAction={onAction}
      onDismiss={() => setFirmwareUpdateVisible(false)}
    >
      A firmware update is available for your die.
    </Banner>
  ) : null;
}

function DieDetailsPage({
  pairedDie,
  navigation,
}: {
  pairedDie: PairedDie;
  navigation: DieDetailsScreenProps["navigation"];
}) {
  const pixel = useWatchedPixel(pairedDie);
  const activeProfile = useActiveProfile(pairedDie);

  return (
    <View style={{ height: "100%" }}>
      <PageHeader mode="chevron-down" onGoBack={() => navigation.goBack()}>
        {pairedDie.name}
      </PageHeader>
      {pixel ? (
        <GHScrollView
          contentContainerStyle={{
            paddingHorizontal: 10,
            paddingBottom: 20,
            gap: 10,
          }}
        >
          {pixel && (
            <FirmwareUpdateBanner
              pixel={pixel}
              onAction={() => navigation.replace("firmwareUpdate")}
            />
          )}
          <DieStatus pixel={pixel} style={{ marginTop: 10 }} />
          <DieProfile profile={activeProfile} />
          {/* <SectionTitle>Rolls Statistics</SectionTitle>
          <DieStats pixel={pixel} style={{ marginTop: -10 }} /> */}
          <DieAdvancedInfo pixel={pixel} />
        </GHScrollView>
      ) : (
        <Text
          variant="bodyLarge"
          style={{ alignSelf: "center", marginTop: 20 }}
        >
          No information available.
        </Text>
      )}
    </View>
  );
}

export function DieDetailsScreen({
  route: {
    params: { pixelId },
  },
  navigation,
}: DieDetailsScreenProps) {
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
        <DieDetailsPage pairedDie={pairedDie} navigation={navigation} />
      )}
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  paragraph: {
    marginLeft: 10,
    marginBottom: 10,
    gap: 5,
  },
});
