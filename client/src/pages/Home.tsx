import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import QuickContact from "@/components/QuickContact";
import About from "@/components/About";
import Services from "@/components/Services";
import Gallery from "@/components/Gallery";

import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import FloatingWhatsAppButton from "@/components/FloatingWhatsAppButton";

export default function Home() {
  return (
    <>
      <Helmet>
        <title>Clínica Executivas - Massagem Terapêutica em Campina Grande</title>
        <meta name="description" content="Clínica Executivas oferece serviços de massagem terapêutica e relaxante em Campina Grande. Conheça nossos tratamentos exclusivos para seu bem-estar." />
      </Helmet>

      <div className="flex flex-col min-h-screen">
        <Header />
        <main>
          <Hero />
          <QuickContact />
          <About />
          <Services />
          <Gallery />

          <Contact />
        </main>
        <Footer />
        <FloatingWhatsAppButton />
      </div>
    </>
  );
}
