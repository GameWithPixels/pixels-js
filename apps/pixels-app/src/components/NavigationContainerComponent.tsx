import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import NavigationMenuBar from "../../../../packages/react-native-base-components/src/components/BottomMenuBar";
import { RootStackParamList } from "../Navigation";

function NavigateTo(path: string, navigation: any) {
  navigation.navigate(path);
}

export function NavigationContainerComponent() {
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList, "HomeScreen">>();
  return (
    <NavigationMenuBar
      itemsData={[
        {
          label: "Settings",
          NavigateToFunction: () => {
            NavigateTo("SecondScreen", navigation);
          },
          ImageRequirePath: require("../../assets/UI_Icons/home-line-25.png"),
          size: "8",
        },
        {
          label: "Profiles",
          NavigateToFunction: () => {
            NavigateTo("SecondScreen", navigation);
          },
          ImageRequirePath: require("../../assets/UI_Icons/id-card.png"),
          size: "10",
        },
        {
          label: "Patterns",
          NavigateToFunction: () => {
            NavigateTo("HomeScreen", navigation);
          },
          ImageRequirePath: require("../../assets/UI_Icons/pixels-line.png"),
          size: "10",
        },
        {
          label: "Presets",
          NavigateToFunction: () => {
            NavigateTo("SecondScreen", navigation);
          },
          ImageRequirePath: require("../../assets/UI_Icons/diagram.png"),
          size: "10",
        },
        {
          label: "Dice Bag",
          NavigateToFunction: () => {
            NavigateTo("SecondScreen", navigation);
          },
          ImageRequirePath: require("../../assets/UI_Icons/D10.png"),
          size: "10",
        },
      ]}
    />
  );
}
