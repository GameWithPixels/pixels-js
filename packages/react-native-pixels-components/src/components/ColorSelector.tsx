/* eslint-disable @typescript-eslint/no-unused-vars */
import { Ionicons } from "@expo/vector-icons";
import {
  ColorUtils,
  EditRgbKeyframe,
} from "@systemic-games/pixels-edit-animation";
import {
  ColorWheel,
  BaseBoxProps,
  BaseButton,
  BaseButtonProps,
  BaseFlexProps,
  BaseHStack,
  BaseVStack,
  RoundedBox,
  useDisclose,
} from "@systemic-games/react-native-base-components";
import React from "react";
import { ScrollView, ViewProps } from "react-native";
import { Card, Modal, ModalProps, Portal, Text } from "react-native-paper";
import Svg, { Defs, LinearGradient, Stop, Rect } from "react-native-svg";

import { useModalStyle } from "../theme";

/**
 * Simple button for selecting basic color shade
 */
function ColorButton(props: BaseButtonProps) {
  return <BaseButton w={20} width={20} aspectRatio={1} {...props} />;
}

/**
 * Props for customizing elements and behavior of a ColorSelection or GradientColorSelection component.
 */
interface ColorSelectorProps extends BaseFlexProps {
  color: ColorUtils.IColor;
  onColorSelect?: (value: string) => void;
}

/**
 * Color selection component used for selecting a single color shade from a color wheel / color picker.
 * {@link ColorSelectorProps} for the component props to customize some elements.
 * @return A ColorSelection JSX element.
 */
export function ColorSelector({
  color,
  onColorSelect,
  ...flexProps
}: ColorSelectorProps) {
  const { isOpen, onOpen, onClose } = useDisclose();
  return (
    <>
      <BaseButton
        onPress={onOpen}
        color={ColorUtils.colorToString(color)}
        {...flexProps}
      >
        <Ionicons name="color-palette-outline" size={24} color="white" />
      </BaseButton>

      <SelectColorModal
        visible={isOpen}
        onDismiss={onClose}
        color={color}
        onColorSelect={onColorSelect}
      />
    </>
  );
}

export interface SelectColorModalProps
  extends Pick<ColorSelectorProps, "color" | "onColorSelect">,
    Omit<ModalProps, "children"> {}

export function SelectColorModal({
  onDismiss,
  color,
  onColorSelect,
  ...props
}: SelectColorModalProps) {
  const modalStyle = useModalStyle();
  return (
    <Portal>
      <Modal
        contentContainerStyle={modalStyle}
        onDismiss={onDismiss}
        {...props}
      >
        <Card>
          <Card.Content>
            <BaseVStack w="100%" alignItems="center">
              <RoundedBox
                w="60%"
                aspectRatio={1}
                bg={ColorUtils.colorToString(color)}
                justifyContent="center"
              >
                {/* TODO */}
                <Text>Render colored die here</Text>
                {/* {dieRenderer()} */}
              </RoundedBox>
              <ColorWheel
                w="90%"
                initialColor={color}
                onSelectColor={onColorSelect}
              />
            </BaseVStack>
          </Card.Content>
          <Card.Actions>
            <BaseHStack w="100%" justifyContent="space-between">
              <ColorButton
                color="black"
                onPress={() => {
                  onColorSelect?.("#000000");
                  onDismiss?.();
                }}
              />
              <ColorButton
                color="white"
                onPress={() => {
                  onColorSelect?.("#FFFFFF");
                  onDismiss?.();
                }}
              />
              <ColorButton
                color="red"
                onPress={() => {
                  onColorSelect?.("#FF0000");
                  onDismiss?.();
                }}
              />
              <ColorButton
                color="green"
                onPress={() => {
                  onColorSelect?.("#00FF00");
                  onDismiss?.();
                }}
              />
              <ColorButton
                color="blue"
                onPress={() => {
                  onColorSelect?.("#0000FF");
                  onDismiss?.();
                }}
              />
            </BaseHStack>
          </Card.Actions>
        </Card>
      </Modal>
    </Portal>
  );
}

/**
 * Props for customizing elements and behavior of a ColorSelection or GradientColorSelection component.
 */
interface GradientColorSelectorProps extends BaseFlexProps {
  initialColor?: string;
  initialKeyFrames?: EditRgbKeyframe[];
  onSelect?: (keyframes: EditRgbKeyframe[]) => void;
}

