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

// Data of any item/page icon that will be displayed in the component
export interface BottomMenuBarItemData {
  label?: string;
  tintColor?: ColorType;
  onPress: (() => void) | null | undefined; // functions to call and navigate to function
  ImageRequirePath?: ImageSourcePropType; // Item image path. Need to return a require path ex: require(../assets/[...]image.png)
  size?: SizeType;
  alt?: string;
}

export interface BottomMenuBarProps {
  itemsData: BottomMenuBarItemData[];
  itemsTintColor?: ColorType;
  selectionHighlightColor?: ColorType;
  height?: number | string;
  width?: number | string;
  maxWidth?: number | string;
  itemsHeight?: number | string;
  itemsWidth?: number | string;
  textSize?: number | string | SizeType;
  bg?: ColorType;
}

export default function BottomToolbar(props: BottomMenuBarProps) {
  const [selected, setSelected] = React.useState(1);
  const resolvedProps = usePropsResolution("BaseBottomToolBar", props);
  return (
    <Box height={20} width="100%" maxW="100%" alignSelf="center">
      <HStack space={2} bg={resolvedProps.bg} alignItems="center">
        {props.itemsData.map((item, i) => (
          <Pressable
            py="2"
            flex={1}
            key={i}
            onPress={() => {
              if (item.onPress) item.onPress();
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
