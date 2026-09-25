import Preloader from "./components/Preloader";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";

export default function Home() {
  return (
    <>
      <Preloader />

      <main>
        <Navbar />
        <Hero />
      </main>
    </>
  );
}