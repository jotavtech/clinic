import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section id="inicio" className="relative h-[90vh] flex items-center">
      {/* Background image with overlay */}
      {/* 
        Para substituir esta imagem, siga estas etapas:
        1. Faça upload de uma imagem para um serviço como Imgur, ImgBB, Cloudinary, etc.
        2. Copie o URL direto da imagem
        3. Cole a URL no atributo src abaixo
        4. Atualize o texto alternativo (alt) se necessário 
      */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://i.ibb.co/gX4FyRH/maya2.jpg" // Imagem de Maya
          alt="Maya - Clínica Executivas"
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-primary bg-opacity-50"></div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10 text-white">
        <motion.div
          className="max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl mb-4 leading-tight">
            Experimente o melhor em massagem terapêutica
          </h2>
          <p className="text-lg md:text-xl mb-8 text-gray-100">
            Cuidamos do seu bem-estar com técnicas exclusivas e profissionais
            qualificados.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              asChild
              variant="default"
              className="bg-secondary hover:bg-opacity-90 text-white transition-all px-6 py-6 rounded font-accent font-medium"
            >
              <a href="#servicos">Nossos Serviços</a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="hover:bg-white hover:text-primary text-black transition-all px-6 py-6 rounded font-accent font-medium shadow-md"
            >
              <a href="#contato">Agende uma Sessão</a>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
