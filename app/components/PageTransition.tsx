"use client";

import { createContext, useCallback, useContext, useLayoutEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import gsap from "gsap";
import Preloader from "./Preloader";
import styles from "./PageTransition.module.css";

type Navigate = (href: string, options?: { refresh?: boolean }) => void;
const TransitionContext = createContext<{ navigate: Navigate } | null>(null);
export function usePageTransition() {
  const context = useContext(TransitionContext);
  if (!context) throw new Error("PageTransition must wrap the application.");
  return context;
}

export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const pageRef = useRef<HTMLDivElement>(null);
  const curtainRef = useRef<HTMLDivElement>(null);
  const animation = useRef<gsap.core.Timeline | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busy = useRef(false);
  const previousOverflow = useRef<string | null>(null);
  // The layout persists, so returning home never replays the full intro.
  const [showIntro, setShowIntro] = useState(pathname === "/");

  const unlock = useCallback(() => {
    busy.current = false;
    if (pageRef.current) pageRef.current.inert = false;
    if (previousOverflow.current !== null) {
      document.documentElement.style.overflow = previousOverflow.current;
      previousOverflow.current = null;
    }
    if (timeout.current) clearTimeout(timeout.current);
  }, []);

  const lock = useCallback(() => {
    busy.current = true;
    if (pageRef.current) pageRef.current.inert = true;
    if (previousOverflow.current === null) {
      previousOverflow.current = document.documentElement.style.overflow;
      document.documentElement.style.overflow = "hidden";
    }
  }, []);

  const reveal = useCallback(() => {
    const curtain = curtainRef.current;
    const page = pageRef.current;
    if (!curtain || !page) return;
    animation.current?.kill();
    if (timeout.current) clearTimeout(timeout.current);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(curtain, { autoAlpha: 0, yPercent: -100 });
      gsap.set(page, { clearProps: "transform,opacity,willChange" });
      unlock();
      return;
    }
    lock();
    gsap.set(curtain, { autoAlpha: 1, yPercent: 0 });
    animation.current = gsap.timeline({ onComplete: () => {
      gsap.set(curtain, { autoAlpha: 0 });
      gsap.set(page, { clearProps: "transform,opacity,willChange" });
      unlock();
    } })
      .to(curtain, { yPercent: -100, duration: 0.85, ease: "power4.inOut" }, 0)
      .fromTo(page, { y: 42, opacity: 0.7, willChange: "transform,opacity" },
        { y: 0, opacity: 1, duration: 1, ease: "power3.out" }, 0.13);
  }, [lock, unlock]);

  useLayoutEffect(() => {
    if (showIntro && pathname === "/") lock();
    else reveal();
    return () => {
      animation.current?.kill();
      unlock();
    };
  }, [pathname, showIntro, lock, reveal, unlock]);

  const navigate: Navigate = useCallback((href, options) => {
    if (busy.current) return;
    const destination = new URL(href, window.location.href);
    if (destination.origin !== window.location.origin) return;
    const commit = () => {
      router.push(destination.pathname + destination.search + destination.hash);
      if (options?.refresh) router.refresh();
    };
    if (destination.pathname === pathname || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      commit(); return;
    }
    lock();
    router.prefetch(href);
    animation.current?.kill();
    gsap.set(curtainRef.current, { autoAlpha: 1, yPercent: 100 });
    animation.current = gsap.timeline({ onComplete: commit })
      .to(curtainRef.current, { yPercent: 0, duration: 0.45, ease: "power3.inOut" });
    // If navigation fails, never strand the user behind a blocking curtain.
    timeout.current = setTimeout(reveal, 8000);
  }, [lock, pathname, reveal, router]);

  return (
    <TransitionContext.Provider value={{ navigate }}>
      <div ref={pageRef} className={styles.page}>{children}</div>
      <div ref={curtainRef} className={styles.curtain} data-page-curtain aria-hidden="true" />
      {showIntro && pathname === "/" && <Preloader onComplete={() => setShowIntro(false)} />}
      <noscript><style>{`[data-page-curtain], [data-preloader] { display: none !important; }`}</style></noscript>
    </TransitionContext.Provider>
  );
}
