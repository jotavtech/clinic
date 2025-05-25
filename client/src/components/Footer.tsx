import { Link } from "wouter";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-primary text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-display font-semibold mb-4">Clínica Executivas</h3>
            <p className="mb-4">
              Seu espaço de bem-estar e relaxamento em Campina Grande. Profissionais qualificados e 
              ambiente acolhedor para cuidar de você.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-display font-semibold mb-4">Links Rápidos</h3>
            <ul className="space-y-2">
              <li><a href="#inicio" className="hover:text-secondary transition-colors">Início</a></li>
              <li><a href="#sobre" className="hover:text-secondary transition-colors">Sobre Nós</a></li>
              <li><a href="#servicos" className="hover:text-secondary transition-colors">Serviços</a></li>
              <li><a href="#galeria" className="hover:text-secondary transition-colors">Galeria</a></li>
              <li><a href="#depoimentos" className="hover:text-secondary transition-colors">Depoimentos</a></li>
              <li><a href="#contato" className="hover:text-secondary transition-colors">Contato</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-display font-semibold mb-4">Contato</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <i className="fas fa-map-marker-alt mt-1 mr-2 text-secondary"></i>
                <span>R. Papa João XXIII, 608 - Liberdade, Campina Grande - PB, 58414-300</span>
              </li>
              <li className="flex items-start">
                <i className="fas fa-phone-alt mt-1 mr-2 text-secondary"></i>
                <span>55 83 98110-1444</span>
              </li>
              <li className="flex items-start">
                <i className="fas fa-envelope mt-1 mr-2 text-secondary"></i>
                <span>contato@clinicaexecutivas.com.br</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p>© {currentYear} Clínica Executivas. Todos os direitos reservados.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="#" className="text-white hover:text-secondary transition-colors">
              <i className="fab fa-facebook-f"></i>
            </a>
            <a href="#" className="text-white hover:text-secondary transition-colors">
              <i className="fab fa-instagram"></i>
            </a>
            <a href="#" className="text-white hover:text-secondary transition-colors">
              <i className="fab fa-whatsapp"></i>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
