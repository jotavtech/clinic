import { Leaf, Heart, Sparkles } from "lucide-react";
export default function QuickContact() {
  return (
    <div className="values-strip">
      <div className="site-shell">
        {[
          [Leaf, "Equilíbrio para o corpo"],
          [Heart, "Acolhimento em cada detalhe"],
          [Sparkles, "Bem-estar que acompanha você"],
        ].map(([Icon, label]) => {
          const Mark = Icon as typeof Leaf;
          return (
            <span key={String(label)}>
              <Mark size={19} />
              {String(label)}
            </span>
          );
        })}
      </div>
    </div>
  );
}
