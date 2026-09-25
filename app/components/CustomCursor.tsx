"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const text = textRef.current;

    if (!cursor || !text) return;

    gsap.set(cursor, {
      xPercent: -50,
      yPercent: -50,
      scale: 0.1,
    });

    gsap.set(text, {
      opacity: 0,
    });

    const xTo = gsap.quickTo(cursor, "x", {
      duration: 0.18,
      ease: "power3.out",
    });

    const yTo = gsap.quickTo(cursor, "y", {
      duration: 0.18,
      ease: "power3.out",
    });

    const moveCursor = (e: MouseEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
    };

    const mouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      /* PRODUCT IMAGE */
      if (target.closest('[data-cursor="view-more"]')) {
        gsap.to(cursor, {
          scale: 1,
          duration: 0.35,
          ease: "power3.out",
        });

        gsap.to(text, {
          opacity: 1,
          duration: 0.2,
          delay: 0.05,
        });

        return;
      }

      /* NORMAL BUTTONS / LINKS */
      if (target.closest("a, button")) {
        gsap.to(cursor, {
          scale: 0.18,
          duration: 0.25,
          ease: "power3.out",
        });
      }
    };

    const mouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (target.closest('[data-cursor="view-more"]')) {
        gsap.to(cursor, {
          scale: 0.1,
          duration: 0.3,
          ease: "power3.out",
        });

        gsap.to(text, {
          opacity: 0,
          duration: 0.15,
        });

        return;
      }

      if (target.closest("a, button")) {
        gsap.to(cursor, {
          scale: 0.1,
          duration: 0.25,
          ease: "power3.out",
        });
      }
    };

    window.addEventListener("mousemove", moveCursor);
    document.addEventListener("mouseover", mouseOver);
    document.addEventListener("mouseout", mouseOut);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      document.removeEventListener("mouseover", mouseOver);
      document.removeEventListener("mouseout", mouseOut);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className="
        pointer-events-none
        fixed
        left-0
        top-0
        z-[9998]

        flex
        h-[105px]
        w-[105px]
        items-center
        justify-center

        rounded-full
        bg-[#ff1a0a]
      "
    >
      <span
        ref={textRef}
        className="
          text-center
          text-[11px]
          font-bold
          uppercase
          tracking-[0.08em]
          text-[#EDE4DD]
        "
      >
        View More
      </span>
    </div>
  );
}