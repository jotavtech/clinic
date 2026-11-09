import { useState } from "react";
import { Link } from "wouter";
import { ArrowUpRight, Menu, X, Flower2 } from "lucide-react";
import { useSiteSettings } from "@/lib/catalog";
export default function Header() {
  const [open, setOpen] = useState(false);
  const { settings } = useSiteSettings();
  return (
    <header className="site-header">
      <div className="site-shell header-inner">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <Flower2 size={25} />
          </span>
          <span>
            {settings.brandName}
            <small>{settings.tagline}</small>
          </span>
        </Link>
        <button
          className="menu-toggle"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          aria-controls="main-navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
        <nav
          id="main-navigation"
          aria-label="Navegação principal"
          className={`site-nav ${open ? "is-open" : ""}`}
        >
          {[
            ["Sobre", "#sobre"],
            ["Serviços", "#servicos"],
            ["Equipe", "#galeria"],
            ["Contato", "#contato"],
          ].map(([label, href]) => (
            <a key={href} href={href} onClick={() => setOpen(false)}>
              {label}
            </a>
          ))}
          <a
            href="#contato"
            className="pill-button small"
            onClick={() => setOpen(false)}
          >
            Agendar um momento <ArrowUpRight size={16} />
          </a>
        </nav>
      </div>
    </header>
  );
}
