import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text } from "react-native-paper";
import Animated from "react-native-reanimated";

import { withAnimated } from "~/features/withAnimated";

export const AnimatedText = withAnimated(Text);

export const AnimatedMaterialCommunityIcons = Animated.createAnimatedComponent(
  MaterialCommunityIcons
);
