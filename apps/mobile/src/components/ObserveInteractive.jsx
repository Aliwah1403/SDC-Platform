import { createContext, useContext, useEffect } from "react";
import { useObserve } from "expo-observe";

const StartupReadyContext = createContext(false);

export function StartupReadyProvider({ ready, children }) {
  return (
    <StartupReadyContext.Provider value={ready}>
      {children}
    </StartupReadyContext.Provider>
  );
}

export function ObserveInteractive() {
  const ready = useContext(StartupReadyContext);
  const { markInteractive } = useObserve();

  useEffect(() => {
    if (ready) markInteractive();
  }, [ready, markInteractive]);

  return null;
}