export function GradientColorSelector({
  initialColor,
  initialKeyFrames,
  onSelect,
  ...flexProps
}: GradientColorSelectorProps) {
  const { isOpen, onOpen, onClose } = useDisclose();
  const [selectedColor, setSelectedColor] = React.useState(
    initialColor ?? "red"
  );
  const [_rgbKeyFrames, _setRgbKeyFrames] = React.useState(initialKeyFrames);
  return (
    <>
      <BaseButton onPress={onOpen} color={selectedColor} {...flexProps}>
        <Ionicons name="color-palette-outline" size={24} color="white" />
      </BaseButton>

      <GradientColorSelectorActionsheet
        isOpen={isOpen}
        onClose={onClose}
        selectedColor={selectedColor}
        setSelectedColor={setSelectedColor}
      />
    </>
  );
}

function GradientColorSelectorActionsheet({
  selectedColor,
  setSelectedColor,
  isOpen,
  onClose,
  ...props
}: {
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  isOpen: boolean;
  onClose?: () => void;
} & ViewProps) {
  const [selectedGradientKey, setSelectedGradientKey] = React.useState(0);
  //Temporary for testing
  const [keyColor1, setKeyColor1] = React.useState("black");
  const [keyColor2, setKeyColor2] = React.useState("black");
  const [keyColor3, setKeyColor3] = React.useState("black");
  const [keyColor4, setKeyColor4] = React.useState("black");
  const [keyColor5, setKeyColor5] = React.useState("black");
  const [keyColor6, setKeyColor6] = React.useState("black");
  const [keyColor7, setKeyColor7] = React.useState("black");
  const [keyColor8, setKeyColor8] = React.useState("black");
  const gradientKeylength = 100 / 7;
  return (
    <></>
    // <Actionsheet maxHeight="95%" onClose={onClose} {...props}>
    //   <Actionsheet.Content maxHeight="95%" minHeight="95%">
    //     <ScrollView>
    //       <BaseVStack p={2} alignItems="center" w="100%">
    //         <Box width="100%" alignItems="center">
    //           <Svg height="200" width="100%">
    //             <Defs>
    //               <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
    //                 <Stop offset="0" stopColor={keyColor1} stopOpacity="1" />
    //                 <Stop
    //                   offset={`${gradientKeylength}%`}
    //                   stopColor={keyColor2}
    //                   stopOpacity="1"
    //                 />
    //                 <Stop
    //                   offset={`${gradientKeylength * 2}%`}
    //                   stopColor={keyColor3}
    //                   stopOpacity="1"
    //                 />
    //                 <Stop
    //                   offset={`${gradientKeylength * 3}%`}
    //                   stopColor={keyColor4}
    //                   stopOpacity="1"
    //                 />
    //                 <Stop
    //                   offset={`${gradientKeylength * 4}%`}
    //                   stopColor={keyColor5}
    //                   stopOpacity="1"
    //                 />
    //                 <Stop
    //                   offset={`${gradientKeylength * 5}%`}
    //                   stopColor={keyColor6}
    //                   stopOpacity="1"
    //                 />
    //                 <Stop
    //                   offset={`${gradientKeylength * 6}%`}
    //                   stopColor={keyColor7}
    //                   stopOpacity="1"
    //                 />
    //                 <Stop offset="100%" stopColor={keyColor8} stopOpacity="1" />
    //               </LinearGradient>
    //             </Defs>
    //             {/* <Ellipse cx="150" cy="100" rx="150" ry="80" fill="url(#grad)" /> */}
    //             <Rect
    //               x="0"
    //               y="25"
    //               height="150"
    //               width="100%"
    //               fill="url(#grad)"
    //             />
    //           </Svg>
    //         </Box>
    //         <Box mt={2} w="100%" h={110} bg="pixelColors.highlightGray" p={2}>
    //           <BaseHStack w="100%" h="100%">
    //             <Box flex={1}>
    //               <Pressable
    //                 onPress={() => {
    //                   setSelectedGradientKey(1);
    //                   setKeyColor1(selectedColor);
    //                 }}
    //               >
    //                 <Box
    //                   bg={keyColor1}
    //                   borderColor="white"
    //                   borderWidth={selectedGradientKey === 1 ? 2 : 1}
    //                   h="100%"
    //                 />
    //               </Pressable>
    //             </Box>
    //             <Box flex={1}>
    //               <Pressable
    //                 onPress={() => {
    //                   setSelectedGradientKey(2);
    //                   setKeyColor2(selectedColor);
    //                 }}
    //               >
    //                 <Box
    //                   bg={keyColor2}
    //                   h="100%"
    //                   borderColor="white"
    //                   borderWidth={selectedGradientKey === 2 ? 2 : 1}
    //                 />
    //               </Pressable>
    //             </Box>
    //             <Box flex={1}>
    //               <Pressable
    //                 onPress={() => {
    //                   setSelectedGradientKey(3);
    //                   setKeyColor3(selectedColor);
    //                 }}
    //               >
    //                 <Box
    //                   bg={keyColor3}
    //                   borderColor="white"
    //                   borderWidth={selectedGradientKey === 3 ? 2 : 1}
    //                   h="100%"
    //                 />
    //               </Pressable>
    //             </Box>
    //             <Box flex={1}>
    //               <Pressable
    //                 onPress={() => {
    //                   setSelectedGradientKey(4);
    //                   setKeyColor4(selectedColor);
    //                 }}
    //               >
    //                 <Box
    //                   bg={keyColor4}
    //                   borderColor="white"
    //                   borderWidth={selectedGradientKey === 4 ? 2 : 1}
    //                   h="100%"
    //                 />
    //               </Pressable>
    //             </Box>
    //             <Box flex={1}>
    //               <Pressable
    //                 onPress={() => {
    //                   setSelectedGradientKey(5);
    //                   setKeyColor5(selectedColor);
    //                 }}
    //               >
    //                 <Box
    //                   bg={keyColor5}
    //                   borderColor="white"
    //                   borderWidth={selectedGradientKey === 5 ? 2 : 1}
    //                   h="100%"
    //                 />
    //               </Pressable>
    //             </Box>
    //             <Box flex={1}>
    //               <Pressable
    //                 onPress={() => {
    //                   setSelectedGradientKey(6);
    //                   setKeyColor6(selectedColor);
    //                 }}
    //               >
    //                 <Box
    //                   bg={keyColor6}
    //                   borderColor="white"
    //                   borderWidth={selectedGradientKey === 6 ? 2 : 1}
    //                   h="100%"
    //                 />
    //               </Pressable>
    //             </Box>
    //             <Box flex={1}>
    //               <Pressable
    //                 onPress={() => {
    //                   setSelectedGradientKey(7);
    //                   setKeyColor7(selectedColor);
    //                 }}
    //               >
    //                 <Box
    //                   bg={keyColor7}
    //                   borderColor="white"
    //                   borderWidth={selectedGradientKey === 7 ? 2 : 1}
    //                   h="100%"
    //                 />
    //               </Pressable>
    //             </Box>
    //             <Box flex={1}>
    //               <Pressable
    //                 onPress={() => {
    //                   setSelectedGradientKey(8);
    //                   setKeyColor8(selectedColor);
    //                 }}
    //               >
    //                 <Box
    //                   bg={keyColor8}
    //                   borderColor="white"
    //                   borderWidth={selectedGradientKey === 8 ? 2 : 1}
    //                   h="100%"
    //                 />
    //               </Pressable>
    //             </Box>
    //             {/* <Pressable>
    //                 <Box
    //                   borderColor="white"
    //                   borderWidth={selectedGradientKey === 8 ? 2 : 1}
    //                   h="100%"
    //                 >
    //                   <Svg height="200" width="100%">
    //                     <Defs>
    //                       <RadialGradient id="grad" x1="0" y1="0" x2="1" y2="0">

    //                       </RadialGradient>
    //                     </Defs>
    //                     <Rect
    //                       x="0"
    //                       y="25"
    //                       height="150"
    //                       width="100%"
    //                       fill="url(#grad)"
    //                     />
    //                   </Svg>
    //                 </Box>
    //               </Pressable> */}
    //           </BaseHStack>
    //         </Box>
    //         <Box mt={2} p={2} width="100%" alignItems="center">
    //           <ColorWheel
    //             initialColor={selectedColor}
    //             onSelectColor={setSelectedColor}
    //             colorType="bright"
    //             wheelParams={{
    //               x: 40,
    //               y: 40,
    //               radius: 40,
    //               innerRadius: 15,
    //               sliceCount: 16,
    //               layerCount: 3,
    //               segmentCount: 16,
    //               brightness: 1, // works
    //               dimBrightness: 0.35,
    //             }}
    //           />
    //         </Box>
    //         <BaseHStack mt={2}>
    //           <ColorButton
    //             color="black"
    //             onPress={() => {
    //               setSelectedColor("black");
    //               onClose?.();
    //             }}
    //           />
    //           <ColorButton
    //             ml={20}
    //             color="white"
    //             onPress={() => {
    //               setSelectedColor("white");
    //               onClose?.();
    //             }}
    //           />
    //           <ColorButton
    //             ml={2}
    //             color="red.500"
    //             onPress={() => {
    //               setSelectedColor("red.500");
    //               onClose?.();
    //             }}
    //           />
    //           <ColorButton
    //             ml={2}
    //             color="green.500"
    //             onPress={() => {
    //               setSelectedColor("green.500");
    //               onClose?.();
    //             }}
    //           />
    //           <ColorButton
    //             ml={2}
    //             color="blue.500"
    //             onPress={() => {
    //               setSelectedColor("blue.500");
    //               onClose?.();
    //             }}
    //           />
    //         </BaseHStack>
    //       </BaseVStack>
    //     </ScrollView>
    //   </Actionsheet.Content>
    // </Actionsheet>
  );
}
