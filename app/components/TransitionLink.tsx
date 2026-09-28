"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { usePageTransition } from "./PageTransition";

export default function TransitionLink({ href, ...props }: Omit<ComponentProps<typeof Link>, "href" | "onNavigate"> & { href: string }) {
  const { navigate } = usePageTransition();
  return <Link {...props} href={href} onNavigate={(event) => {
    // Let Next.js preserve anchor/query navigation and modified/new-tab clicks.
    if (new URL(href, window.location.href).pathname === window.location.pathname) return;
    event.preventDefault();
    navigate(href);
  }} />;
}
