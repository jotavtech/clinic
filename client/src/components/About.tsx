import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

export default function About() {
  return (
    <section id="sobre" className="py-16 bg-[#F5F5F5]">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-12 items-center">
          <motion.div
            className="md:w-1/2 order-2 md:order-1"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-display mb-6 relative">
              <span className="inline-block pb-2 border-b-2 border-secondary">
                Sobre a Clínica Executivas
              </span>
            </h2>
            <p className="mb-6 text-lg">
              Um convite ao prazer de estar presente. Aqui, o tempo desacelera,
              o toque desperta e a energia se transforma. Cada encontro é uma
              celebração do corpo, da pele, do desejo e da consciência. Um
              espaço onde você se permite sentir, se entregar e se reconectar
              com a sua essência mais íntima — sem pressa, sem julgamentos,
              apenas presença.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <div className="flex items-center gap-3">
                <i className="fas fa-certificate text-secondary text-3xl"></i>
                <span>Mulheres incríveis</span>
              </div>
              <div className="flex items-center gap-3">
                <i className="fas fa-heart text-secondary text-3xl"></i>
                <span>Atendimento Aconchegante</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="md:w-1/2 order-1 md:order-2"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Card className="border-none overflow-hidden shadow-lg">
              <CardContent className="p-0">
                <img
                  src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600"
                  alt="Espaço acolhedor da Clínica Executivas"
                  className="w-full h-auto rounded-lg"
                />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
