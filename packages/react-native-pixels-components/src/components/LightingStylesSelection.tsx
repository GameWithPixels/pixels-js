import { ActionSheet } from "@systemic-games/react-native-base-components";
import { ChevronDownIcon, useDisclose, Button } from "native-base";
import React from "react";

// TODO eslint annotation shouldn't be needed here, also function name should start with lower case
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function LightingStyleSelection() {
  const [lightingTypeText, SetLightingType] = React.useState("Simple Flashes");
  // TODO just remove unused code
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selected, setSelected] = React.useState(1);
  // TODO just remove unused code
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [buttonIcon, SetChevronIcon] = React.useState(
    <ChevronDownIcon alignSelf="center" />
  );
  return (
    <>
      {/* <Button onPress={onOpen}>{lightingTypeText}</Button> */}
      <ActionSheet
        title={lightingTypeText}
        triggerLabel={lightingTypeText}
        itemsData={[
          {
            label: "Simple Flashes",
            onPress: () => {
              SetLightingType("Simple Flashes");
            },
          },
          {
            label: "Colorful Rainbow",
            onPress: () => {
              SetLightingType("Colorful Rainbow");
            },
          },
          {
            label: "Simple Gradient",
            onPress: () => {
              SetLightingType("Simple Gradient");
            },
          },
          {
            label: "Color LED Pattern",
            onPress: () => {
              SetLightingType("Color LED Pattern");
            },
          },
          {
            label: "Gradient LED Pattern",
            onPress: () => {
              SetLightingType("Gradient LED Pattern");
            },
          },
        ]}
      />
    </>
  );
}
