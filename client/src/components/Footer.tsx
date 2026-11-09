import { Flower2, ArrowUpRight } from "lucide-react";
import { Link } from "wouter";
import { useSiteSettings } from "@/lib/catalog";
import { whatsappLink } from "@shared/catalog";
export default function Footer() {
  const { settings } = useSiteSettings();
  return (
    <footer className="site-footer">
      <div className="site-shell">
        <div className="footer-main">
          <div>
            <a href="#inicio" className="brand">
              <Flower2 size={27} />
              <span>{settings.brandName}</span>
            </a>
            <p>{settings.tagline}</p>
          </div>
          <div className="footer-links">
            <a href="#sobre">O espaço</a>
            <a href="#servicos">Serviços</a>
            <a href="#galeria">Equipe</a>
            <a href="#contato">
              Agendamento <ArrowUpRight size={14} />
            </a>
          </div>
          <div className="footer-contact">
            {settings.address && <p>{settings.address}</p>}
            {settings.email && (
              <a href={`mailto:${settings.email}`}>{settings.email}</a>
            )}
            {settings.phone && (
              <a
                href={whatsappLink(settings.phone)}
                target="_blank"
                rel="noreferrer"
              >
                Fale com a clínica <ArrowUpRight size={14} />
              </a>
            )}
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {settings.brandName}
          </span>
          <span>Seu bem-estar merece tempo.</span>
          <Link href="/login">
            Área administrativa <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>
    </footer>
  );
}
