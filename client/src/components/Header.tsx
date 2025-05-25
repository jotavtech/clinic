import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Menu, X } from "lucide-react";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [scrolled]);

  const navItems = [
    { label: "Início", href: "#inicio" },
    { label: "Sobre", href: "#sobre" },
    { label: "Serviços", href: "#servicos" },
    { label: "Galeria", href: "#galeria" },
    { label: "Contato", href: "#contato" },
    { label: "Admin", href: "/login" },
  ];

  return (
    <header className={`bg-primary text-white sticky top-0 z-50 transition-shadow ${scrolled ? 'shadow-md' : ''}`}>
      <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center justify-between w-full md:w-auto">
          <Link href="/" className="font-display text-2xl md:text-3xl font-bold cursor-pointer">
            Clínica Executivas
          </Link>
          <button
            onClick={toggleMobileMenu}
            className="md:hidden focus:outline-none"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <nav className={`${mobileMenuOpen ? "block" : "hidden"} md:block w-full md:w-auto mt-4 md:mt-0`}>
          <ul className="flex flex-col md:flex-row md:justify-end md:gap-x-6 gap-y-2 font-accent text-sm uppercase">
            {navItems.map((item, index) => (
              <li key={index} className="text-center md:text-left py-2 md:py-0">
                {item.href.startsWith('/') ? (
                  <Link 
                    href={item.href}
                    className="hover:text-secondary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    href={item.href}
                    className="hover:text-secondary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
