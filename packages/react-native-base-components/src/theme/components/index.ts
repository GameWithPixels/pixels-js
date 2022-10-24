import BaseActionSheet from "./BaseActionSheet";
import BaseAppPage from "./BaseAppPage";
import BaseCard from "./BaseCard";
import BaseNavigationMenuBar from "./BaseNavigationMenuBar";
import BaseSlider from "./BaseSlider";
import BaseToggle from "./BaseToggle";

// Native Base components style & props default overriding
const Button = {
  baseStyle: {
    minW: 100,
    minH: 10,
  },
  defaultProps: {
    bg: "primary.500",
    rounded: "lg",
  },
};

export default {
  BaseCard,
  BaseActionSheet,
  BaseNavigationMenuBar,
  BaseToggle,
  BaseSlider,
  BaseAppPage,
  Button,
};
