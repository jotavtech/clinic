import { ArrowUpRight } from "lucide-react";
import { useSiteSettings } from "@/lib/catalog";
export default function About() {
  const { settings } = useSiteSettings();
  return (
    <section id="sobre" className="section-pad">
      <div className="site-shell about-grid">
        <div className="about-art">
          <img
            src={settings.aboutImageUrl || "/wellness.svg"}
            alt="Ilustração de um espaço de descanso"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = "/wellness.svg";
            }}
          />
          <span>Respire. Você está no seu tempo.</span>
        </div>
        <div>
          <div className="eyebrow">01 / O nosso espaço</div>
          <h2 className="section-title">{settings.aboutTitle}</h2>
          <p className="section-copy whitespace-pre-line">
            {settings.aboutDescription}
          </p>
          <a className="text-button" href="#galeria">
            Conheça a equipe <ArrowUpRight size={17} />
          </a>
        </div>
      </div>
    </section>
  );
}
