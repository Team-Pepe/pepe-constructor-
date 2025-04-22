import React from "react";
import PropTypes from "prop-types";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ViewMaterialsModal({ isOpen, onClose, materials = [], zoneName = "Zona" }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-800 text-white">
        <DialogHeader>
          <DialogTitle>Materiales en {zoneName}</DialogTitle>
          <DialogDescription className="text-slate-300">
            Lista de materiales asignados a esta zona de trabajo.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[300px] rounded-md border border-slate-700 p-4">
          {!Array.isArray(materials) ? (
            <p className="text-slate-400 text-center">Error al cargar materiales</p>
          ) : materials.length === 0 ? (
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
                        Cantidad disponible: {material.quantity} {material.unit || 'unidades'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

ViewMaterialsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  materials: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      quantity: PropTypes.number.isRequired,
      unit: PropTypes.string
    })
  ).isRequired,
  zoneName: PropTypes.string,
}; 