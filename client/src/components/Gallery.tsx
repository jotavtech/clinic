import { motion } from "framer-motion";

// Para substituir estas imagens, siga estas etapas:
// 1. Faça upload de fotos de rosto das meninas para um serviço como Imgur, ImgBB ou Cloudinary
// 2. Copie o URL direto da imagem
// 3. Cole a URL no campo 'src' correspondente abaixo
// 4. Atualize o nome e descrição se necessário

const massagistas = [
  {
    id: 1,
    nome: "Rubi",
    descricao: "Rubi",
    src: "https://res.cloudinary.com/dzwfuzxxw/image/upload/v1747336413/rubi_emz7qt.jpg", // URL da foto da Rubi
    tag: "Suíte Master",
  },
  {
    id: 2,
    nome: "Sofia",
    descricao: "Sofia",
    src: "https://res.cloudinary.com/dzwfuzxxw/image/upload/sofia1_sukbt4.jpg", // URL da foto da Sofia
  },
  {
    id: 3,
    nome: "Maya",
    descricao: "Maya",
    src: "https://res.cloudinary.com/dzwfuzxxw/image/upload/v1747336414/maya2_kip9gm.jpg", // URL da foto da Maya
    tag: "Suíte Master",
  },
  {
    id: 4,
    nome: "Melina",
    descricao: "Melina",
    src: "https://res.cloudinary.com/dzwfuzxxw/image/upload/v1747336414/melina1_njlacs.jpg", // URL da foto da Melina
  },
  {
    id: 5,
    nome: "Maya",
    descricao: "Maya",
    src: "https://res.cloudinary.com/dzwfuzxxw/image/upload/v1747336414/maya1_bnaghs.jpg", // URL da foto da Maya
    tag: "Suíte Master",
  },
  {
    id: 6,
    nome: "Rubi",
    descricao: "Rubi",
    src: "https://res.cloudinary.com/dzwfuzxxw/image/upload/v1747336413/rubi2_fuphuw.jpg", // URL da foto da Rubi
    tag: "Suíte Master",
  },
];

export default function Gallery() {
  return (
    <section id="galeria" className="py-16 bg-[#F5F5F5]">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-display mb-4">
            Nossas Profissionais
          </h2>
          <p className="max-w-2xl mx-auto">
            Conheça nossa equipe de profissionais qualificadas da Clínica
            Executivas.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {massagistas.map((massagista, index) => (
            <motion.div
              key={massagista.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className="relative overflow-hidden h-80">
                <img
                  src={massagista.src}
                  alt={`Foto de ${massagista.nome}`}
                  className="w-full h-full object-cover object-top"
                />
                {massagista.tag && (
                  <div className="absolute top-0 right-0 bg-red-600 text-white px-3 py-1 m-2 rounded-sm text-sm font-bold">
                    {massagista.tag}
                  </div>
                )}
              </div>
              <div className="p-4 text-center bg-primary text-white">
                <h3 className="text-xl font-display font-semibold">
                  {massagista.nome}
                </h3>
                <p className="text-sm text-gray-200 mt-1">
                  {massagista.descricao}
                </p>
                <a
                  href="#contato"
                  className="inline-block mt-3 bg-secondary text-black px-4 py-2 rounded text-sm font-medium hover:bg-opacity-90 transition-colors"
                >
                  Agendar
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
