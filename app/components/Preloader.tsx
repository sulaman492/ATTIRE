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

// Final rotations of each card
const rotations = [-7, 5, -4, 6, -5, 3];

export default function Preloader() {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const cards = gsap.utils.toArray<HTMLElement>(".preloader-card");

      const timeline = gsap.timeline();

      cards.forEach((card, index) => {
        timeline.to(
          card,
          {
            opacity: 1,

            // Come towards viewer
            z: 0,
            scale: 1,

            // Final card angle
            rotation: rotations[index],

            duration: 0.9,
            ease: "power3.out",

            force3D: true,
          },

          // Start next card before previous one completely finishes
          index * 0.22
        );
      });
    },
    {
      scope: container,
    }
  );

  return (
    <div
      ref={container}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
    >
      {/* 3D perspective container */}
      <div
        className="relative h-[227px] w-[170px]"
        style={{
          perspective: "1000px",
          transformStyle: "preserve-3d",
        }}
      >
        {images.map((image, index) => (
          <div
            key={image}
            className="preloader-card absolute inset-0 overflow-hidden"
            style={{
              zIndex: index,

              /*
               * INITIAL STATE
               *
               * Card starts:
               * - invisible
               * - far behind
               * - small
               * - slightly rotated
               *
               * Keeping this inline prevents the
               * original stack flashing before GSAP runs.
               */
              opacity: 0,

              transform: `
                translateZ(-800px)
                scale(0.2)
                rotate(${rotations[index] - 2}deg)
              `,

              transformOrigin: "center center",
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