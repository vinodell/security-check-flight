import { useSyncExternalStore } from "react";
import {
  PHONE_SCREEN_MAX_EDGE,
  PHONE_USER_AGENT_PATTERN,
  TOUCH_QUERY,
} from "../consts";

function isPhone() {
  const client = navigator as Navigator & {
    userAgentData?: { mobile?: boolean };
  };
  if (
    client.userAgentData?.mobile ||
    PHONE_USER_AGENT_PATTERN.test(client.userAgent)
  ) {
    return true;
  }

  // A phone requesting the desktop site still has its touch screen dimensions.
  const shortEdge = Math.min(window.screen.width, window.screen.height);
  return (
    window.matchMedia(TOUCH_QUERY).matches && shortEdge <= PHONE_SCREEN_MAX_EDGE
  );
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
