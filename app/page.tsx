import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { HorizontalScroll } from "@/components/HorizontalScroll";
import { Houses } from "@/components/Houses";
import { Services } from "@/components/Services";
import { TerritoryMap } from "@/components/TerritoryMap";
import { Reviews } from "@/components/Reviews";
import { Contacts } from "@/components/Contacts";
import { Footer } from "@/components/Footer";
import { HouseModal } from "@/components/HouseModal";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <About />
        <HorizontalScroll />
        <Houses />
        <Services />
        <TerritoryMap />
        <Reviews />
        <Contacts />
      </main>
      <Footer />
      <HouseModal />
    </>
  );
}
