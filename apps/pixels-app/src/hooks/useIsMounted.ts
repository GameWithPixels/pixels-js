import React from "react";

export function useIsMounted() {
  const isMountedRef = React.useRef(false);
  React.useEffect(() => {
    isMountedRef.current = true;
  }, []);
  return isMountedRef.current;
}
