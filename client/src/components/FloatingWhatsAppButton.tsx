import { motion } from "framer-motion";

export default function FloatingWhatsAppButton() {
  return (
    <motion.div 
      className="fixed bottom-6 right-6 z-50"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: "spring", stiffness: 260, damping: 20 }}
    >
      <a 
        href="https://wa.me/5583981101444" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="flex items-center justify-center w-14 h-14 bg-green-500 rounded-full shadow-lg hover:bg-green-600 transition-colors"
        aria-label="Contato via WhatsApp"
      >
        <i className="fab fa-whatsapp text-white text-2xl"></i>
      </a>
    </motion.div>
  );
}
