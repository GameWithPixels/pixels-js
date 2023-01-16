import { Toggle } from "@systemic-games/react-native-base-components";
import {
  Actionsheet,
  Button,
  ScrollView,
  useDisclose,
  Text,
  HStack,
  VStack,
  Box,
  Modal,
  Center,
  FlatList,
} from "native-base";
import React, { useRef } from "react";
// eslint-disable-next-line import/namespace
import { FlatList as ReactFlatList } from "react-native";

export interface FaceIndexProps {
  faces?: number;
  showTitle?: boolean;
  disabled?: boolean;
}

export function FaceIndex(props: FaceIndexProps) {
  const [faceIndex, setFaceIndex] = React.useState(props.faces);
  const facesArray = Array(props.faces).fill(0);
  const { isOpen, onOpen, onClose } = useDisclose();
  return (
    <>
      <VStack>
        {props.showTitle ?? <Text>Than</Text>}
        <Button
          onPress={onOpen}
          disabled={props.disabled}
          bg={props.disabled ? "gray.900" : undefined}
        >
          <Text color={props.disabled ? "gray.800" : undefined}>
            {faceIndex}
          </Text>
        </Button>
      </VStack>
      <Actionsheet isOpen={isOpen} onClose={onClose}>
        <Actionsheet.Content maxHeight={200} minHeight={200}>
          <ScrollView h="100%" w="100%">
            {facesArray.map((_e, i) => (
              <Actionsheet.Item
                onPress={() => {
                  setFaceIndex(i + 1);
                  onClose();
                }}
                alignItems="center"
                key={i}
              >
                <Text fontSize="2xl">{i + 1}</Text>
              </Actionsheet.Item>
            ))}
          </ScrollView>
        </Actionsheet.Content>
      </Actionsheet>
    </>
  );
}

export function FaceIndex2(props: FaceIndexProps) {
  const [faceIndex, _setFaceIndex] = React.useState(props.faces);
  const facesArray = Array(props.faces).fill(0);
  const { isOpen, onOpen, onClose } = useDisclose();

  const flatListRef = useRef<ReactFlatList>(null);
  function _scrollToIndex(index: any) {
    flatListRef?.current?.scrollToIndex({ index });
  }

  return (
    <>
      <VStack>
        {props.showTitle ?? <Text>Than</Text>}
        <Button
          onPress={onOpen}
          disabled={props.disabled}
          bg={props.disabled ? "gray.900" : undefined}
        >
          <Text color={props.disabled ? "gray.800" : undefined}>
            {faceIndex}
          </Text>
        </Button>
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose} w="100%">
        <Modal.Content h="30%" maxH="30%" width="90%">
          <HStack w="100%" alignItems="center">
            {/* <Box flex={1}>
                <ChevronLeftIcon />
              </Box> */}
            <Center flex={1} width="100%">
              {/* <ScrollView>
                  {facesArray.map((_e, i) => (
                    <Actionsheet.Item
                      onPress={() => {
                        setFaceIndex(i + 1);
                        onClose();
                      }}
                      alignItems="center"
                      key={i}
                    >
                      <Text fontSize="2xl">{i + 1}</Text>
                    </Actionsheet.Item>
                  ))}
                </ScrollView> */}
              <FlatList
                ref={flatListRef}
                snapToAlignment="start"
                decelerationRate="fast"
                snapToInterval={70}
                width="100%"
                data={facesArray}
                renderItem={({ index }) => (
                  <Center>
                    <Actionsheet.Item
                      h={70}
                      alignSelf="center"
                      alignItems="center"
                    >
                      <Text fontSize="2xl">{index + 1}</Text>
                    </Actionsheet.Item>
                  </Center>
                )}
                initialScrollIndex={0}
              />
            </Center>
            {/* <Box flex={1}>
                <ChevronRightIcon />
              </Box> */}
          </HStack>
        </Modal.Content>
      </Modal>
    </>
  );
}

export interface PlayBackFaceProps {
  title?: string;
}

export function PlayBackFace(props: PlayBackFaceProps) {
  const [disableFaceIndex, setDisableFaceIndex] = React.useState(false);
  return (
    <VStack w="100%">
      <Text bold>{props.title}</Text>
      <HStack alignItems="center">
        <Box flex={1}>
          <Toggle title="Current face" onToggle={setDisableFaceIndex} />
        </Box>
        <Box flex={1}>
          <FaceIndex faces={20} showTitle={false} disabled={disableFaceIndex} />
        </Box>
      </HStack>
    </VStack>
  );
}
