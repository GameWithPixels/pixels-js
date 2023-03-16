import { EditPattern } from "@systemic-games/pixels-edit-animation";
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
 * Props for PatternSelector component.
 */
export interface PatternSelectorProps extends FastBoxProps {
  title: string;
  patterns: Readonly<EditPattern>[];
  trigger?: React.ReactNode;
  drawerTitle?: string;
  dieRenderer?: (pattern: Readonly<EditPattern>) => React.ReactNode;
  onPatternChange?:
    | ((pattern: Readonly<EditPattern>) => void)
    | null
    | undefined;
  initialPattern?: Readonly<EditPattern>;
}

/**
 * Actionsheet drawer of patterns to be opened to display a vertical scroll view of pressables and selectables pattern cards.
 * @param props See {@link PatternSelectorProps} for props parameters.
 */
export function PatternSelector({
  title,
  patterns,
  trigger,
  drawerTitle,
  dieRenderer,
  onPatternChange: onSelect,
  initialPattern,
  ...flexProps
}: PatternSelectorProps) {
  const [selectedPattern, setSelectedPattern] = React.useState(initialPattern);
  const { isOpen, onOpen, onClose } = useDisclose();
  return (
    <>
      <FastVStack {...flexProps}>
        <Text>{title}</Text>
        {/* Trigger of the actionsheet drawer */}
        <Pressable
          onPress={() => {
            onOpen();
          }}
        >
          {!trigger ? (
            <Box
              w="100%"
              p={2}
              bg="primary.700"
              rounded="lg"
              alignItems="center"
            >
              <Text>{selectedPattern?.name ?? "No LED pattern selected"}</Text>
            </Box>
          ) : (
            trigger
          )}
        </Pressable>
      </FastVStack>

      {/* Actionsheet drawer */}
      <ActionsheetPatterns
        isOpen={isOpen}
        onClose={onClose}
        patterns={patterns}
        drawerTitle={drawerTitle}
        dieRenderer={dieRenderer}
        onSelect={(pattern) => {
          setSelectedPattern(pattern);
          onSelect?.(pattern);
          onClose();
        }}
      />
    </>
  );
}

interface ActionsheetPatternsProps extends IActionsheetProps {
  patterns: Readonly<EditPattern>[];
  drawerTitle?: string;
  dieRenderer?: (pattern: Readonly<EditPattern>) => React.ReactNode;
  onSelect?: (animation: Readonly<EditPattern>) => void;
}

function ActionsheetPatterns({
  patterns,
  drawerTitle,
  dieRenderer,
  onSelect,
  ...props
}: ActionsheetPatternsProps) {
  const [patternToHighlight, setPatternToHighlight] = React.useState<number>();
  return (
    <Actionsheet alignContent="center" {...props}>
      <Actionsheet.Content maxH="100%" h={600}>
        <Text bold paddingBottom={5}>
          {drawerTitle ? drawerTitle : "Available LED Patterns"}
        </Text>
        <ScrollView
          contentContainerStyle={{
            flexWrap: "wrap",
            flexDirection: "row",
            justifyContent: "space-evenly",
          }}
        >
          {patterns?.map((pattern, i) => (
            <PatternCard
              key={i}
              my={2}
              w="105px"
              h="130px"
              space={1}
              imageSize={70}
              fontSize="sm"
              selectable
              patternIndexInList={i}
              selectedPatternIndex={patternToHighlight}
              onSelected={() => {
                setPatternToHighlight(i);
                onSelect?.(pattern);
              }}
              patternName={pattern.name}
              dieRenderer={dieRenderer && (() => dieRenderer(pattern))}
            />
          ))}
        </ScrollView>
      </Actionsheet.Content>
    </Actionsheet>
  );
}
