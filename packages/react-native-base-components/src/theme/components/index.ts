import BaseActionSheet from "./BaseActionSheet";
import BaseBottomMenuBar from "./BaseBottomMenuBar";
import BaseCard from "./BaseCard";
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
  BaseBottomMenuBar,
  BaseToggle,
  BaseSlider,
  Button,
};
