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
import React from "react";

/**
 * Props for {@link FaceMask} component.
 */
interface FaceMaskProps extends IModalProps {
  dieFaces: number; // Number of faces on the die
  onCloseAction?: (() => void) | null | undefined; // Function to be executed when the facemask window is closed
}

/**
 * Display die faces and select which faces will be used with lighting animations.
 * @param props See {@link FaceMaskProps} for props parameters.
 */
export function FaceMask(props: FaceMaskProps) {
  const [showModal, setShowModal] = React.useState(false);
  const [groupValue, setGroupValue] = React.useState<any[]>([]);

  // const buttonsArray = [];
  // for (let i = 0; i < props.dieFaces; ++i) {
  //   buttonsArray.push(i);
  // }

  const buttonsArray = Array(props.dieFaces).fill(0);
  // Array(props.dieFaces).fill(0).map((e,i))

  const resolvedProps = usePropsResolution("FaceMask", props);

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
                  {groupValue.sort((n1, n2) => n1 - n2).join(" / ")}
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
          if (props.onCloseAction) props.onCloseAction();
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
                defaultValue={groupValue}
                onChange={(values) => {
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
                    setShowModal(false);
                    const faces = [];
                    for (let i = 1; i <= props.dieFaces; ++i) {
                      faces.push(i.toString());
                    }
                    setGroupValue(faces);
                  }}
                >
                  All
                </Button>
                <Button
                  h={10}
                  w={60}
                  onPress={() => {
                    setShowModal(false);
                    setGroupValue([]);
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
