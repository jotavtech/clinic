import { Heart, BadgeCheck } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

export default function About() {
  return (
    <section id="sobre" className="remaster-about py-16 bg-[#F5F5F5]">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-12 items-center">
          <motion.div
            className="md:w-1/2 order-2 md:order-1"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <span className="section-kicker">Sobre nós</span>
            <h2 className="text-3xl md:text-4xl font-display mb-6 relative">
              <span className="inline-block pb-2 border-b-2 border-secondary">
                Sobre a Clínica Executivas
              </span>
            </h2>
            <p className="mb-6 text-lg">
              Um convite para estar presente. Aqui, o tempo desacelera e o
              cuidado ganha espaço. Um ambiente acolhedor para relaxar e cuidar
              do seu bem-estar — sem pressa, com atenção a cada detalhe.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <div className="flex items-center gap-3">
                <BadgeCheck className="text-secondary" size={24}/>
                <span>Nossa equipe</span>
              </div>
              <div className="flex items-center gap-3">
                <Heart className="text-secondary" size={24}/>
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
                  alt="Imagem ilustrativa de um espaço de bem-estar"
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
