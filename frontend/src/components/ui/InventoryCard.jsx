import React from "react";
import PropTypes from 'prop-types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function InventoryCard({ name, description, quantity, image, unit = "kg" }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow bg-slate-800/80 border-slate-700/50 hover:border-orange-500/30">
      <div className="relative h-48 bg-slate-700">
        {image ? (
          <img 
            src={image} 
            alt={name} 
            className="w-full h-full object-cover"
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