import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const services = [
  "Massagem Relaxante",
  "Penetração Vaginal",
  "Massagem com finalização sexual",
  "Sexo oral",
];

export default function Services() {
  return (
    <section id="servicos" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-display mb-4">
            Nossos Serviços
          </h2>
          <p className="max-w-2xl mx-auto text-lg">
            Oferecemos uma variedade de tratamentos terapêuticos para atender às
            suas necessidades específicas.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Suíte Padrão */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="bg-[#F5F5F5] rounded-lg shadow-md p-8"
          >
            <div className="text-center">
              <h3 className="text-2xl font-display font-semibold mb-6">
                Suíte Padrão
              </h3>
              <ul className="mb-6 space-y-3 text-left">
                {services.map((service, index) => (
                  <li key={index} className="text-lg font-display">
                    {service}
                  </li>
                ))}
              </ul>

              <p className="text-secondary font-accent font-semibold text-xl mb-6">
                R$ 250,00
              </p>

              <Button
                asChild
                variant="outline"
                className="border-2 border-secondary text-secondary hover:bg-secondary hover:text-white transition-colors font-accent py-3 px-8 rounded text-sm uppercase shadow-sm font-medium text-black w-full"
              >
                <a href="#contato">Agendar</a>
              </Button>
            </div>
          </motion.div>

          {/* Suíte Master */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-[#1a1a1a] text-white rounded-lg shadow-md p-8"
          >
            <div className="text-center">
              <h3 className="text-2xl font-display font-semibold mb-6">
                Suíte Master
              </h3>
              <ul className="mb-6 space-y-3 text-left">
                {services.map((service, index) => (
                  <li key={index} className="text-lg font-display">
                    {service}
                  </li>
                ))}
                <li className="text-lg font-display font-semibold text-secondary">
                  Ambiente luxuoso
                </li>
                <li className="text-lg font-display font-semibold text-secondary">
                  Hidromassagem
                </li>
              </ul>

              <p className="text-red-500 font-accent font-semibold text-xl mb-6">
                R$ 395,00
              </p>

              <Button
                asChild
                variant="outline"
                className="border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors font-accent py-3 px-8 rounded text-sm uppercase shadow-sm font-medium w-full"
              >
                <a href="#contato">Agendar</a>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
