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
} from "native-base";
import React from "react";

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
