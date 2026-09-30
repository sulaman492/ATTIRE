import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      {/* TOP LINE */}
      <div className={styles.topLine} />

      {/* MAIN MESSAGE */}
      <div className={styles.main}>
        <div className={styles.statement}>
          <p className={styles.eyebrow}>
            ATTIRE / EST. 2026
          </p>

          <h2 className={styles.heading}>
            <span>OWN</span>
            <span>YOUR</span>
            <span>LOOK.</span>
          </h2>
        </div>

        <div className={styles.right}>
          <p className={styles.description}>
            Made for everyday movement.
            Simple forms, strong graphics
            and pieces designed to stand out.
          </p>

          <Link href="#shop" className={styles.cta}>
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
          </Link>
        </div>
      </div>

      {/* BIG BRAND */}
      <div className={styles.brandWrap}>
        <p className={styles.brand}>
          ATTIRE
        </p>
      </div>

      {/* BOTTOM */}
      <div className={styles.bottom}>
        <div className={styles.copyright}>
          © {year} ATTIRE
        </div>

        <nav
          className={styles.navigation}
          aria-label="Footer navigation"
        >
          <Link href="#shop">
            Shop
          </Link>

          <Link href="/login">
            Login
          </Link>

          <Link href="/signup">
            Sign Up
          </Link>

          <Link href="/">
            Shipping & Returns
          </Link>
        </nav>

        <div className={styles.tagline}>
          WEAR IT YOUR WAY.
        </div>
      </div>
    </footer>
  );
}