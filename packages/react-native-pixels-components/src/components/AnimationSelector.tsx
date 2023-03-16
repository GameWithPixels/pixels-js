import { EditAnimation } from "@systemic-games/pixels-edit-animation";
import {
  FastBoxProps,
  FastVStack,
  useDisclose,
} from "@systemic-games/react-native-base-components";
import {
  Actionsheet,
  Box,
  IActionsheetProps,
  Pressable,
  ScrollView,
  Text,
} from "native-base";
import React from "react";

import { PatternCard } from "./PatternCard";

/**
 * Props for AnimationsSelector component.
 */
export interface AnimationSelectorProps extends FastBoxProps {
  title: string;
  animations: Readonly<EditAnimation>[];
  trigger?: React.ReactNode;
  drawerTitle?: string;
  dieRenderer?: (anim: Readonly<EditAnimation>) => React.ReactNode;
  onAnimationChange?: (editAnimation: Readonly<EditAnimation>) => void;
  initialAnimation?: Readonly<EditAnimation>;
}

/**
 * Actionsheet drawer of profiles to be opened to display a vertical scroll view of pressable and selectable profile cards.
 * @param props See {@link AnimationSelectorProps} for props parameters.
 */
export function AnimationSelector({
  title,
  animations,
  trigger,
  drawerTitle,
  dieRenderer,
  onAnimationChange: onSelectAnimation,
  initialAnimation,
  ...flexProps
}: AnimationSelectorProps) {
  const [selectedAnim, setSelectedAnim] = React.useState(initialAnimation);
  const { isOpen, onOpen, onClose } = useDisclose();
  return (
    <>
      <FastVStack {...flexProps}>
        <Text>{title}</Text>
        {/* Trigger of the actionsheet drawer */}
        <Pressable onPress={onOpen}>
          {!trigger ? (
            <Box
              w="100%"
              p={2}
              bg="primary.700"
              rounded="lg"
              alignItems="center"
            >
              <Text>{selectedAnim?.name ?? "No pattern selected"}</Text>
            </Box>
          ) : (
            trigger
          )}
        </Pressable>
      </FastVStack>

      {/* Actionsheet drawer */}
      <AnimationsActionsheet
        isOpen={isOpen}
        onClose={onClose}
        animations={animations}
        drawerTitle={drawerTitle}
        dieRenderer={dieRenderer}
        onSelect={(animation) => {
          setSelectedAnim(animation);
          onSelectAnimation?.(animation);
          onClose();
        }}
      />
    </>
  );
}

interface AnimationsActionsheetProps extends IActionsheetProps {
  animations: Readonly<EditAnimation>[];
  drawerTitle?: string;
  dieRenderer?: (anim: Readonly<EditAnimation>) => React.ReactNode;
  onSelect?: (animation: Readonly<EditAnimation>) => void;
}

function AnimationsActionsheet({
  animations,
  drawerTitle,
  dieRenderer,
  onSelect,
  ...props
}: AnimationsActionsheetProps) {
  return (
    <Actionsheet alignContent="center" {...props}>
      <Actionsheet.Content maxH="100%" h={600}>
        <Text bold pb={5}>
          {drawerTitle ? drawerTitle : "Available Patterns"}
        </Text>
        <ScrollView
          contentContainerStyle={{
            flexWrap: "wrap",
            flexDirection: "row",
            justifyContent: "space-evenly",
          }}
        >
          {animations?.map((animation, i) => (
            <PatternCard
              key={animation.uuid}
              my={1}
              w="105px"
              h="130px"
              space={1}
              imageSize={70}
              fontSize="sm"
              selectable
              patternIndexInList={i}
              onSelected={() => onSelect?.(animation)}
              patternName={animation.name}
              dieRenderer={dieRenderer && (() => dieRenderer(animation))}
            />
          ))}
        </ScrollView>
      </Actionsheet.Content>
    </Actionsheet>
  );
}
