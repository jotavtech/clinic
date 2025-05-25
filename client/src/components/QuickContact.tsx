import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function QuickContact() {
  return (
    <div className="bg-secondary py-4 text-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="font-accent text-lg mb-4 md:mb-0">
            <i className="fas fa-phone-alt mr-2"></i> Agende Agora: 
            <strong> 55 83 98110-1444</strong>
          </p>
          <Button 
            asChild
            variant="outline"
            className="bg-white text-secondary hover:bg-gray-100 hover:text-secondary border-white transition-all px-5 py-2 rounded-full font-accent font-medium text-sm uppercase shadow-sm"
          >
            <a href="#contato">Entrar em Contato</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
