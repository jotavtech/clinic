import { motion } from "framer-motion";

const features = [
  {
    id: 1,
    icon: "fas fa-user-md",
    title: "Profissionais Especializados",
    description: "Nossa equipe é formada por terapeutas certificados com anos de experiência."
  },
  {
    id: 2,
    icon: "fas fa-spa",
    title: "Ambiente Tranquilo",
    description: "Espaço projetado para proporcionar relaxamento completo durante sua sessão."
  },
  {
    id: 3,
    icon: "fas fa-leaf",
    title: "Produtos Naturais",
    description: "Utilizamos apenas produtos de alta qualidade e formulações naturais."
  },
  {
    id: 4,
    icon: "fas fa-handshake",
    title: "Atendimento Personalizado",
    description: "Cada sessão é adaptada às necessidades individuais de cada cliente."
  }
];

export default function WhyChooseUs() {
  return (
    <section className="py-16 bg-primary text-white">
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-display mb-4">Por Que Escolher a Clínica Executivas?</h2>
          <p className="max-w-2xl mx-auto">
            Nossa missão é proporcionar experiências terapêuticas excepcionais que promovam bem-estar físico e mental.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div 
              key={feature.id}
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="bg-secondary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className={`${feature.icon} text-2xl`}></i>
              </div>
              <h3 className="text-xl font-display font-semibold mb-2">{feature.title}</h3>
              <p>{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
