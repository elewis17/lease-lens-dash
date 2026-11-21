import { useEffect, useRef, useState } from "react";

function ease(progress: number) {
  let low = 0;
  let high = 1;
  for (let index = 0; index < 12; index++) {
    const t = (low + high) / 2;
    const x = 3 * (1 - t) ** 2 * t * 0.22 + 3 * (1 - t) * t ** 2 * 0.36 + t ** 3;
    if (x < progress) low = t;
    else high = t;
  }
  return 1 - (1 - (low + high) / 2) ** 3;
}

export function AnimatedNumber({ value, format }: { value?: number | null; format: (value: number | null) => string }) {
  const target = value ?? null;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const current = useRef(target);
  const [displayed, setDisplayed] = useState(target);
  useEffect(() => {
    const start = current.current;
    if (start === null || target === null || start === target || reduced) {
      current.current = target;
      setDisplayed(target);
      return;
    }
    const time = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const progress = Math.max(0, Math.min(1, (now - time) / 200));
      const next = progress === 1 ? target : start + (target - start) * ease(progress);
      current.current = next;
      setDisplayed(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, reduced]);
  const shown = reduced || target === null || displayed === null ? target : displayed;
  return <span><span aria-hidden="true">{format(shown)}</span><span className="sr-only">{format(target)}</span></span>;
}
