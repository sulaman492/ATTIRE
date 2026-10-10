import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import ProductSection from "./components/ProductSection";
import CustomCursor from "./components/CustomCursor";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <>
      <CustomCursor />

      <main id="top">
        <Navbar />
        <Hero />
        <ProductSection />
      </main>
      <Footer />
    </>
  );
}
