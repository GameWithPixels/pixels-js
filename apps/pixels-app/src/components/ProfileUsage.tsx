import { Profiles } from "@systemic-games/react-native-pixels-connect";
import { View, ViewProps } from "react-native";
import { Text } from "react-native-paper";

import { createProfileEditDataSetWithOverrides } from "~/features/profiles";

export function ProfileUsage({
  profile,
  style,
  ...props
}: {
  profile: Readonly<Profiles.Profile>;
} & ViewProps) {
  const editDataSet = createProfileEditDataSetWithOverrides(profile);
  const dataSet = editDataSet.toDataSet();
  const patterns = new Set(
    editDataSet.patterns.concat(editDataSet.rgbPatterns)
  );
  return (
    <View style={[{ gap: 5 }, style]} {...props}>
      <Text>Date created: {profile.creationDate.toLocaleString()}</Text>
      <Text>Last modified: {profile.lastModified.toLocaleString()}</Text>
      <Text>Memory footprint: {dataSet.computeDataSetByteSize()} bytes</Text>
      <Text>Number of unique Color Designs: {patterns.size}</Text>
      <Text>
        Number of unique Colors: {dataSet.animationBits.palette.length}
      </Text>
      {/* <Text>Number Of Sequences: 12</Text>
      <Text>Number Of Animations: 12</Text>
      <Text>Number Of Gradients: 12</Text>
      <Text>Number Of Curves: 12</Text>
      <Text>Number Of Colors: 12</Text>
      <Text>Number Of Scalars: 12</Text> */}
    </View>
  );
}
