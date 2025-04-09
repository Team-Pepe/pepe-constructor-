import React from "react";
import PropTypes from 'prop-types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getImageUrl } from "@/services/supabaseService";

export function InventoryCard({ name, description, quantity, image, unit = "kg" }) {
  // Función para validar si una cadena es base64 válida
  const isValidBase64 = (str) => {
    try {
      // Verificar si la cadena comienza con el formato de data URL
      if (str?.startsWith('data:image')) {
        return true;
      }
      // Verificar si es una cadena base64 válida
      return str && btoa(atob(str)) === str;
    } catch (err) {
      return false;
    }
  };

  // Función para obtener la URL de la imagen
  const getFullImageUrl = () => {
    if (!image) return null;
    
    // Si ya es una URL completa (incluyendo Supabase Storage), usarla directamente
    if (image.startsWith('http')) {
      return image;
    }
    
    // Si es base64 y ya tiene el prefijo data:image, usarlo directamente
    if (image.startsWith('data:image')) {
      return image;
    }
    
    // Si es base64 sin prefijo, añadir el prefijo
    if (isValidBase64(image)) {
      return `data:image/jpeg;base64,${image}`;
    }
    
    // Intentar construir la URL de Supabase Storage
    return getImageUrl(image);
  };

  const imageUrl = getFullImageUrl();

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow bg-slate-800/80 border-slate-700/50 hover:border-orange-500/30">
      <div className="relative h-48 bg-slate-700">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error('Error loading image:', imageUrl);
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/400x300?text=Sin+Imagen';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500">
            Sin imagen
          </div>
        )}
      </div>
      <CardHeader className="py-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium text-white">{name}</CardTitle>
          <Badge variant="outline" className="bg-slate-700/80 text-orange-400 border-orange-500/30">
            {quantity} {unit}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-slate-300 line-clamp-2">{description}</p>
      </CardContent>
    </Card>
  );
}

InventoryCard.propTypes = {
  name: PropTypes.string.isRequired,
  description: PropTypes.string,
  quantity: PropTypes.number.isRequired,
  image: PropTypes.string,
  unit: PropTypes.string
}; 