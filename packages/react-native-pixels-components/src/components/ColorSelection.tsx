import {
  Text,
  HStack,
  Center,
  VStack,
  Modal,
  Button,
  AddIcon,
  usePropsResolution,
  IModalProps,
} from "native-base";
import {
  ColorType,
  SizeType,
} from "native-base/lib/typescript/components/types";
import React from "react";
import Svg, { Polygon } from "react-native-svg";

function ColorWheel() {
  return (
    <VStack>
      <Svg height="100" width="100">
        <Polygon
          points="0,5 20,40 50,0 30,100 "
          fill="lime"
          stroke="purple"
          strokeWidth="3"
          onPress={() => console.log("pressed polygon")}
        />
      </Svg>
    </VStack>
  );
}

interface ColorSelectionProps extends IModalProps {
  modalBg?: ColorType;
  triggerBg?: ColorType;
  triggerH?: SizeType;
  triggerW?: SizeType;
}

export function ColorSelection(props: ColorSelectionProps) {
  const resolvedProps = usePropsResolution("ColorSelection", props);
  const [showModal, setShowModal] = React.useState(false);
  const [chosenColor, setChosenColor] = React.useState("red.500");
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
            bg={chosenColor}
            w={resolvedProps.triggerW}
            h={resolvedProps.triggerH}
          >
            <HStack space={2} alignItems="center">
              <AddIcon size="md" color="black" />
            </HStack>
          </Button>
        </HStack>
        {/* CheckBox ovveride face component would be here */}
      </VStack>

      {/*Color wheel or selector modal*/}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <Modal.Content
          minH={resolvedProps.modalMinH}
          minW={resolvedProps.modalMinW}
          h={resolvedProps.h}
          w={resolvedProps.w}
          bg={resolvedProps.bg}
        >
          <Center>
            <Modal.Header
              bg={resolvedProps.bg}
              fontSize={resolvedProps.headerFontSize}
            >
              Select Color
            </Modal.Header>
          </Center>
          <Modal.Body bg={resolvedProps.bg}>
            <Center>
              <VStack space={2}>
                <ColorWheel />
              </VStack>
            </Center>
          </Modal.Body>
          <Center>
            <Modal.Footer bg={resolvedProps.bg}>
              <HStack space={2}>
                <Button
                  h="8"
                  w="8"
                  onPress={() => {
                    setChosenColor("black");
                    setShowModal(false);
                  }}
                  bg="black"
                />
                <Button
                  borderColor="black"
                  h="8"
                  w="8"
                  onPress={() => {
                    setChosenColor("white");
                    setShowModal(false);
                  }}
                  bg="white"
                />
                <Button
                  borderColor="black"
                  h="8"
                  w="8"
                  onPress={() => {
                    setChosenColor("red.500");
                    setShowModal(false);
                  }}
                  bg="red.500"
                />
                <Button
                  borderColor="black"
                  h="8"
                  w="8"
                  onPress={() => {
                    setChosenColor("green.500");
                    setShowModal(false);
                  }}
                  bg="green.500"
                />
                <Button
                  borderColor="black"
                  h="8"
                  w="8"
                  onPress={() => {
                    setChosenColor("blue.500");
                    setShowModal(false);
                  }}
                  bg="blue.500"
                />
              </HStack>
            </Modal.Footer>
          </Center>
        </Modal.Content>
      </Modal>
    </>
  );
}
