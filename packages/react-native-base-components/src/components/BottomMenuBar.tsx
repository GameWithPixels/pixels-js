// import { useNavigation } from "@react-navigation/native";
// import { NativeStackNavigationProp } from "@react-navigation/native-stack";
// import {
//   Text,
//   HStack,
//   Center,
//   VStack,
//   Box,
//   Pressable,
//   Image,
//   Spacer,
//   usePropsResolution,
// } from "native-base";
// import {
//   ColorType,
//   SizeType,
// } from "native-base/lib/typescript/components/types";
// import React, { PropsWithChildren } from "react";
// import { GestureResponderEvent, ImageSourcePropType } from "react-native";
// import { SafeAreaProvider } from "react-native-safe-area-context";

// //import { RootStackParamList } from "../Navigation";

// export type RootStackParamList = object;

// export type ScreenProps = NativeStackScreenProps<
//   RootStackParamList,
//   "SelectPatterns"
// >;

// // Data of any item/page icon that will be displayed in the component
// export interface BottomMenuBarItemData {
//   label: string;
//   tintColor: ColorType;
//   NavigationPath?: any; // Navigation path for React navigation : screen to navigate to
//   onPress?: ((event: GestureResponderEvent) => void) | null | undefined;
//   ImageRequirePath?: ImageSourcePropType; // Item image path. Need to return a require path ex: require(../assets/[...]image.png)
//   size?: SizeType;
//   alt?: string;
// }

// export interface BottomMenuBarProps {
//   itemsData: BottomMenuBarItemData[];
//   Navigation: useNavigation;
//   selectionHighlightColor?: ColorType;
//   height?: number | string;
//   width?: number | string;
//   maxWidth?: number | string;
//   itemsHeight?: number | string;
//   itemsWidth?: number | string;
//   textSize?: number | string | SizeType;
//   bg?: ColorType;
// }

// // TODO pass list of { label, icon, tintColor, altDescription }
// export default function BottomMenuBar(props: BottomMenuBarProps) {
//   //   const navigation =
//   //     useNavigation<
//   //       NativeStackNavigationProp<RootStackParamList, "SelectPatterns">
//   //     >();

//   // // TODO use boolean type
//   const [selected, setSelected] = React.useState(1);
//   const resolvedProps = usePropsResolution("PxBottomMenuBar", props);
//   // console.log(resolvedProps.rounded);
//   return (
//     // TODO no hard coded values, use props
//     <Box
//       height={resolvedProps.height}
//       width={resolvedProps.width}
//       maxW={resolvedProps.maxWidth}
//       alignSelf="center"
//     >
//       <HStack space={2} bg={props.bg} alignItems="center">
//         {props.itemsData.map((item, i) => (
//           <Pressable
//             py="2"
//             flex={1}
//             key={i}
//             onPress={() => {
//               if (item.NavigationPath != undefined)
//                 props.Navigation.navigate(item.NavigationPath);
//               //navigation.navigate(item.NavigationPath);
//               item.onPress;
//               setSelected(i);
//             }}
//           >
//             <Center
//               h={resolvedProps.itemsHeight}
//               w={resolvedProps.itemsWidth}
//               bg={
//                 selected == i
//                   ? resolvedProps.selectionHighlightColor
//                   : "PixelColors.softBlack"
//               }
//               rounded={resolvedProps.rounded}
//               p={1}
//             >
//               <SafeAreaProvider>
//                 <VStack>
//                   <Image
//                     width={6}
//                     height={6}
//                     source={item.ImageRequirePath}
//                     size={item.size}
//                     alt={item.alt == undefined ? "Menu item" : item.alt}
//                     alignSelf="center"
//                     tintColor={item.tintColor}
//                     opacity={selected === i ? 1 : 0.5}
//                   />
//                   <Spacer />
//                   <Text textAlign="center" fontSize={resolvedProps.textSize}>
//                     {item.label}
//                   </Text>
//                 </VStack>
//               </SafeAreaProvider>
//             </Center>
//           </Pressable>
//         ))}
//       </HStack>
//     </Box>
//   );
// }
