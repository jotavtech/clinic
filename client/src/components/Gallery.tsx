import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-request";
import { Loader2 } from "lucide-react";

interface Massagista {
  id: number;
  nome: string;
  descricao: string;
  fotoUrl: string;
  videoUrl: string | null;
  suiteMaster: boolean;
  ativa: boolean;
  createdAt: string;
}

export default function Gallery() {
  // Buscar massagistas ativas da API
  const { data: massagistas = [], isLoading, isError } = useQuery({
    queryKey: ["/api/massagistas"],
    queryFn: () => apiRequest("GET", "/api/massagistas"),
    select: (data: any) => data.massagistas.filter((m: Massagista) => m.ativa) as Massagista[],
    refetchInterval: 60000, // Recarregar a cada minuto
  });

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

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-gray-600">Carregando profissionais...</span>
          </div>
        ) : isError ? (
          <div className="text-center py-12">
            <p className="text-red-600">Erro ao carregar profissionais. Tente novamente mais tarde.</p>
          </div>
        ) : massagistas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Nenhuma profissional disponível no momento.</p>
          </div>
        ) : (
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
                    src={massagista.fotoUrl || "https://via.placeholder.com/300x400?text=Sem+Foto"}
                    alt={`Foto de ${massagista.nome}`}
                    className="w-full h-full object-cover object-top"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://via.placeholder.com/300x400?text=Sem+Foto";
                    }}
                  />
                  {massagista.suiteMaster && (
                    <div className="absolute top-0 right-0 bg-red-600 text-white px-3 py-1 m-2 rounded-sm text-sm font-bold">
                      Suíte Master
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
        )}
      </div>
    </section>
  );
}
