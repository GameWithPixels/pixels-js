import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import BottomNavigationMenu from "../../../../packages/react-native-base-components/src/components/BottomNavigationMenu";
import { RootStackParamList } from "../Navigation";

function NavigateTo(path: string, navigation: any) {
  navigation.navigate(path);
}

export function NavigationContainerComponent() {
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList, "HomeScreen">>();
  return (
    <BottomNavigationMenu
      itemsData={[
        {
          label: "Settings",
          NavigateToFunction: () => {
            NavigateTo("SecondScreen", navigation);
          },
          ImageRequirePath: require("../../assets/UI_Icons/home-line-25.png"),
          tintColor: "pixelColors.blue",
          size: "8",
        },
        {
          label: "Profiles",
          NavigateToFunction: () => {
            NavigateTo("ThirdScreen", navigation);
          },
          ImageRequirePath: require("../../assets/UI_Icons/id-card.png"),
          tintColor: "pixelColors.purple",
          size: "10",
        },
        {
          label: "Patterns",
          NavigateToFunction: () => {
            NavigateTo("HomeScreen", navigation);
          },
          ImageRequirePath: require("../../assets/UI_Icons/pixels-line.png"),
          tintColor: "pixelColors.green",
          size: "10",
        },
        {
          label: "Presets",
          NavigateToFunction: () => {
            NavigateTo("SecondScreen", navigation);
          },
          ImageRequirePath: require("../../assets/UI_Icons/diagram.png"),
          tintColor: "pixelColors.yellow",
          size: "10",
        },
        {
          label: "Dice Bag",
          NavigateToFunction: () => {
            NavigateTo("SecondScreen", navigation);
          },
          ImageRequirePath: require("../../assets/UI_Icons/D10.png"),
          tintColor: "pixelColors.red",
          size: "10",
        },
      ]}
    />
  );
}
