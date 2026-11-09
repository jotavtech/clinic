import { MessageCircle } from "lucide-react";
import { useSiteSettings } from "@/lib/catalog";
import { whatsappLink } from "@shared/catalog";
export default function FloatingWhatsAppButton() {
  const { settings } = useSiteSettings();
  if (!settings.phone) return null;
  return (
    <a
      href={whatsappLink(settings.phone)}
      target="_blank"
      rel="noopener noreferrer"
      className="floating-contact"
      aria-label="Contato via WhatsApp"
    >
      <MessageCircle size={23} />
    </a>
  );
}
