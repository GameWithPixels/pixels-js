import { DfuState } from "@systemic-games/react-native-nordic-nrf5-dfu";
import {
  Box,
  Button,
  IBoxProps,
  Modal,
  Pressable,
  Text,
  VStack,
} from "native-base";
import { useEffect, useState } from "react";
import Swipeable from "react-native-gesture-handler/Swipeable";

import PixelDetails from "./PixelDetails";
import PixelInfoCard, { PixelInfoCardProps } from "./PixelInfoCard";
import ProgressBar from "./ProgressBar";

import PixelDispatcher from "~/features/pixels/PixelDispatcher";
import usePixelStatus from "~/features/pixels/hooks/usePixelStatus";
import { sr } from "~/styles";

function SwipeableItemView({
  label,
  _text,
  ...props
}: IBoxProps & { label: string }) {
  return (
    <Box justifyContent="center" alignItems="center" {...props}>
      <Text {..._text}>{label}</Text>
    </Box>
  );
}

export interface SwipeablePixelCardProps
  extends Omit<PixelInfoCardProps, "pixel"> {
  pixelDispatcher: PixelDispatcher;
  swipeableItemsWidth: number;
}

export default function ({
  children,
  pixelDispatcher,
  swipeableItemsWidth,
  ...props
}: SwipeablePixelCardProps) {
  const status = usePixelStatus(pixelDispatcher.pixel);
  const [showDetails, setShowDetails] = useState(false);
  const isDisco = !status || status === "disconnected";
  const [lastError, setLastError] = useState<Error>();
  const [updateProgress, setUpdateProgress] = useState<number>();
  const [dfuState, setDfuState] = useState<DfuState>();
  useEffect(() => {
    if (!showDetails) {
      const logAction = (action: string) => {
        console.log(`Dispatching ${action} on Pixel ${pixelDispatcher.name}`);
      };
      pixelDispatcher.addEventListener("action", logAction);
      pixelDispatcher.addEventListener("error", setLastError);
      pixelDispatcher.addEventListener(
        "profileUpdateProgress",
        setUpdateProgress
      );
      pixelDispatcher.addEventListener("firmwareUpdateState", setDfuState);
      pixelDispatcher.addEventListener(
        "firmwareUpdateProgress",
        setUpdateProgress
      );
      return () => {
        pixelDispatcher.removeEventListener("action", logAction);
        pixelDispatcher.removeEventListener("error", setLastError);
        pixelDispatcher.removeEventListener(
          "profileUpdateProgress",
          setUpdateProgress
        );
        pixelDispatcher.removeEventListener("firmwareUpdateState", setDfuState);
        pixelDispatcher.removeEventListener(
          "firmwareUpdateProgress",
          setUpdateProgress
        );
      };
    }
  }, [pixelDispatcher, showDetails]);

  return (
    <Swipeable
      onSwipeableOpen={(direction, swipeable) => {
        if (direction === "left") {
          if (isDisco) {
            pixelDispatcher.dispatch("connect");
          } else {
            pixelDispatcher.dispatch("disconnect");
          }
        } else {
          if (isDisco) {
            pixelDispatcher.dispatch("updateFirmware");
          } else {
            pixelDispatcher.dispatch("blink");
          }
        }
        swipeable.close();
      }}
      leftThreshold={swipeableItemsWidth}
      renderLeftActions={() => (
        <SwipeableItemView
          label={isDisco ? "Connect" : "Disconnect"}
          backgroundColor={isDisco ? "green.500" : "red.500"}
          _text={{ mx: sr(20), color: "gray.100", bold: true }}
        />
      )}
      rightThreshold={swipeableItemsWidth}
      renderRightActions={() =>
        (!isDisco || pixelDispatcher.canUpdateFirmware) && (
          <SwipeableItemView
            width={swipeableItemsWidth}
            label={isDisco ? "Update\nFirmware" : "Blink"}
            backgroundColor={isDisco ? "purple.500" : "orange.500"}
            _text={{ mx: sr(20), color: "gray.100", bold: true }}
          />
        )
      }
    >
      <Pressable onPress={() => setShowDetails(status === "ready")}>
        <PixelInfoCard pixel={pixelDispatcher} {...props}>
          {pixelDispatcher.canUpdateFirmware && (
            <Text position="absolute" top={sr(8)} right={sr(8)}>
              ⬆️
            </Text>
          )}
          <VStack mb={sr(5)} space={sr(5)} alignItems="center" width="100%">
            <Text>
              <Text>Status: </Text>
              <Text italic>{status}</Text>
            </Text>
            {dfuState && (
              <Text variant="comment">{`DFU State: ${dfuState}`}</Text>
            )}
            {updateProgress !== undefined && (
              <ProgressBar percent={updateProgress} />
            )}
            {children}
            {lastError && (
              <>
                <Text color="red.500">{lastError?.message}</Text>
                <Button onPress={() => setLastError(undefined)}>
                  Clear Error
                </Button>
              </>
            )}
          </VStack>
        </PixelInfoCard>
      </Pressable>
      <Modal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        size="lg"
      >
        <Modal.Content>
          <Modal.CloseButton />
          <Modal.Header>Die Details</Modal.Header>
          <Modal.Body>
            <PixelDetails pixelDispatcher={pixelDispatcher} />
          </Modal.Body>
        </Modal.Content>
      </Modal>
    </Swipeable>
  );
}
