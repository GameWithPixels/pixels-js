import { HStack, Center, Pressable } from "native-base";
import { ColorType } from "native-base/lib/typescript/components/types";
import React from "react";

/**
 * Props for renderAction pressables in a swipeable component.
 */
interface SwipeableSideButtonProps {
  onPress?: () => void;
  title?: string;
  icon?: React.ReactNode;
  bg?: ColorType;
}

/**
 * Props for {@link createSwipeableSideButton} function
 */
export interface CreateSwipeableSideButtonProps {
  w?: number;
  buttons: SwipeableSideButtonProps[]; // Array of buttons props to create every needed pressable.
}

/**
 * Create an array of pressable element to be used inside a swipeable component as a renderAction.
 * @param props See {@link createSwipeableSideButton} for props parameters.
 * @returns A function returning a JSX element.
 */
export function createSwipeableSideButton(
  props: CreateSwipeableSideButtonProps
) {
  return () => {
    return (
      <HStack>
        {props.buttons?.map((button, index) => (
          <Pressable onPress={button.onPress} key={index}>
            <HStack
              h="100%"
              w={props.w ? props.w / props.buttons?.length : 195}
              bg={button.bg}
              roundedRight={
                props.buttons.length <= 1
                  ? "lg"
                  : index === props.buttons.length - 1
                  ? "lg"
                  : "none"
              }
              roundedLeft={
                props.buttons.length <= 1 ? "lg" : index === 0 ? "lg" : "none"
              }
              alignItems="center"
            >
              <HStack p={3} h="100%" w="100%" alignItems="center">
                <Center flex={1}>{button.icon}</Center>
              </HStack>
            </HStack>
          </Pressable>
        ))}
      </HStack>
    );
  };
}
