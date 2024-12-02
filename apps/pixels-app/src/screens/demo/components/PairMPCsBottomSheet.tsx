import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { range } from "@systemic-games/pixels-core-utils";
import { ScannedMPCNotifier } from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { View } from "react-native";
import { Button, Text, ThemeProvider, useTheme } from "react-native-paper";
import { FadeIn } from "react-native-reanimated";
import { RootSiblingParent } from "react-native-root-siblings";

import { useAppStore } from "~/app/hooks";
import { AppStyles } from "~/app/styles";
import { getBottomSheetProps } from "~/app/themes";
import { BluetoothStateWarning } from "~/components/BluetoothWarning";
import { ScanningIndicator } from "~/components/ScanningIndicator";
import { TouchableCard } from "~/components/TouchableCard";
import { AnimatedText } from "~/components/animated";
import { GradientButton } from "~/components/buttons";
import { addPairedMPC } from "~/features/store/pairedMPCsSlice";
import { TrailingSpaceFix } from "~/fixes";
import { useBottomSheetPadding, useBottomSheetBackHandler } from "~/hooks";
import { useMPCScanner } from "~/hooks/useMPCScanner";

function ScannedMPCCard({
  scannedMPC,
  selected,
  onToggleSelect,
}: {
  scannedMPC: ScannedMPCNotifier;
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
  return (
    <TouchableCard
      selected={selected}
      selectable
      gradientBorder="bright"
      onPress={onToggleSelect}
    >
      <Text
        numberOfLines={1}
        variant="bodyMedium"
        style={{ marginTop: 6, fontFamily: "LTInternet-Bold" }}
      >
        {scannedMPC.name}
      </Text>
      <Text numberOfLines={1}>LEDs count: {scannedMPC.ledCount}</Text>
    </TouchableCard>
  );
}

function ScannedMPCsColumn({
  scannedMPCs,
  selection,
  onToggleSelect,
}: {
  scannedMPCs: readonly ScannedMPCNotifier[];
  selection: readonly ScannedMPCNotifier[];
  onToggleSelect: (scannedMPC: ScannedMPCNotifier) => void;
}) {
  return (
    <View style={{ flex: 1, gap: 15 }}>
      {scannedMPCs.map((sp) => (
        <ScannedMPCCard
          key={sp.pixelId}
          scannedMPC={sp}
          selected={selection.includes(sp)}
          onToggleSelect={() => onToggleSelect(sp)}
        />
      ))}
    </View>
  );
}

function SelectScannedMPCs({
  scannedMPCs,
  numColumns = 2,
  onPairMPCs,
}: {
  scannedMPCs: readonly ScannedMPCNotifier[];
  numColumns?: number;
  onPairMPCs: (scannedMPCs: ScannedMPCNotifier[]) => void;
}) {
  const [showNoMPC, setShowNoMPC] = React.useState(false);
  const noAvailableMPC = scannedMPCs.length === 0;
  React.useEffect(() => {
    if (noAvailableMPC) {
      const id = setTimeout(() => setShowNoMPC(true), 3000);
      return () => clearTimeout(id);
    } else {
      setShowNoMPC(false);
    }
  }, [noAvailableMPC]);

  const [selection, setSelection] = React.useState<ScannedMPCNotifier[]>([]);
  const { colors } = useTheme();

  return (
    <>
      <BottomSheetScrollView
        contentContainerStyle={{
          flexDirection: "row",
          gap: 10,
        }}
      >
        {scannedMPCs.length ? (
          range(numColumns).map((col) => (
            <ScannedMPCsColumn
              key={col}
              scannedMPCs={scannedMPCs.filter((_, i) => i % numColumns === col)}
              selection={selection}
              onToggleSelect={(sp) =>
                setSelection((selected) =>
                  selected.includes(sp)
                    ? selected.filter((other) => other !== sp)
                    : [...selected, sp]
                )
              }
            />
          ))
        ) : (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              marginLeft: 10,
            }}
          >
            <ScanningIndicator />
            <AnimatedText
              key={showNoMPC ? "empty" : "scanning"}
              entering={FadeIn.duration(300)}
            >
              {showNoMPC
                ? "No MPCs found. Make sure they are nearby and powered on."
                : "Scanning for MPCs..."}
              .
            </AnimatedText>
          </View>
        )}
      </BottomSheetScrollView>
      {/* Show select/ unselect all when more than 1 line of MPCs cards */}
      {scannedMPCs.length > 3 && (
        <View
          style={{
            flexDirection: "row",
            marginVertical: -10,
            justifyContent: "space-between",
          }}
        >
          <Button
            compact
            textColor={colors.primary}
            sentry-label="select-all-mpcs"
            onPress={() => setSelection([...scannedMPCs])}
          >
            {"Select All" + TrailingSpaceFix}
          </Button>
          <Button
            compact
            textColor={colors.primary}
            sentry-label="unselect-all-mpcs"
            onPress={() => setSelection([])}
          >
            Unselect All
          </Button>
        </View>
      )}
      <GradientButton
        disabled={!selection.length}
        sentry-label="pair-mpcs"
        style={{ marginVertical: 10 }}
        onPress={() => onPairMPCs(selection)}
      >
        {!selection.length
          ? "No MPC Selected"
          : `Pair ${selection.length} MPC${selection.length <= 1 ? "" : "s"}`}
      </GradientButton>
    </>
  );
}

