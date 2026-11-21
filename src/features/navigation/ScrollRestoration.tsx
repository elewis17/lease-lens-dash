import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { loadSessionValue, storeSessionValue } from "./sessionState";

export function ScrollRestoration({ ownerId }: { ownerId: string }) {
  const { pathname, search } = useLocation();
  const scope = new URLSearchParams(search).get("property") ?? "";
  const key = `dealstack:${ownerId}:scroll:${pathname.replace(/\/decisions\/[^/]+\/memo\/?$/, "/decisions")}:${scope}`;

  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => { window.history.scrollRestoration = previous; };
  }, []);

  useLayoutEffect(() => {
    const target = loadSessionValue(key, 0);
    let offset = target;
    let restoring = true;
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(restore);
    function restore() {
      if (!restoring) return;
      window.scrollTo(0, target);
      if (window.scrollY === target) {
        restoring = false;
        observer?.disconnect();
      }
    }
    const save = () => storeSessionValue(key, offset);
    const onScroll = () => {
      if (!restoring) offset = window.scrollY;
    };
    const onUserScroll = () => {
      restoring = false;
      offset = window.scrollY;
      observer?.disconnect();
    };
    restore();
    if (restoring) observer?.observe(document.body);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", onUserScroll, { passive: true, once: true });
    window.addEventListener("touchmove", onUserScroll, { passive: true, once: true });
    window.addEventListener("pagehide", save);
    return () => {
      save();
      observer?.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", onUserScroll);
      window.removeEventListener("touchmove", onUserScroll);
      window.removeEventListener("pagehide", save);
    };
  }, [key]);

  return null;
}
