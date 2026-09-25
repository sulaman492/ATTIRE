import Image from "next/image";
import styles from "./ProductSection.module.css";

const products = [
  {
    id: 1,
    name: "Essential Tee",
    price: "PKR 4,999",
    category: "APPAREL",
    image: "/products/product1.png",
    layout: "one",
  },
  {
    id: 2,
    name: "Classic Cap",
    price: "PKR 2,499",
    category: "ACCESSORIES",
    image: "/products/product2.png",
    layout: "two",
  },
  {
    id: 3,
    name: "Signature Sweatshirt",
    price: "PKR 6,999",
    category: "APPAREL",
    image: "/products/product3.png",
    layout: "three",
  },
  {
    id: 4,
    name: "Utility Bag",
    price: "PKR 5,499",
    category: "ACCESSORIES",
    image: "/products/product4.png",
    layout: "four",
  },
  {
    id: 5,
    name: "Logo Tote",
    price: "PKR 2,999",
    category: "ACCESSORIES",
    image: "/products/product5.png",
    layout: "five",
  },
  {
    id: 6,
    name: "Red Beanie",
    price: "PKR 2,299",
    category: "APPAREL",
    image: "/products/product6.png",
    layout: "six",
  },
  {
    id: 7,
    name: "Metal Tote",
    price: "PKR 4,999",
    category: "ACCESSORIES",
    image: "/products/product7.png",
    layout: "seven",
  },
  {
    id: 8,
    name: "White Logo Tee",
    price: "PKR 4,499",
    category: "APPAREL",
    image: "/products/product8.png",
    layout: "eight",
  },
  {
    id: 9,
    name: "Black Essential Tee",
    price: "PKR 4,499",
    category: "APPAREL",
    image: "/products/product9.png",
    layout: "nine",
  },
  {
    id: 10,
    name: "Everyday Tote",
    price: "PKR 3,199",
    category: "ACCESSORIES",
    image: "/products/product10.png",
    layout: "ten",
  },
];

export default function ProductSection() {
  return (
    <section id="shop" className={styles.shop}>
      {/* TOP SECTION */}
      <div className={styles.shopHeader}>
        <div>
          <span className={styles.smallTitle}>ATTIRE</span>
        </div>

        <div className={styles.description}>
          Created for everyday wear. A collection built around simple forms,
          strong typography and pieces made to stand out.
        </div>

        <div className={styles.links}>
          <span>SHOP</span>
          <span>SHIPPING & RETURNS</span>
        </div>
      </div>

      {/* PRODUCTS */}
      <div className={styles.grid}>
        {products.map((product) => (
          <article
            key={product.id}
            className={`${styles.product} ${styles[product.layout]}`}
          >
            {/* IMAGE */}
            <div
              className={styles.imageWrapper}
              data-cursor="view-more"
            >
              <Image
                src={product.image}
                alt={product.name}
                fill
                className={styles.image}
                sizes="
                  (max-width: 600px) 90vw,
                  (max-width: 1000px) 50vw,
                  25vw
                "
              />
            </div>

            {/* PRODUCT INFO */}
            <div className={styles.productInfo}>
              <div className={styles.productTop}>
                <h3>{product.name}</h3>

                <span>{product.price}</span>
              </div>

              <div className={styles.category}>
                <span className={styles.dot} />

                {product.category}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}