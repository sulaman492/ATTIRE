"use client";

import Image from "next/image";
import { useState } from "react";

type NavItem = "shop" | "bag" | "login";

export default function Navbar() {
  const [activeItem, setActiveItem] = useState<NavItem>("shop");

  const navItemClass = (item: NavItem) => `
    relative
    cursor-pointer
    text-[25px]
    font-medium
    leading-none

    after:absolute
    after:left-0
    after:-bottom-[8px]
    after:h-[2px]
    after:bg-[#ff1a0a]
    after:transition-all
    after:duration-300
    after:ease-out

    ${
      activeItem === item
        ? "after:w-full"
        : "after:w-0 hover:after:w-full"
    }
  `;

  return (
    <nav
      className="
        sticky
        top-0
        z-50

        flex
        h-[80px]
        w-full
        items-center
        justify-between

        px-8
        md:px-12

        bg-[#E6DDD5]
      "
      style={{
        color: "#ff1a0a",
      }}
    >
      {/* LOGO */}
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

      {/* NAVIGATION */}
      <div className="flex items-center gap-10 md:gap-14">
        {/* SHOP */}
        <a
          href="#shop"
          onClick={() => setActiveItem("shop")}
          className={navItemClass("shop")}
        >
          Shop
        </a>

        {/* BAG */}
        <button
          type="button"
          onClick={() => setActiveItem("bag")}
          className={navItemClass("bag")}
        >
          Bag (0)
        </button>

        {/* LOGIN */}
        <button
          type="button"
          onClick={() => setActiveItem("login")}
          className={navItemClass("login")}
        >
          Login
        </button>
      </div>
    </nav>
  );
}