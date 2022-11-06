import { Ionicons } from "@expo/vector-icons";
import { ColorWheel } from "@systemic-games/react-native-base-components";
import {
  Text,
  HStack,
  Center,
  VStack,
  Modal,
  Button,
  usePropsResolution,
  IModalProps,
} from "native-base";
import {
  ColorType,
  SizeType,
} from "native-base/lib/typescript/components/types";
import React from "react";
// eslint-disable-next-line import/namespace
import { GestureResponderEvent } from "react-native";

interface SimpleColorButtonProps {
  color: ColorType;
  onPress: ((event: GestureResponderEvent) => void) | null | undefined;
}
/**
 * Simple button for selecting basic color shade
 */
function SimpleColorButton(props: SimpleColorButtonProps) {
  return <Button h={8} w={8} bg={props.color} onPress={props.onPress} />;
}

/**
 * Props for customizing elements and behavior of a ColorSelection component.
 */
interface ColorSelectionProps extends IModalProps {
  modalBg?: ColorType; // modal general background color
  triggerBg?: ColorType; // modal trigger element initial background color
  triggerH?: SizeType; // trigger element height
  triggerW?: SizeType; // trigger element width
  onColorSelected?: (() => void) | null | undefined; // action when a color was selected trough the color selection component
}
/**
 * Color selection component used for selecting a single color shade from a color wheel / color picker.
 * @see ColorSelectionProps for the component props to customize some elements.
 * @return A ColorSelection JSX element.
 */
export function ColorSelection(props: ColorSelectionProps) {
  const resolvedProps = usePropsResolution("ColorSelection", props);
  const [showModal, setShowModal] = React.useState(false);
  const [SelectedColor, setSelectedColor] = React.useState("red.500");
  // const [overridingOnFace, setOverridingOnFace] = React.useState(false);

  return (
    <>
      <VStack space={2}>
        <Text bold textAlign="left">
          Simple color
        </Text>
        <HStack space={2}>
          <Button
            onPress={() => setShowModal(true)}
            // isDisabled={overridingOnFace}
            bg={SelectedColor}
            w={resolvedProps.triggerW}
            h={resolvedProps.triggerH}
          >
            <Ionicons name="color-palette-outline" size={24} color="white" />
          </Button>
        </HStack>
        {/* CheckBox override face component would be here */}
      </VStack>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <Modal.Content
          {...resolvedProps}
          minH={resolvedProps.modalMinH}
          minW={resolvedProps.modalMinW}
        >
          <Center>
            <Modal.Header
              bg={resolvedProps.bg}
              fontSize={resolvedProps.headerFontSize}
            >
              Select Color
            </Modal.Header>
            <Modal.CloseButton />
          </Center>
          <Modal.Body bg={resolvedProps.bg}>
            <VStack space={2}>
              <ColorWheel
                initialColor={SelectedColor}
                onSelectColor={setSelectedColor}
              />
            </VStack>
          </Modal.Body>
          <Center>
            <Modal.Footer bg={resolvedProps.bg}>
              <HStack space={2}>
                <SimpleColorButton
                  color="black"
                  onPress={() => {
                    setSelectedColor("black");
                    setShowModal(false);
                  }}
                />
                <SimpleColorButton
                  color="white"
                  onPress={() => {
                    setSelectedColor("white");
                    setShowModal(false);
                  }}
                />
                <SimpleColorButton
                  color="red.500"
                  onPress={() => {
                    setSelectedColor("red.500");
                    setShowModal(false);
                  }}
                />
                <SimpleColorButton
                  color="green.500"
                  onPress={() => {
                    setSelectedColor("green.500");
                    setShowModal(false);
                  }}
                />
                <SimpleColorButton
                  color="blue.500"
                  onPress={() => {
                    setSelectedColor("blue.500");
                    setShowModal(false);
                  }}
                />
              </HStack>
            </Modal.Footer>
          </Center>
        </Modal.Content>
      </Modal>
    </>
  );
}
