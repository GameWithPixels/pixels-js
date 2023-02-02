import { getFaceMask } from "@systemic-games/pixels-edit-animation";
import {
  Text,
  HStack,
  Center,
  VStack,
  Box,
  Pressable,
  Modal,
  Button,
  Checkbox,
  usePropsResolution,
  IModalProps,
} from "native-base";
import React, { useEffect } from "react";

import { bitsToIndices, combineBits } from "../bitMasksUtils";

/**
 * Props for {@link FaceMask} component.
 */
interface FaceMaskProps extends IModalProps {
  dieFaces: number; // Number of faces on the die
  maskNumber: number;
  onCloseAction?: ((value: any) => void) | null | undefined; // Function to be executed when the facemask window is closed
}

function bitsToFaceIndex(maskNumber: number) {
  return bitsToIndices(maskNumber).map((n) => (n + 1).toString());
}

/**
 * Display die faces and select which faces will be used with lighting animations.
 * @param props See {@link FaceMaskProps} for props parameters.
 */
export function FaceMask(props: FaceMaskProps) {
  const buttonsArray = Array(props.dieFaces).fill(0);

  const resolvedProps = usePropsResolution("FaceMask", props);
  const [showModal, setShowModal] = React.useState(false);
  const [groupValue, setGroupValue] = React.useState<string[]>(
    bitsToFaceIndex(props.maskNumber)
  );

  useEffect(() => {
    setGroupValue(bitsToFaceIndex(props.maskNumber));
  }, [props.maskNumber]);

  return (
    <>
      <VStack>
        <Text bold> Face mask</Text>
        <Pressable
          onPress={() => {
            setShowModal(true);
          }}
        >
          <Box
            p="1"
            minH={resolvedProps.boxMinH}
            w={resolvedProps.boxW}
            rounded={resolvedProps.boxRounded}
            bg={resolvedProps.boxBg}
            alignContent="center"
          >
            <HStack alignSelf="center" space={1} flexWrap="wrap">
              {groupValue.length === 0 ? (
                <Text>No faces selected</Text>
              ) : (
                <Text fontSize="md">
                  {groupValue
                    .sort((n1, n2) => Number(n1) - Number(n2))
                    .join(" / ")}
                </Text>
              )}
            </HStack>
          </Box>
        </Pressable>
      </VStack>
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          // Combine the selected face into one maskValue
          const maskValue = combineBits(
            groupValue.map((f) => getFaceMask(Number(f)))
          );
          if (props.onCloseAction) props.onCloseAction(maskValue);
        }}
      >
        <Modal.Content bg={resolvedProps.bg}>
          <Center>
            <Modal.Header bg={resolvedProps.bg} fontSize={20}>
              Select faces
            </Modal.Header>
          </Center>
          <Modal.Body bg={resolvedProps.bg}>
            <Center>
              <Checkbox.Group
                defaultValue={groupValue.map((n) => n.toString())}
                onChange={(values: string[]) => {
                  setGroupValue(values || []);
                }}
              >
                <HStack space={2} flexWrap="wrap">
                  {buttonsArray.map((_e, i) => (
                    <Box key={i} p={resolvedProps.checkBoxP}>
                      <Checkbox
                        w={50}
                        size={resolvedProps.checkBoxSize}
                        alignSelf="center"
                        key={i}
                        value={(i + 1).toString()}
                      >
                        {i + 1}
                      </Checkbox>
                    </Box>
                  ))}
                </HStack>
              </Checkbox.Group>
            </Center>
          </Modal.Body>
          <Center>
            <Modal.Footer bg={resolvedProps.bg}>
              <Button.Group space={2}>
                <Button
                  h={10}
                  w={60}
                  onPress={() => {
                    // setShowModal(false);
                    const faces = [];
                    for (let i = 1; i <= props.dieFaces; ++i) {
                      faces.push(i.toString());
                    }
                    setGroupValue(faces);

                    setShowModal(false);
                    // Combine the selected face into one maskValue
                    const maskValue = combineBits(
                      faces.map((f) => getFaceMask(Number(f)))
                    );
                    if (props.onCloseAction) props.onCloseAction(maskValue);
                  }}
                >
                  All
                </Button>
                <Button
                  h={10}
                  w={60}
                  onPress={() => {
                    // setShowModal(false);
                    setGroupValue([]);

                    const groupValues: string[] = [];
                    setShowModal(false);
                    // Combine the selected face into one maskValue
                    const maskValue = combineBits(
                      groupValues.map((f) => getFaceMask(Number(f)))
                    );
                    if (props.onCloseAction) props.onCloseAction(maskValue);
                  }}
                >
                  None
                </Button>
              </Button.Group>
            </Modal.Footer>
          </Center>
        </Modal.Content>
      </Modal>
    </>
  );
}
