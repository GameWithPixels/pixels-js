import React from "react";
import { ViewProps } from "react-native";
import Animated, {
  SlideInRight,
  useReducedMotion,
} from "react-native-reanimated";

type ReactChildArray = ReturnType<typeof React.Children.toArray>;

// https://github.com/gregberge/react-flatten-children/blob/master/src/index.tsx
function flattenChildren(children: React.ReactNode): ReactChildArray {
  const childrenArray = React.Children.toArray(children);
  return childrenArray.reduce((flatChildren: ReactChildArray, child) => {
    if ((child as React.ReactElement<any>).type === React.Fragment) {
      return flatChildren.concat(
        flattenChildren((child as React.ReactElement<any>).props.children)
      );
    }
    flatChildren.push(child);
    return flatChildren;
  }, []);
}

export function SlideInView({
  children,
  delay,
  ...props
}: { delay?: number } & ViewProps) {
  const reducedMotion = useReducedMotion();
  return (
    <>
      {React.Children.map(flattenChildren(children), (child, i) => (
        <Animated.View
          key={i}
          entering={
            reducedMotion
              ? undefined
              : SlideInRight.delay((delay ?? 0) + 30 * i)
          }
          {...props}
        >
          {child}
        </Animated.View>
      ))}
    </>
  );
}
