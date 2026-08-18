import { createContext, useContext, useEffect } from "react";
import { useObserve } from "expo-observe";
import { prefetchEducationImages } from "@/utils/educationImagePrefetch";

const StartupReadyContext = createContext(false);
let didStartEducationImagePrefetch = false;

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

  useEffect(() => {
    if (!ready || didStartEducationImagePrefetch) return;
    didStartEducationImagePrefetch = true;
    prefetchEducationImages().catch((error) => {
      console.warn("[education] Failed to prefetch education images", error);
    });
  }, [ready]);

  return null;
}
