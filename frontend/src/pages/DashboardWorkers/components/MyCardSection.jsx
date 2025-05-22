import React, { useRef } from "react";
import { motion } from "framer-motion";
import { CreditCard, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import domtoimage from 'dom-to-image';  // Importamos dom-to-image en lugar de html2canvas

export const MyCardSection = ({ renderUserCard }) => {
  const cardRef = useRef(null);

  const handleDownloadCard = async () => {
    if (!cardRef.current) return;

    try {
      // Mostrar mensaje de "Generando..."
      const downloadButton = document.getElementById("download-card-button");
      if (downloadButton) {
        downloadButton.textContent = "Generando...";
        downloadButton.disabled = true;
      }

      // Usar dom-to-image para generar la imagen
      const dataUrl = await domtoimage.toJpeg(cardRef.current, {
        quality: 0.95,
        bgcolor: '#ffffff',
        style: {
          transform: 'none',
          borderRadius: '8px'
        }
      });
      
      // Descargar la imagen
      const link = document.createElement('a');
      link.download = 'mi-carnet-pepe-constructor.jpg';
      link.href = dataUrl;
      link.click();

    } catch (error) {
      console.error("Error al generar el carnet:", error);
      alert("Hubo un error al generar el carnet. Por favor intenta de nuevo.");
    } finally {
      // Restaurar botón
      const downloadButton = document.getElementById("download-card-button");
      if (downloadButton) {
        downloadButton.textContent = "Descargar Carnet";
        downloadButton.disabled = false;
      }
    }
  };

  return (
    <motion.section 
      id="mi-carnet"
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        transition: { 
          type: "spring",
          damping: 25,
          stiffness: 300
        }
      }}
    >
      <motion.h2 
        className="text-2xl font-bold mb-4 px-4 py-2 bg-slate-800/90 rounded-lg text-white inline-block flex items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          transition: {
            duration: 0.3,
            ease: "easeOut"
          }
        }}
      >
        <CreditCard className="mr-2 h-6 w-6 text-orange-400" />
        Mi Carnet
      </motion.h2>

      <div className="flex flex-col items-center justify-center p-6 bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-lg border border-slate-700/50 hover:border-orange-500/30 transition-all duration-300">
        <p className="text-white mb-6 text-center">
          Este es tu carnet oficial de PEPE Constructor. Puedes descargarlo para tenerlo siempre a mano.
        </p>
        
        <div ref={cardRef} className="mb-8 p-4 bg-white rounded-lg shadow-lg">
          {renderUserCard()}
        </div>
        
        <div className="flex gap-4">
          <Button 
            id="download-card-button"
            onClick={handleDownloadCard} 
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 hover:scale-105"
          >
            <Download className="h-5 w-5 mr-2" />
            Descargar Carnet
          </Button>
        </div>
      </div>
    </motion.section>
  );
};