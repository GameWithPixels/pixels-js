import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Pixel,
  usePixelStatus,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { View, ViewProps } from "react-native";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";
import { Switch, Text, useTheme } from "react-native-paper";

import RollsPerFaceIcon from "#/icons/home/rolls-per-face";
import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import { Banner } from "~/components/banners";
import { StatsViewMode, StatsViewModeButton } from "~/components/buttons";
import { ProfileCard } from "~/components/profile";
import { StatsBarGraph, StatsGrid, StatsList } from "~/components/stats";
import { useActiveProfile, usePairedPixel } from "~/hooks";
import { DieDetailsScreenProps } from "~/navigation";
import { Colors } from "~/themes";

export function generateRollStats(pixel: Pixel): number[] {
  return Array(pixel.dieFaceCount)
    .fill(0)
    .map(() => 10 + Math.round(15 * Math.random()));
}

function SectionTitle({ children }: React.PropsWithChildren) {
  return (
    <Text variant="titleMedium" style={{ paddingTop: 8, marginBottom: -2 }}>
      {children}
    </Text>
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
  const sessionValues = React.useMemo(() => generateRollStats(pixel), [pixel]);
  const lifetimeValues = React.useMemo(() => generateRollStats(pixel), [pixel]);
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
            style={{ padding: 10 }}
            viewMode={vm as StatsViewMode}
            activeMode={viewMode}
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
      <View style={{ marginLeft: 10, marginBottom: 10, gap: 5 }}>
        <Text>Pixel ID: 45AE645C</Text>
        <Text>Chip Model: nRF52810</Text>
        <Text>{`LED Count: ${pixel.ledCount}`}</Text>
        <Text>{`Die Type: ${pixel.dieType}`}</Text>
        <Text>{`Colorway: ${pixel.colorway}`}</Text>
        <Text>Available Flash: 1212kB</Text>
        <Text>Total Usable Flash: 8192kB</Text>
        <Text>Last Connected: {new Date().toLocaleString()}</Text>
      </View>
      <SectionTitle>Firmware</SectionTitle>
      <View style={{ marginLeft: 10, marginBottom: 10, gap: 5 }}>
        <Text>Firmware Version: 12.3</Text>
        <Text>Build Timestamp: {new Date().toLocaleString()}</Text>
        <Text>Settings Version: 12.3</Text>
        <Text>Compat Standard Api Version: 12.3</Text>
        <Text>Compat Extended Api Version: 12.3</Text>
        <Text>Compat Management Api Version: 12.3</Text>
      </View>
      <SectionTitle>Active Profile</SectionTitle>
      <View style={{ marginLeft: 10, marginBottom: 10, gap: 5 }}>
        <Text>Profile Size: 1234B</Text>
        <Text>Number Of Sequences: 12</Text>
        <Text>Number Of Animations: 12</Text>
        <Text>Number Of Gradients: 12</Text>
        <Text>Number Of Curves: 12</Text>
        <Text>Number Of Colors: 12</Text>
        <Text>Number Of Scalars: 12</Text>
      </View>
    </View>
  );
}

function DieDetailsPage({
  pixelId,
  navigation,
}: {
  pixelId: number;
  navigation: DieDetailsScreenProps["navigation"];
}) {
  const pixel = usePairedPixel(pixelId);
  const { activeProfile } = useActiveProfile(pixel);
  React.useEffect(() => {
    if (!pixel) {
      navigation.goBack();
    }
  }, [navigation, pixel]);

  const status = usePixelStatus(pixel);
  const disabled = status !== "ready";

  const [firmwareUpdateVisible, setFirmwareUpdateVisible] =
    React.useState(true);
  return (
    <View style={{ height: "100%" }}>
      <PageHeader mode="chevron-down" onGoBack={() => navigation.goBack()}>
        {pixel?.name}
      </PageHeader>
      {pixel && (
        <GHScrollView
          contentContainerStyle={{
            paddingHorizontal: 10,
            paddingBottom: 20,
            gap: 10,
          }}
        >
          <Banner
            visible={firmwareUpdateVisible}
            title="Update available!"
            actionText="Update Now"
            onDismiss={() => setFirmwareUpdateVisible(false)}
          >
            A software update is available for your die.
          </Banner>
          <SectionTitle>Active Profile</SectionTitle>
          {activeProfile ? (
            <ProfileCard row profile={activeProfile} disabled={disabled} />
          ) : (
            <Text>No Profile!</Text>
          )}
          <SectionTitle>Rolls Statistics</SectionTitle>
          <DieStats pixel={pixel} style={{ marginTop: -10 }} />
          <DieAdvancedInfo pixel={pixel} style={{ marginTop: 10 }} />
        </GHScrollView>
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
  return (
    <AppBackground>
      <DieDetailsPage pixelId={pixelId} navigation={navigation} />
    </AppBackground>
  );
}
