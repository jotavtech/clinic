import { ArrowDown, ArrowUpRight, Leaf, Sun } from "lucide-react";
import { useSiteSettings } from "@/lib/catalog";
export default function Hero() {
  const { settings } = useSiteSettings();
  return (
    <section id="inicio" className="hero-section">
      <div className="site-shell hero-grid">
        <div className="hero-copy">
          <div className="eyebrow">
            <span /> {settings.tagline || "Bem-estar no seu tempo"}
          </div>
          <h1>{settings.heroTitle}</h1>
          <p>{settings.heroDescription}</p>
          <div className="hero-actions">
            <a href="#contato" className="pill-button">
              Reserve seu momento <ArrowUpRight size={19} />
            </a>
            <a href="#servicos" className="text-button">
              Explore os serviços <ArrowDown size={16} />
            </a>
          </div>
          <div className="hero-note">
            <span>
              <Leaf size={17} /> Cuidado com você
            </span>
            <i />
            <span>
              <Sun size={17} /> Uma pausa na rotina
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <img
            src={settings.heroImageUrl || "/wellness.svg"}
            alt="Ambiente ilustrativo de tranquilidade e bem-estar"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = "/wellness.svg";
            }}
          />
          <div className="hero-image-label">
            <span className="status-dot" /> Tempo para respirar. Espaço para
            você.
          </div>
          <div className="hero-stamp">
            <Flower />{" "}
            <span>
              um momento
              <br />
              só seu
            </span>
          </div>
        </div>
      </div>
      <div className="site-shell hero-bottom">
        <span>Menos pressa. Mais presença.</span>
        <a href="#sobre">
          Conheça nosso espaço <ArrowDown size={14} />
        </a>
      </div>
    </section>
  );
}
function Flower() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      {[0, 60, 120].map((angle) => (
        <ellipse
          key={angle}
          cx="20"
          cy="20"
          rx="6"
          ry="18"
          stroke="currentColor"
          transform={`rotate(${angle} 20 20)`}
        />
      ))}
    </svg>
  );
}
