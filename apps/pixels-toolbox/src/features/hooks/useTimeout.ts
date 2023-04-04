import React from "react";

export default function (ms: number): [boolean, () => void] {
  const [hasElapsed, setHasElapsed] = React.useState(false);
  React.useEffect(() => {
    if (!hasElapsed) {
      const timeoutId = setTimeout(() => setHasElapsed(true), ms);
      return () => clearTimeout(timeoutId);
    }
  }, [hasElapsed, ms]);
  return [hasElapsed, React.useCallback(() => setHasElapsed(false), [])];
}
