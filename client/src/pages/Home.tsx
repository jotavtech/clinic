import { useSiteSettings } from "@/lib/catalog";
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
  const { settings } = useSiteSettings();
  return (
    <>
      <Helmet>
        <title>{settings.brandName} — Cuidado e bem-estar</title>
        <meta name="description" content={settings.heroDescription} />
        <meta
          property="og:title"
          content={`${settings.brandName} — Cuidado e bem-estar`}
        />
        <meta property="og:description" content={settings.heroDescription} />
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
