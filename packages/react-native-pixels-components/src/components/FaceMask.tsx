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
} from "native-base";
import { ColorType } from "native-base/lib/typescript/components/types";
import React from "react";

interface FaceMaskProps {
  diceFaces: number;
  onCloseAction?: any;
  bg?: ColorType;
}

export function FaceMask(props: FaceMaskProps) {
  const [showModal, setShowModal] = React.useState(false);
  const [groupValue, setGroupValue] = React.useState<any[]>([]);

  const buttonsArray = [];
  for (let i = 0; i < props.diceFaces; ++i) {
    buttonsArray.push(i);
  }

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
            minH="9"
            w="100%"
            rounded="lg"
            bg={props.bg === undefined ? "primary.900" : props.bg}
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
          if (props.onCloseAction !== undefined) props.onCloseAction();
        }}
      >
        <Modal.Content rounded="2xl">
          <Center>
            <Modal.Header fontSize={20}>Select faces</Modal.Header>
          </Center>
          <Modal.Body>
            <Center>
              <Checkbox.Group
                defaultValue={groupValue}
                onChange={(values) => {
                  setGroupValue(values || []);
                }}
              >
                <HStack space={2} flexWrap="wrap">
                  {buttonsArray.map((i) => (
                    <Box key={i} p="2">
                      <Checkbox
                        size="lg"
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
            <Modal.Footer>
              <Button.Group space={2}>
                <Button
                  onPress={() => {
                    setShowModal(false);
                    const faces = [];
                    for (let i = 1; i <= props.diceFaces; ++i) {
                      faces.push(i.toString());
                    }
                    setGroupValue(faces);
                  }}
                >
                  All
                </Button>
                <Button
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
