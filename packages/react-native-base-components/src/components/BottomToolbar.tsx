import {
  Text,
  HStack,
  Center,
  VStack,
  Box,
  Pressable,
  Image,
  Spacer,
  usePropsResolution,
} from "native-base";
import {
  ColorType,
  SizeType,
} from "native-base/lib/typescript/components/types";
import React from "react";
// eslint-disable-next-line import/namespace
import { ImageSourcePropType } from "react-native";

/**
 * Data of any item/page icon that will be displayed in the toolbar
 */
export interface BottomToolBarItemData {
  label?: string; // label/name of the item
  tintColor?: ColorType;
  onPress: (() => void) | null | undefined; // function executed to navigate to other screens
  ImageRequirePath?: ImageSourcePropType; // Item image path. Need to return a require path ex: require(../assets/[...]image.png)
  size?: SizeType;
  alt?: string;
}
/**
 *  Props for {@link BottomToolBar} component.
 */
export interface BottomToolBarProps {
  itemsData?: BottomToolBarItemData[]; // array of item data used to create toolbar pressable items
  // Toolbar general props
  selectionHighlightColor?: ColorType;
  height?: number | string;
  width?: number | string;
  maxWidth?: number | string;
  // Toolbar items props
  itemsTintColor?: ColorType;
  itemsHeight?: number | string;
  itemsWidth?: number | string;
  itemsRounded?: SizeType;
  textSize?: number | string | SizeType;
  bg?: ColorType;
}
/**
 * Bottom toolbar to be used to navigate between main pages inside app.
 * @info The toolbar need to be placed inside a container that can use the React navigation functionalities in order to work, as the navigation is not done inside this component.
 * @param props See {@link BottomToolBarProps} for props parameters.
 */
export function BottomToolbar(props: BottomToolBarProps) {
  const [selected, setSelected] = React.useState(4);
  const resolvedProps = usePropsResolution(
    "BottomToolBar",
    props
  ) as BottomToolBarProps;
  return (
    <Box height={20} width="100%" maxW="100%" alignSelf="center">
      <HStack space={2} bg={resolvedProps.bg} alignItems="center">
        {props.itemsData?.map((item, i) => (
          <Pressable
            py="2"
            flex={1}
            key={i}
            onPress={() => {
              item.onPress?.();
              setSelected(i);
            }}
          >
            <Center
              h={resolvedProps.itemsHeight}
              w={resolvedProps.itemsWidth}
              bg={
                selected === i
                  ? resolvedProps.selectionHighlightColor
                  : resolvedProps.bg
              }
              rounded={resolvedProps.itemsRounded}
              p={1}
            >
              <VStack>
                <Image
                  width={6}
                  height={6}
                  source={item.ImageRequirePath}
                  size={item.size}
                  alt={item.alt === undefined ? "Menu item" : item.alt}
                  alignSelf="center"
                  tintColor={
                    item.tintColor !== undefined
                      ? item.tintColor
                      : resolvedProps.itemsTintColor
                  }
                  opacity={selected === i ? 1 : 0.5}
                />
                <Spacer />
                <Text textAlign="center" fontSize={props.textSize}>
                  {item.label}
                </Text>
              </VStack>
            </Center>
          </Pressable>
        ))}
      </HStack>
    </Box>
  );
}
