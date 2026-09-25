"use client";

import Image from "next/image";
import { useState } from "react";

const themes = [
  {
    name: "black",
    dot: "#000000",
  },
  {
    name: "cream",
    dot: "rgb(237, 228, 221)",
  },
  {
    name: "red",
    dot: "#ff1a0a",
  },
];

export default function Navbar() {
  const [activeTheme, setActiveTheme] = useState("red");

  return (
    <nav
      className="
        flex
        h-[100px]
        w-full
        items-center
        justify-between
        px-8
        md:px-12
      "
      style={{
        backgroundColor: "rgb(237, 228, 221)",
        color: "#ff1a0a",
      }}
    >
      {/* LEFT - LOGO */}
      <div className="flex items-center">
        <Image
          src="/logo/attire.png"
          alt="ATTIRE"
          width={150}
          height={150}
          priority
          className="object-contain"
        />
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-10 md:gap-14">

        {/* SHOP */}
        <a
          href="#shop"
          className="
            text-[25px]
            font-medium
            leading-none
            underline
            decoration-[2px]
            underline-offset-[8px]
          "
        >
          Shop
        </a>

        {/* BAG */}
        <button
          type="button"
          className="
            text-[25px]
            font-medium
            leading-none
          "
        >
          Bag (0)
        </button>

        {/* COLOR OPTIONS */}
        <div className="flex items-center gap-[7px]">
          {themes.map((theme) => (
            <button
              key={theme.name}
              type="button"
              onClick={() => setActiveTheme(theme.name)}
              aria-label={`${theme.name} theme`}
              className="
                relative
                h-[24px]
                w-[24px]
                rounded-full
                border
                border-black
                transition-transform
                duration-200
                hover:scale-110
              "
              style={{
                backgroundColor: theme.dot,
              }}
            >
              {activeTheme === theme.name && (
                <span
                  className="
                    absolute
                    left-1/2
                    top-1/2
                    h-[6px]
                    w-[6px]
                    -translate-x-1/2
                    -translate-y-1/2
                    rounded-full
                    bg-white
                  "
                />
              )}
            </button>
          ))}
        </div>

      </div>
    </nav>
  );
}

