import { useSyncExternalStore } from "react";

const TOUCH_QUERY = "(pointer: coarse) and (hover: none)";

function isPhone() {
  const client = navigator as Navigator & {
    userAgentData?: { mobile?: boolean };
  };
  if (
    client.userAgentData?.mobile ||
    /iPhone|iPod|Android.*Mobile|Windows Phone|BlackBerry|BB10/i.test(
      client.userAgent,
    )
  ) {
    return true;
  }

  // A phone requesting the desktop site still has its touch screen dimensions.
  const shortEdge = Math.min(window.screen.width, window.screen.height);
  return window.matchMedia(TOUCH_QUERY).matches && shortEdge <= 640;
}

function subscribe(onChange: () => void) {
  const touch = window.matchMedia(TOUCH_QUERY);
  touch.addEventListener("change", onChange);
  window.addEventListener("resize", onChange);
  return () => {
    touch.removeEventListener("change", onChange);
    window.removeEventListener("resize", onChange);
  };
}

export function useIsPhone() {
  return useSyncExternalStore(subscribe, isPhone, () => false);
}
