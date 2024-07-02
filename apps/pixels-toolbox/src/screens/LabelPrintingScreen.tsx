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
import { Pressable, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import {
  Button,
  ButtonProps,
  Card,
  RadioButton,
  Switch,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { ColorwayImage } from "~/components/ColorwayImage";
import {
  printCartonLabelAsync,
  printDiceSetBoxLabelAsync,
  PrintStatus,
} from "~/features/print";
import {
  setCartonLabelAsn,
  setCartonLabelDieColorway,
  setCartonLabelQuantity,
  setDiceSetLabelSetType,
  setDiceSetLabelDiceColorway,
  setCartonLabelProductType,
} from "~/features/store/validationSettingsSlice";
import {
  DiceSetType,
  getDiceSetDice,
  ValidationColorways,
  ValidationDiceSetTypes,
  ValidationDieTypes,
} from "~/features/validation";

const asnExample = "FASN0012345";

function DieTypeColumn<T extends string>({
  values,
  selected,
  onSelect,
}: {
  values: T[];
  selected?: T;
  onSelect?: (dieType: T) => void;
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

function PrintButtonCard({
  printAsync,
  ...props
}: Omit<ButtonProps, "children" | "onPress"> & {
  printAsync: (setPrintStatus: (status: PrintStatus) => void) => Promise<void>;
}) {
  const [printStatus, setPrintStatus] = React.useState<PrintStatus | Error>();
  const { t } = useTranslation();
  return (
    <Card>
      <Card.Content style={{ gap: 10 }}>
        <Button
          mode="contained-tonal"
          icon="printer"
          onPress={() =>
            printAsync((status) => setPrintStatus(status)).catch((e) => {
              console.log(`Print Error: ${e}`);
              setPrintStatus(e);
            })
          }
          {...props}
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
  );
}

function ColorwaySelectorCard({
  colorway,
  numColumns,
  onSelectColorway,
}: {
  colorway: PixelColorway;
  numColumns: number;
  onSelectColorway: (colorway: PixelColorway) => void;
}) {
  const { t } = useTranslation();
  return (
    <Card>
      <Card.Title title={t("colorway")} titleVariant="titleLarge" />
      <Card.Content>
        <BaseHStack>
          {range(numColumns).map((col) => (
            <ColorwayColumn
              key={col}
              selected={colorway}
              values={ValidationColorways.filter(
                (_, i) => i % numColumns === col
              )}
              onSelect={(c) => onSelectColorway(c)}
            />
          ))}
        </BaseHStack>
      </Card.Content>
    </Card>
  );
}

function CartonLabelForm() {
  const { asn, productType, colorway, quantity } = useAppSelector(
    (state) => state.validationSettings.cartonLabel
  );
  const appDispatch = useAppDispatch();

  const [editedQuantity, setEditedQuantity] = React.useState(
    quantity.toString()
  );
  const productCategory = (ValidationDieTypes as string[]).includes(productType)
    ? "singleDie"
    : "diceSet";
  const productTypes: readonly (PixelDieType | DiceSetType)[] =
    productCategory === "singleDie"
      ? ValidationDieTypes
      : ValidationDiceSetTypes;

  const numColumns = 2;
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <>
      <Card>
        <Card.Title title={t("productCategory")} titleVariant="titleLarge" />
        <Card.Content
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <Text
            variant="bodyLarge"
            style={
              productCategory === "singleDie"
                ? { color: colors.primary }
                : undefined
            }
          >
            {t("singleDie")}
          </Text>
          <Switch
            value={productCategory === "diceSet"}
            trackColor={{
              false: colors.inversePrimary,
              true: colors.inversePrimary,
            }}
            thumbColor={colors.primary}
            onValueChange={(v) => {
              appDispatch(setCartonLabelProductType(v ? "rpg" : "d20"));
            }}
          />
          <Text
            variant="bodyLarge"
            style={
              productCategory === "diceSet"
                ? { color: colors.primary }
                : undefined
            }
          >
            {t("diceSet")}
          </Text>
        </Card.Content>
      </Card>
      <Card>
        <Card.Title title={t("asn")} titleVariant="titleLarge" />
        <Card.Content>
          <TextInput
            placeholder={t("example") + t("colonSeparator") + asnExample}
            value={asn}
            onChangeText={(t) => appDispatch(setCartonLabelAsn(t))}
          />
        </Card.Content>
      </Card>
      <Card>
        <Card.Title title={t("productType")} titleVariant="titleLarge" />
        <Card.Content>
          <BaseHStack>
            {range(numColumns).map((col) => (
              <DieTypeColumn
                key={col}
                selected={productType}
                values={productTypes.filter((_, i) => i % numColumns === col)}
                onSelect={(dt) => appDispatch(setCartonLabelProductType(dt))}
              />
            ))}
          </BaseHStack>
        </Card.Content>
      </Card>
      <ColorwaySelectorCard
        colorway={colorway}
        numColumns={2}
        onSelectColorway={(c) => appDispatch(setCartonLabelDieColorway(c))}
      />
      <Card>
        <Card.Title title={t("quantity")} titleVariant="titleLarge" />
        <Card.Content>
          <TextInput
            value={editedQuantity}
            keyboardType="numeric"
            onChangeText={setEditedQuantity}
            onEndEditing={(e) => {
              let q = parseInt(e.nativeEvent.text, 10);
              q = isNaN(q) ? 64 : Math.max(q, 1);
              setEditedQuantity(q.toString());
              appDispatch(setCartonLabelQuantity(q));
            }}
          />
        </Card.Content>
      </Card>
      <PrintButtonCard
        disabled={
          !(productTypes as string[]).includes(productType) ||
          !(ValidationColorways as string[]).includes(colorway) ||
          asn.length < asnExample.length
        }
        printAsync={(setPrintStatus) =>
          printCartonLabelAsync(
            productCategory === "singleDie"
              ? {
                  kind: "die",
                  type: productType as PixelDieType,
                  colorway,
                }
              : {
                  kind: "set",
                  type: productType as DiceSetType,
                  colorway,
                  dice: getDiceSetDice(productType as DiceSetType),
                },
            asn,
            quantity,
            setPrintStatus
          )
        }
      />
    </>
  );
}

function DiceSetsLabelForm() {
  const { setType, colorway } = useAppSelector(
    (state) => state.validationSettings.diceSetLabel
  );
  const appDispatch = useAppDispatch();
  const numColumns = 2;
  const { t } = useTranslation();
  return (
    <>
      <Card>
        <Card.Title title={t("productType")} titleVariant="titleLarge" />
        <Card.Content>
          <BaseHStack>
            {range(numColumns).map((col) => (
              <DieTypeColumn
                key={col}
                selected={setType}
                values={ValidationDiceSetTypes.filter(
                  (_, i) => i % numColumns === col
                )}
                onSelect={(dt) => appDispatch(setDiceSetLabelSetType(dt))}
              />
            ))}
          </BaseHStack>
        </Card.Content>
      </Card>
      <ColorwaySelectorCard
        colorway={colorway}
        numColumns={2}
        onSelectColorway={(c) => appDispatch(setDiceSetLabelDiceColorway(c))}
      />
      <PrintButtonCard
        disabled={
          !ValidationDiceSetTypes.includes(setType) ||
          !ValidationColorways.includes(colorway)
        }
        printAsync={(setPrintStatus) =>
          printDiceSetBoxLabelAsync(
            {
              kind: "set",
              type: setType,
              colorway,
              dice: getDiceSetDice(setType),
            },
            setPrintStatus
          )
        }
      />
    </>
  );
}

export function LabelPrintingPage() {
  const [formType, setFormType] = React.useState<"carton" | "sets">("carton");
  const { t } = useTranslation();
  return (
    <ScrollView contentContainerStyle={{ padding: 10, gap: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 10 }}>
        <Button
          mode={formType === "carton" ? "contained" : "outlined"}
          onPress={() => setFormType("carton")}
        >
          {t("carton")}
        </Button>
        <Button
          mode={formType === "sets" ? "contained" : "outlined"}
          onPress={() => setFormType("sets")}
        >
          {t("diceSetBox")}
        </Button>
      </View>
      {formType === "carton" ? <CartonLabelForm /> : <DiceSetsLabelForm />}
    </ScrollView>
  );
}

export function LabelPrintingScreen() {
  return (
    <AppPage>
      <LabelPrintingPage />
    </AppPage>
  );
}