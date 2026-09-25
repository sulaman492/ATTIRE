"use client";

import Image from "next/image";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const images = [
  "/preloader/image1.png",
  "/preloader/image2.png",
  "/preloader/image3.png",
  "/preloader/image4.png",
  "/preloader/image5.png",
  "/preloader/image6.png",
];

const rotations = [-7, 5, -4, 6, -5, 3];

const letters = "ATTIRE".split("");

export default function Preloader() {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const cards =
        gsap.utils.toArray<HTMLElement>(".preloader-card");

      const attireLetters =
        gsap.utils.toArray<HTMLElement>(".attire-letter");

      // Random ATTIRE letter order
      const randomLetters = gsap.utils.shuffle([
        ...attireLetters,
      ]);

      // -----------------------------
      // INITIAL ATTIRE STATE
      // -----------------------------

      gsap.set(attireLetters, {
        yPercent: 110,
        opacity: 0,
      });

      gsap.set(".attire-word", {
        visibility: "visible",
      });

      // -----------------------------
      // MAIN TIMELINE
      // -----------------------------

      const tl = gsap.timeline({
        onComplete: () => {
          // Small pause after everything finishes
          gsap.delayedCall(0.4, () => {
            tl.reverse();
          });
        },

        onReverseComplete: () => {
          // Preloader finished reversing
          // Hide it so homepage underneath becomes visible
          gsap.set(container.current, {
            display: "none",
          });
        },
      });

      // -----------------------------
      // CARD ANIMATION
      // -----------------------------

      cards.forEach((card, index) => {
        tl.to(
          card,
          {
            opacity: 1,
            scale: 1,
            rotation: rotations[index],

            duration: 0.5,
            ease: "power3.out",

            force3D: true,
          },

          index * 0.12
        );
      });

      // -----------------------------
      // ATTIRE ANIMATION
      // -----------------------------

      tl.to(
        randomLetters,
        {
          yPercent: 0,
          opacity: 1,

          duration: 0.5,
          stagger: 0.12,

          ease: "power3.out",
        },

        0
      );
    },

    {
      scope: container,
    }
  );

  return (
    <div
      ref={container}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black"
    >
      {/* ATTIRE */}
      <div
        className="
          attire-word
          pointer-events-none
          absolute
          z-20
          flex
          h-[96px]
          w-[360px]
          items-center
          justify-between
          overflow-hidden
        "
        style={{
          visibility: "hidden",
        }}
      >
        {letters.map((letter, index) => (
          <div
            key={`${letter}-${index}`}
            className="h-[96px] overflow-hidden"
          >
            <span
              className="
                attire-letter
                block
                text-[82px]
                leading-[96px]
              "
              style={{
                fontFamily:
                  '"font", "font Fallback", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',

                fontWeight: 900,

                color: "rgb(237, 228, 221)",

                letterSpacing: "-0.06em",
              }}
            >
              {letter}
            </span>
          </div>
        ))}
      </div>

      {/* CARD STACK */}
      <div className="relative z-10 h-[227px] w-[170px]">
        {images.map((image, index) => (
          <div
            key={image}
            className="preloader-card absolute inset-0 overflow-hidden"
            style={{
              zIndex: index + 1,

              opacity: 0,

              transform: `
                scale(0.2)
                rotate(${rotations[index] - 2}deg)
              `,

              transformOrigin: "center center",

              willChange: "transform, opacity",
            }}
          >
            <Image
              src={image}
              alt=""
              fill
              priority
              sizes="170px"
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}