export function PairMPCsBottomSheet({
  visible,
  onDismiss,
}: {
  visible: boolean;
  onDismiss?: (scannedMPCs?: ScannedMPCNotifier[]) => void;
}) {
  const store = useAppStore();
  const { availableMPCs, startScan, stopScan, scanError } = useMPCScanner();

  // Start scan on opening bottom sheet
  React.useEffect(() => {
    visible && startScan();
  }, [startScan, visible]);

  // Stop scan on closing bottom sheet
  const dismiss = React.useCallback(
    (scannedMPCs?: ScannedMPCNotifier[]) => {
      stopScan();
      onDismiss?.(scannedMPCs);
    },
    [onDismiss, stopScan]
  );

  // Pair selected MPCs
  const pairMPCs = React.useCallback(
    (scannedMPCs: ScannedMPCNotifier[]) => {
      for (const mpc of scannedMPCs) {
        store.dispatch(
          addPairedMPC({
            systemId: mpc.systemId,
            pixelId: mpc.pixelId,
            name: mpc.name,
            ledCount: mpc.ledCount,
            firmwareTimestamp: mpc.firmwareDate.getTime(),
          })
        );
      }
      dismiss(scannedMPCs);
    },
    [dismiss, store]
  );

  const sheetRef = React.useRef<BottomSheetModal>(null);
  const onChange = useBottomSheetBackHandler(sheetRef);
  React.useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [startScan, stopScan, visible]);

  const paddingBottom = useBottomSheetPadding(0);
  const theme = useTheme();
  const { colors } = theme;
  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={["60%"]}
      onDismiss={dismiss}
      onChange={onChange}
      {...getBottomSheetProps(colors)}
    >
      <RootSiblingParent>
        <ThemeProvider theme={theme}>
          {visible && (
            <View
              style={{
                flex: 1,
                flexGrow: 1,
                paddingHorizontal: 10,
                paddingBottom,
                gap: 10,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text variant="titleMedium">Select MPC(s) to Pair</Text>
                <Text style={AppStyles.selfCentered}>
                  {availableMPCs.length <= 3
                    ? ""
                    : ` (${availableMPCs.length} available)`}
                </Text>
              </View>
              <BluetoothStateWarning>
                {scanError ? (
                  <Text variant="bodyLarge" style={{ padding: 10 }}>
                    ❌ Error trying to scan for MPCs!{"\n"}
                    {scanError.message}.
                  </Text>
                ) : (
                  <SelectScannedMPCs
                    scannedMPCs={availableMPCs}
                    onPairMPCs={pairMPCs}
                  />
                )}
              </BluetoothStateWarning>
            </View>
          )}
        </ThemeProvider>
      </RootSiblingParent>
    </BottomSheetModal>
  );
}
