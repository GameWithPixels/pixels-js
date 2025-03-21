import { MaterialCommunityIcons } from "@expo/vector-icons";
import { unsigned32ToHex } from "@systemic-games/pixels-core-utils";
import {
  Pixel,
  Profiles,
  usePixelProp,
  usePixelStatus,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import {
  StyleProp,
  StyleSheet,
  View,
  ViewProps,
  ViewStyle,
} from "react-native";
import { ScrollView as GHScrollView } from "react-native-gesture-handler";
import { Text, useTheme } from "react-native-paper";

import { PairedDie } from "~/app/PairedDie";
import { DieDetailsScreenProps } from "~/app/navigation";
import { AppBackground } from "~/components/AppBackground";
import { PageHeader } from "~/components/PageHeader";
import { PixelConnectionStatus } from "~/components/PixelConnectionStatus";
import { SelectedPixelTransferProgressBar } from "~/components/PixelTransferProgressBar";
import { ProfileUsage } from "~/components/ProfileUsage";
import { Banner } from "~/components/banners";
import {
  getColorwayLabel,
  getDieTypeLabel,
  getFirmwareUpdateAvailable,
  getPixelStatusLabel,
  getRollStateLabel,
} from "~/features/profiles";
import {
  useHasFirmwareUpdate,
  useProfile,
  useSetSelectedPairedDie,
  useRegisteredPixel,
  usePixelTransferProgress,
} from "~/hooks";

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
}: { pixel?: Pixel } & ViewProps) {
  const status = usePixelStatus(pixel);
  const rssi = usePixelProp(pixel, "rssi");
  const batteryLevel = usePixelProp(pixel, "batteryLevel");
  const isCharging = usePixelProp(pixel, "isCharging");
  const rollState = usePixelProp(pixel, "rollState");
  const currentFace = usePixelProp(pixel, "currentFace");
  const transferProgress = usePixelTransferProgress(pixel);
  const { colors } = useTheme();
  return (
    <View style={[{ gap: 10 }, style]} {...props}>
      <SectionTitle>General</SectionTitle>
      <View style={styles.paragraph}>
        <Text>
          {status ? (
            <>
              {"Connection Status: "}
              <PixelConnectionStatus
                status={status}
                size={16}
                color={colors.onSurface}
              />
              {` ${getPixelStatusLabel(status)}`}
            </>
          ) : (
            "Die not found so far"
          )}
        </Text>
        {pixel?.status === "ready" && (
          <>
            <Text>
              RSSI:{" "}
              <MaterialCommunityIcons
                name="signal"
                size={16}
                color={colors.onSurface}
              />{" "}
              {rssi ?? 0} dBm
            </Text>
            <Text>
              Battery:{" "}
              <MaterialCommunityIcons
                name="battery"
                size={16}
                color={colors.onSurface}
              />{" "}
              {batteryLevel}%
            </Text>
            <Text>Charging: {isCharging ? "yes ⚡" : "no"}</Text>
            <Text>
              Roll Status: {getRollStateLabel(rollState).toLocaleLowerCase()}
            </Text>
            <Text>Face Up: {currentFace}</Text>
            <Text>
              Programming Profile:{" "}
              {transferProgress >= 0 ? `${transferProgress}%` : "no"}
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
    profile && (
      <>
        <SectionTitle>Profile</SectionTitle>
        <View style={styles.paragraph}>
          <>
            <Text>Name: {profile.name}</Text>
            <ProfileUsage profile={profile} />
          </>
        </View>
      </>
    )
  );
}

function DieAdvancedInfo({
  pairedDie,
  pixel,
  style,
  ...props
}: {
  pairedDie: PairedDie;
  pixel?: Pixel;
} & ViewProps) {
  const firmwareDate = usePixelProp(pixel, "firmwareDate");
  return (
    <View style={[{ gap: 10 }, style]} {...props}>
      <SectionTitle>Die</SectionTitle>
      <View style={styles.paragraph}>
        <Text>Pixel ID: {unsigned32ToHex(pairedDie.pixelId)}</Text>
        <Text>Chip Model: nRF52810</Text>
        <Text>LED Count: {pairedDie.ledCount ?? 0}</Text>
        <Text>Die Type: {getDieTypeLabel(pairedDie.dieType ?? "unknown")}</Text>
        <Text>
          Colorway: {getColorwayLabel(pairedDie.colorway ?? "unknown")}
        </Text>
        <Text>Total Usable Flash: 8192kB</Text>
        {/* <Text>Available Flash: 1212kB</Text>
        <Text>Last Connected: {new Date().toLocaleString()}</Text> */}
      </View>
      <SectionTitle>Firmware</SectionTitle>
      <View style={styles.paragraph}>
        <Text>
          Build Timestamp:{" "}
          {firmwareDate?.getTime()
            ? firmwareDate.toLocaleString()
            : new Date(pairedDie.firmwareTimestamp).toLocaleString()}
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
  onUpdate,
  style,
}: {
  pixel: Pixel;
  onUpdate?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const hasFirmwareUpdate = useHasFirmwareUpdate(pixel);
  return hasFirmwareUpdate ? (
    <Banner
      visible
      title="Update Available"
      actionText="Update Now"
      style={style}
      onAction={onUpdate}
    >
      {getFirmwareUpdateAvailable(1)}
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
  const pixel = useRegisteredPixel(pairedDie);
  const activeProfile = useProfile(pairedDie.profileUuid);
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
        {pixel && (
          <FirmwareUpdateBanner
            pixel={pixel}
            onUpdate={() => navigation.replace("firmwareUpdate")}
          />
        )}
        <DieStatus pixel={pixel} style={{ marginTop: 10 }} />
        <DieProfile profile={activeProfile} />
        <DieAdvancedInfo pairedDie={pairedDie} pixel={pixel} />
      </GHScrollView>
    </View>
  );
}

export function DieDetailsScreen({
  route: {
    params: { pixelId },
  },
  navigation,
}: DieDetailsScreenProps) {
  const pairedDie = useSetSelectedPairedDie(pixelId);
  React.useEffect(() => {
    if (!pairedDie) {
      navigation.goBack();
    }
  }, [pairedDie, navigation]);
  return !pairedDie ? null : (
    <AppBackground>
      <DieDetailsPage pairedDie={pairedDie} navigation={navigation} />
      <SelectedPixelTransferProgressBar />
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
