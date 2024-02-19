import { range } from "@systemic-games/pixels-core-utils";
import {
  BaseVStack,
  AppPage,
  BaseHStack,
} from "@systemic-games/react-native-base-components";
import {
  PixelColorway,
  PixelDieType,
} from "@systemic-games/react-native-pixels-connect";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import {
  Button,
  Card,
  RadioButton,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { ColorwayImage } from "~/components/ColorwayImage";
import { Colorways } from "~/features/pixels/colorways";
import { printCartonLabelAsync, PrintStatus } from "~/features/print";
import {
  setBoxShipmentAsn,
  setBoxShipmentDieColorway,
  setBoxShipmentDieType,
} from "~/features/store/validationSettingsSlice";
import { ValidationDieTypes } from "~/features/validation";

function DieTypeColumn({
  values,
  selected,
  onSelect,
}: {
  values: PixelDieType[];
  selected?: PixelDieType;
  onSelect?: (dieType: PixelDieType) => void;
}) {
  const { colors } = useTheme();
  const selectedTextStyle = { color: colors.primary };
  const { t } = useTranslation();
  return (
    <BaseVStack flexGrow={1}>
      {values.map((dt) => (
        <Pressable key={dt} onPress={() => onSelect?.(dt)}>
          <BaseHStack alignItems="center">
            <RadioButton
              value={dt}
              status={selected === dt ? "checked" : "unchecked"}
              onPress={() => onSelect?.(dt)}
            />
            <Text
              style={selected === dt ? selectedTextStyle : undefined}
              variant="bodyLarge"
            >
              {t(dt)}
            </Text>
          </BaseHStack>
        </Pressable>
      ))}
    </BaseVStack>
  );
}

function ColorwayColumn({
  values,
  selected,
  onSelect,
}: {
  values: PixelColorway[];
  selected?: PixelColorway;
  onSelect?: (colorway: PixelColorway) => void;
}) {
  const { colors } = useTheme();
  const selectedTextStyle = { color: colors.primary };
  const { t } = useTranslation();
  return (
    <BaseVStack flexGrow={1} gap={5}>
      {values.map((c) => (
        <Pressable key={c} onPress={() => onSelect?.(c)}>
          <BaseHStack alignItems="center" gap={10}>
            <ColorwayImage
              colorway={c}
              style={{
                width: 40,
                aspectRatio: 1,
                borderWidth: selected === c ? 2 : 0,
                borderColor: colors.primary,
                borderRadius: 90,
              }}
            />
            <Text
              style={selected === c ? selectedTextStyle : undefined}
              variant="bodyLarge"
            >
              {t(c)}
            </Text>
          </BaseHStack>
        </Pressable>
      ))}
    </BaseVStack>
  );
}

const asnExample = "FASN0012345";

export function CartonLabelPage() {
  const { asn, dieType, colorway } = useAppSelector(
    (state) => state.validationSettings.boxShipment
  );
  const appDispatch = useAppDispatch();
  const [printStatus, setPrintStatus] = React.useState<PrintStatus | Error>();

  const numColumns = 2;
  const { t } = useTranslation();
  return (
    <ScrollView contentContainerStyle={{ padding: 10, gap: 10 }}>
      <Card>
        <Card.Title title={t("asn")} titleVariant="titleLarge" />
        <Card.Content>
          <TextInput
            placeholder={t("example") + t("colonSeparator") + asnExample}
            value={asn}
            onChangeText={(t) => appDispatch(setBoxShipmentAsn(t))}
          />
        </Card.Content>
      </Card>
      <Card>
        <Card.Title title={t("dieType")} titleVariant="titleLarge" />
        <Card.Content>
          <BaseHStack>
            {range(numColumns).map((col) => (
              <DieTypeColumn
                key={col}
                selected={dieType}
                values={ValidationDieTypes.filter(
                  (_, i) => i % numColumns === col
                )}
                onSelect={(dt) => appDispatch(setBoxShipmentDieType(dt))}
              />
            ))}
          </BaseHStack>
        </Card.Content>
      </Card>
      <Card>
        <Card.Title title={t("colorway")} titleVariant="titleLarge" />
        <Card.Content>
          <BaseHStack>
            {range(numColumns).map((col) => (
              <ColorwayColumn
                key={col}
                selected={colorway}
                values={Colorways.filter((_, i) => i % numColumns === col)}
                onSelect={(c) => appDispatch(setBoxShipmentDieColorway(c))}
              />
            ))}
          </BaseHStack>
        </Card.Content>
      </Card>
      <Card>
        <Card.Content style={{ gap: 10 }}>
          <Button
            mode="contained-tonal"
            icon="printer"
            disabled={asn.length < asnExample.length}
            onPress={() =>
              printCartonLabelAsync(
                { dieType, colorway },
                asn,
                setPrintStatus
              ).catch(setPrintStatus)
            }
          >
            {t("printLabel")}
          </Button>
          <Text variant="bodyLarge">
            {`${t("status")}${t("colonSeparator")}${
              printStatus
                ? typeof printStatus === "string"
                  ? t(printStatus + "AsPrintStatus")
                  : printStatus
                : ""
            }`}
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

export function CartonLabelScreen() {
  return (
    <AppPage>
      <CartonLabelPage />
    </AppPage>
  );
}
