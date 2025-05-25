import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    id: 1,
    content: "A melhor experiência de massagem que já tive! Os profissionais são extremamente qualificados e o ambiente é perfeito para relaxar. Saí renovada e já agendei meu retorno.",
    author: "Maria Silva",
    rating: 5
  },
  {
    id: 2,
    content: "Frequento a Clínica Executivas há mais de um ano e sempre saio satisfeito. A massagem terapêutica aliviou minhas dores nas costas que me incomodavam há anos. Recomendo!",
    author: "João Oliveira",
    rating: 5
  },
  {
    id: 3,
    content: "Ambiente sofisticado e atendimento impecável. A massagem com pedras quentes superou todas as minhas expectativas. Os profissionais são atenciosos e cuidadosos.",
    author: "Ana Paula Mendes",
    rating: 4.5
  },
  {
    id: 4,
    content: "Descobri a Clínica Executivas através de uma indicação e agora indico para todos os meus amigos. A drenagem linfática é excelente e os resultados são visíveis desde a primeira sessão.",
    author: "Roberto Almeida",
    rating: 5
  }
];

function renderStars(rating: number) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  
  return (
    <div className="text-secondary">
      {[...Array(fullStars)].map((_, i) => (
        <i key={`star-${i}`} className="fas fa-star"></i>
      ))}
      {hasHalfStar && <i className="fas fa-star-half-alt"></i>}
    </div>
  );
}

export default function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToTestimonial = (index: number) => {
    setActiveIndex(index);
    if (containerRef.current) {
      const slideWidth = containerRef.current.querySelector('.testimonial-slide')?.clientWidth || 0;
      const gapWidth = 24;
      const scrollPosition = index * (slideWidth + gapWidth);
      
      containerRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const scrollPosition = containerRef.current.scrollLeft;
        const slideWidth = containerRef.current.querySelector('.testimonial-slide')?.clientWidth || 0;
        const gapWidth = 24;
        
        const index = Math.round(scrollPosition / (slideWidth + gapWidth));
        if (index !== activeIndex) {
          setActiveIndex(index);
        }
      }
    };

    containerRef.current?.addEventListener('scroll', handleScroll);
    return () => {
      containerRef.current?.removeEventListener('scroll', handleScroll);
    };
  }, [activeIndex]);

  return (
    <section id="depoimentos" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-display mb-4">Depoimentos</h2>
          <p className="max-w-2xl mx-auto">
            O que nossos clientes dizem sobre nossas experiências de massagem.
          </p>
        </motion.div>
        
        <div className="relative">
          <div 
            ref={containerRef}
            className="testimonial-container flex overflow-x-auto pb-8 -mx-4 px-4 gap-6 hide-scrollbar"
          >
            {testimonials.map((testimonial) => (
              <Card 
                key={testimonial.id}
                className="testimonial-slide min-w-[280px] sm:min-w-[350px] flex-shrink-0 bg-[#F5F5F5] p-6 rounded-lg shadow-md"
              >
                <CardContent className="p-0">
                  <div className="flex items-center mb-4">
                    {renderStars(testimonial.rating)}
                  </div>
                  <p className="mb-4 italic">"{testimonial.content}"</p>
                  <div className="font-semibold">{testimonial.author}</div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="flex justify-center mt-6 gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full focus:outline-none ${
                  index === activeIndex ? 'bg-secondary' : 'bg-gray-300'
                }`}
                onClick={() => scrollToTestimonial(index)}
              ></button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
