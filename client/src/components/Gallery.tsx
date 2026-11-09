import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Users, Loader2 } from "lucide-react";
import { apiRequest, responseList } from "@/lib/api-request";
type Professional = {
  id: number;
  nome: string;
  descricao: string;
  fotoUrl: string;
  ativa: boolean;
};
export default function Gallery() {
  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["/api/massagistas"],
    queryFn: () => apiRequest("GET", "/api/massagistas"),
    select: (data) =>
      responseList<Professional>(data, "massagistas").filter(
        (item) => item.ativa,
      ),
    refetchInterval: 60000,
  });
  return (
    <section id="galeria" className="section-pad">
      <div className="site-shell">
        <div className="section-heading">
          <div>
            <div className="eyebrow">03 / Quem cuida de você</div>
            <h2 className="section-title">
              Presença que
              <br />
              <em>faz a diferença.</em>
            </h2>
          </div>
          <p className="section-copy">
            Conheça as pessoas que fazem parte da nossa equipe e da sua
            experiência de cuidado.
          </p>
        </div>
        {isLoading ? (
          <div className="empty-state" role="status">
            <Loader2 className="animate-spin" />
            Carregando profissionais…
          </div>
        ) : isError ? (
          <div className="empty-state" role="alert">
            <p>Erro ao carregar profissionais. Tente novamente.</p>
            <button className="text-button" onClick={() => refetch()}>
              Tentar novamente
            </button>
          </div>
        ) : data.length === 0 ? (
          <div className="empty-state">
            <Users size={30} />
            <h3>Nossa equipe, em breve por aqui.</h3>
            <p>Os perfis publicados pela clínica aparecerão neste espaço.</p>
          </div>
        ) : (
          <div className="team-grid">
            {data.map((person) => (
              <article className="team-card" key={person.id}>
                <div className="team-image">
                  <img
                    src={person.fotoUrl || "/placeholder.svg"}
                    alt={`Foto de ${person.nome}`}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                </div>
                <div className="team-info">
                  <div>
                    <h3>{person.nome}</h3>
                    <p>{person.descricao}</p>
                  </div>
                  <a
                    href="#contato"
                    aria-label={`Agendar com a clínica — ${person.nome}`}
                  >
                    <ArrowUpRight size={22} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
