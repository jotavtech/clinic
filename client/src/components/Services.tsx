import { ArrowUpRight, Clock3, Leaf, Loader2 } from "lucide-react";
import { useServices } from "@/lib/catalog";
import { money } from "@shared/catalog";
export default function Services() {
  const { data: services = [], isLoading, isError, refetch } = useServices();
  return (
    <section id="servicos" className="section-pad services-section">
      <div className="site-shell">
        <div className="section-heading">
          <div>
            <div className="eyebrow">02 / Cuidado à sua maneira</div>
            <h2 className="section-title">
              Encontre a sua
              <br />
              <em>melhor pausa.</em>
            </h2>
          </div>
          <p className="section-copy">
            Explore os serviços disponíveis e escolha o cuidado que combina com
            o seu momento.
          </p>
        </div>
        {isLoading ? (
          <div className="empty-state" role="status">
            <Loader2 className="animate-spin" />
            Carregando serviços…
          </div>
        ) : isError ? (
          <div className="empty-state" role="alert">
            <p>Não foi possível carregar os serviços.</p>
            <button className="text-button" onClick={() => refetch()}>
              Tentar novamente
            </button>
          </div>
        ) : services.length === 0 ? (
          <div className="empty-state">
            <Leaf size={30} />
            <h3>Novas experiências em breve.</h3>
            <p>
              Os serviços estarão disponíveis aqui assim que forem publicados
              pela clínica.
            </p>
          </div>
        ) : (
          <div className="service-grid">
            {services.map((service, index) => (
              <article key={service.id} className="service-card">
                <div className="service-card-top">
                  <span className="service-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <Leaf size={24} />
                </div>
                {service.imageUrl && (
                  <img
                    className="service-image"
                    src={service.imageUrl}
                    alt={service.name}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = "/wellness.svg";
                    }}
                  />
                )}
                <h3>{service.name}</h3>
                <p>{service.description}</p>
                <div className="service-meta">
                  <span>
                    <Clock3 size={15} />
                    {service.durationMinutes} min
                  </span>
                  <strong>{money(service.priceCents)}</strong>
                </div>
                <a
                  className="service-link"
                  href="#contato"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("booking:service", {
                        detail: String(service.id),
                      }),
                    )
                  }
                >
                  Agendar este cuidado <ArrowUpRight size={18} />
                </a>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
