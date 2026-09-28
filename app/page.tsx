import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import ProductSection from "./components/ProductSection";
import CustomCursor from "./components/CustomCursor";

export default function Home() {
  return (
    <>
      <CustomCursor />

      <main>
        <Navbar />
        <Hero />
        <ProductSection />
      </main>
    </>
  );
}
