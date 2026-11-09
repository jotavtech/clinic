import { ArrowDown, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function Hero() {
  return <section id="inicio" className="clinic-hero">
    <div className="hero-backdrop" aria-hidden="true">
      <img src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1600&q=85" alt="" onError={event=>{event.currentTarget.style.display='none';}}/>
    </div>
    <div className="container mx-auto px-4 hero-layout">
      <div className="hero-content">
        <div className="section-kicker light"><span/>Clínica Executivas · Campina Grande</div>
        <h1 className="font-display">Experimente o melhor em <span>massagem terapêutica.</span></h1>
        <p>Cuidamos do seu bem-estar com técnicas exclusivas e profissionais qualificados.</p>
        <div className="hero-actions">
          <Button asChild className="bg-secondary text-white hover:bg-secondary/90"><a href="#servicos">Nossos Serviços <ArrowUpRight size={17}/></a></Button>
          <Button asChild variant="outline" className="hero-secondary"><a href="#contato">Agende uma Sessão <ArrowUpRight size={17}/></a></Button>
        </div>
      </div>
      <a href="#sobre" className="hero-scroll"><span>Conheça a clínica</span><ArrowDown size={16}/></a>
    </div>
  </section>;
}
