import React from "react";
import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ViewMaterialsModal({ isOpen, onClose, materials = [], zoneName = "Zona" }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md border border-slate-700">
        <h3 className="text-lg font-semibold mb-4 text-white">
          Materiales en {zoneName}
        </h3>
        
        <ScrollArea className="h-[300px] rounded-md border border-slate-700 p-4">
          {materials.length === 0 ? (
            <p className="text-slate-400 text-center">No hay materiales asignados a esta zona</p>
          ) : (
            <div className="space-y-3">
              {materials.map((material) => (
                <div
                  key={material.id}
                  className="bg-slate-700/50 rounded-lg p-3 border border-slate-600"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-white">{material.name}</h4>
                      <p className="text-sm text-slate-400">
                        Cantidad disponible: {material.quantity} {material.unit}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end mt-4">
          <Button onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}

ViewMaterialsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  materials: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      quantity: PropTypes.number.isRequired,
      unit: PropTypes.string.isRequired,
    })
  ).isRequired,
  zoneName: PropTypes.string,
}; 