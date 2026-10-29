
"use client";

import Image from "next/image";
import { useState } from "react";
import TransitionLink from "./TransitionLink";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const iconButton =
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full " +
    "border border-black/5 bg-white/90 text-[#ff1a0a] " +
    "transition-colors duration-200 hover:bg-white";

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-black/10 bg-[#E6DDD5] text-[#ff1a0a]">
      <div className="relative grid h-[68px] grid-cols-[1fr_auto_1fr] items-center sm:h-[76px]">
        {/* Decorative vertical dividers */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-[13%] hidden border-l border-dashed border-black/[0.08] sm:block"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-[18%] hidden border-l border-dashed border-black/[0.08] sm:block"
        />

        {/* LEFT: Hamburger */}
        <div className="flex h-full items-center px-4 sm:px-8">
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => {
              setMenuOpen(!menuOpen);
              setSearchOpen(false);
            }}
            className={iconButton}
          >
            {menuOpen ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  d="M6 6L18 18M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  d="M5 7H19M5 12H19M5 17H19"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
        </div>

        {/* CENTER: Logo */}
        <TransitionLink
          href="/"
          aria-label="ATTIRE home"
          className="relative z-10 flex items-center justify-center"
        >
          <Image
            src="/logo/attire.png"
            alt="ATTIRE"
            width={120}
            height={48}
            priority
            className="h-10 w-[90px] object-contain sm:w-[110px]"
          />
        </TransitionLink>

        {/* RIGHT: Search, Bag, Account */}
        <div className="flex h-full items-center justify-end gap-1.5 px-3 sm:gap-2 sm:px-8">
          {/* Search */}
          <button
            type="button"
            aria-label="Search"
            aria-expanded={searchOpen}
            onClick={() => {
              setSearchOpen(!searchOpen);
              setMenuOpen(false);
            }}
            className={iconButton}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <circle
                cx="10.8"
                cy="10.8"
                r="6.5"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="M15.6 15.6L20 20"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {/* Shopping bag */}
          <TransitionLink
            href="/cart"
            aria-label="Shopping bag"
            className={iconButton}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                d="M5.5 8.5H18.5L19.5 19H4.5L5.5 8.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M9 9V6.5A3 3 0 0 1 15 6.5V9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </TransitionLink>

          {/* Account */}
          <TransitionLink
            href="/login"
            aria-label="Account"
            className={iconButton}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="8"
                r="3.2"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M5.5 19C5.5 15.8 8.4 13.8 12 13.8S18.5 15.8 18.5 19"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </TransitionLink>
        </div>
      </div>

      {/* Hamburger menu panel */}
      {menuOpen && (
        <div className="absolute left-4 top-full z-50 mt-2 w-64 border border-black/10 bg-[#E6DDD5] p-5 shadow-xl sm:left-8">
          <p className="mb-4 text-xs font-semibold tracking-[0.2em] text-black/45">
            EXPLORE ATTIRE
          </p>

          <div className="flex flex-col">
            {[
              { label: "Shop collection", href: "#shop" },
              { label: "New arrivals", href: "#new-arrivals" },
              { label: "Our story", href: "#story" },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="border-b border-black/10 py-4 text-sm font-medium transition-colors hover:text-black"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Search panel */}
      {searchOpen && (
        <form
          action="/search"
          method="GET"
          className="absolute right-3 top-full z-50 mt-2 flex w-[min(360px,calc(100vw-24px))] items-center gap-3 border border-black/10 bg-[#E6DDD5] p-4 shadow-xl sm:right-8"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5 shrink-0"
            aria-hidden="true"
          >
            <circle
              cx="10.8"
              cy="10.8"
              r="6.5"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="M15.6 15.6L20 20"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>

          <input
            autoFocus
            type="search"
            name="q"
            placeholder="Search the collection..."
            aria-label="Search products"
            className="min-w-0 flex-1 bg-transparent text-sm text-black outline-none placeholder:text-black/45"
          />

          <button
            type="button"
            onClick={() => setSearchOpen(false)}
            aria-label="Close search"
            className="text-lg text-black/60 hover:text-[#ff1a0a]"
          >
            ×
          </button>
        </form>
      )}
    </nav>
  );
}
