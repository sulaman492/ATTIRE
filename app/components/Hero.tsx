
"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import styles from "./Hero.module.css";

gsap.registerPlugin(useGSAP);

const categories = [
  "JEANS",
  "T-SHIRTS",
  "HOODIES",
  "JACKETS",
  "SWEATSHIRTS",
  "EVERYDAY ESSENTIALS",
];

const secondaryItems = [
  "NEW SEASON",
  "ATTIRE",
  "EVERYDAY STYLE",
  "MADE TO STAND OUT",
];

export default function Hero() {
  const heroRef = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      const timeline = gsap.timeline({
        defaults: {
          ease: "power3.out",
        },
      });

      timeline
        .from("[data-hero-kicker]", {
          y: 15,
          autoAlpha: 0,
          duration: 0.6,
        })
        .from(
          "[data-hero-line]",
          {
            y: 45,
            autoAlpha: 0,
            duration: 0.8,
            stagger: 0.13,
          },
          "-=0.25"
        )
        .from(
          "[data-hero-description]",
          {
            y: 15,
            autoAlpha: 0,
            duration: 0.55,
          },
          "-=0.3"
        )
        .from(
          "[data-hero-actions]",
          {
            y: 15,
            autoAlpha: 0,
            duration: 0.55,
          },
          "-=0.3"
        )
        .from(
          "[data-hero-model]",
          {
            y: 25,
            autoAlpha: 0,
            scale: 0.97,
            duration: 1,
          },
          "-=0.75"
        )
        .from(
          "[data-hero-ticker]",
          {
            autoAlpha: 0,
            duration: 0.6,
          },
          "-=0.45"
        );
    },
    {
      scope: heroRef,
    }
  );

  return (
    <section
      ref={heroRef}
      className={styles.hero}
      aria-labelledby="hero-title"
    >
      {/* LEFT CONTENT */}

      <div className={styles.copy}>
        <p
          className={styles.kicker}
          data-hero-kicker
        >
          ATTIRE — NEW COLLECTION
        </p>

        <h1
          id="hero-title"
          className={styles.headline}
        >
          <span data-hero-line>MADE TO</span>
          <span data-hero-line>STAND OUT.</span>
        </h1>

        <p
          className={styles.description}
          data-hero-description
        >
          Everyday essentials. Elevated style.
          <br />
          Find pieces that feel like you.
        </p>

        <div
          className={styles.actions}
          data-hero-actions
        >
          <a
            href="#shop"
            className={styles.cta}
          >
            <span>Shop Collection</span>

            <span
              className={styles.ctaArrow}
              aria-hidden="true"
            >
              ↗
            </span>
          </a>
        </div>
      </div>

      {/* MODEL */}

      <div
        className={styles.model}
        data-hero-model
        aria-hidden="true"
      >
        <Image
          src="/heromodel.png"
          alt=""
          fill
          priority
          sizes="(max-width: 767px) 90vw, 60vw"
          className={styles.modelImage}
        />
      </div>

      {/* FLOOR SHADOW */}

      <div
        className={styles.floorShadow}
        aria-hidden="true"
      />

      {/* RED BACKGROUND TICKER */}

      <div
        className={styles.tickerUnderlay}
        data-hero-ticker
        aria-hidden="true"
      >
        <div className={styles.tickerUnderlayTrack}>
          {[0, 1].map((group) => (
            <div
              className={styles.tickerUnderlayGroup}
              key={group}
            >
              {secondaryItems.map((item) => (
                <span
                  className={styles.underlayItem}
                  key={`${group}-${item}`}
                >
                  {item}
                  <span className={styles.underlayStar}>
                    ✳
                  </span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* MAIN BLACK TICKER */}

      <div
        className={styles.ticker}
        data-hero-ticker
        aria-hidden="true"
      >
        <div className={styles.tickerTrack}>
          {[0, 1].map((group) => (
            <div
              className={styles.tickerGroup}
              key={group}
            >
              {categories.map((category) => (
                <span
                  className={styles.tickerItem}
                  key={`${group}-${category}`}
                >
                  {category}

                  <span className={styles.tickerStar}>
                    ✳
                  </span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <span className={styles.srOnly}>
        Shop jeans, T-shirts, hoodies, jackets,
        sweatshirts and everyday essentials.
      </span>
    </section>
  );
}
