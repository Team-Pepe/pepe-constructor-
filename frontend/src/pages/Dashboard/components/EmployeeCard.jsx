import React from "react";
import PropTypes from 'prop-types';
import Barcode from 'react-barcode';
import pepeJefeObra from "../../../assets/pepeJefeObra.png"; // Importa la imagen desde la ruta especificada

export function EmployeeCard({ name, id, role, bloodType }) {
    return (
        <div className="bg-slate-50 rounded-lg shadow-lg overflow-hidden transform transition-all hover:scale-105 relative border-2 border-black">
            {/* Fondo del carnet */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-100 to-slate-200 opacity-30"></div>
            
            {/* Header del carnet con logo PEPE */}
            <div className="relative bg-gradient-to-r from-slate-200 to-slate-300 p-5 flex justify-center">
                <img 
                    src={pepeJefeObra} // Cambia la ruta a la imagen de tu logo
                    alt="PEPE CONSTRUCTION" 
                    className="h-16 w-auto"
                />
            </div>
            
            <div className="p-4 relative">
                {/* Información del empleado */}
                <div className="text-center">
                    <h3 className="text-lg font-bold text-gray-800 mb-1">{name}</h3>
                    <p className="text-sm text-slate-600 font-medium mb-2">{role}</p>
                    <p className="text-xs text-gray-600 mb-3">CC: {id}</p>
                </div>
                
                <div className="border-t border-gray-300 pt-3 mt-1">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-600">TIPO SANGRE:</span>
                        <span className="text-sm font-bold text-slate-700">{bloodType}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-600">ESPECIALIDAD:</span>
                        <span className="text-sm font-bold text-amber-800">Jefe de Obra</span>
                    </div>
                </div>
                
                {/* Footer con código de barras */}
                <div className="mt-3 pt-3 border-t border-gray-300">
                    <div className="flex justify-center">
                        <Barcode 
                            value={`PPC-${id}`}
                            width={1.5}
                            height={40}
                            fontSize={12}
                            margin={0}
                            displayValue={true}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

EmployeeCard.propTypes = {
    name: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
    bloodType: PropTypes.string
};