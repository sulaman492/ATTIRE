import Image from "next/image";
import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section
      className={styles.hero}
      aria-labelledby="hero-title"
    >
      {/* ATTIRE */}
      <h1
        id="hero-title"
        className={styles.title}
      >
        ATTIRE
      </h1>

      {/* MODEL */}
      <div className={styles.model}>
        <Image
          src="/hero-model.png"
          alt="Model wearing an ATTIRE T-shirt and black trousers"
          fill
          priority
          className={styles.modelImage}
          sizes="(max-width: 600px) 84vw, (max-width: 900px) 55vw, 40vw"
        />
      </div>

      {/* SLOGAN */}
      <h2 className={styles.slogan}>
        <span>OWN</span>
        <span>YOUR</span>
        <span>LOOK</span>
      </h2>

      {/* COLLECTION */}
      <div className={styles.collection}>
        <p>NEW COLLECTION 2026</p>

        <a
          href="#shop"
          className={styles.cta}
        >
          <span>Shop Collection</span>

          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M3 12h17m-6-6 6 6-6 6"
              stroke="currentColor"
              strokeWidth="1.2"
            />
          </svg>
        </a>
      </div>
    </section>
  );
}