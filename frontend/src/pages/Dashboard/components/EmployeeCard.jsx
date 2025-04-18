import React from "react";
import PropTypes from 'prop-types';
import pepeObrero from "../../../assets/pepeObrero.png"; // Importa la imagen desde la ruta especificada

export function EmployeeCard({ name, email, role }) {
    return (
        <div className="bg-orange-100 rounded-lg shadow-lg overflow-hidden transform transition-all hover:scale-105 relative">
            {/* Fondo del carnet */}
            <div className="absolute inset-0 bg-gradient-to-r from-orange-200 to-orange-300 opacity-30"></div>
            
            {/* Header del carnet con logo PEPE */}
            <div className="relative bg-gradient-to-r from-orange-300 to-orange-400 p-5 flex justify-center">
                <img 
                    src={pepeObrero} // Cambia la ruta a la imagen de tu logo
                    alt="PEPE CONSTRUCTION" 
                    className="h-16 w-auto"
                />
            </div>
            
            <div className="p-4 relative">
                {/* Información del empleado */}
                <div className="text-center">
                    <h3 className="text-lg font-bold text-gray-800 mb-1">{name}</h3>
                    <p className="text-sm text-orange-600 font-medium mb-2">{role}</p>
                    <p className="text-xs text-gray-600 mb-3">{email}</p>
                </div>
                
                <div className="border-t border-gray-300 pt-3 mt-1">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-600">TIPO SANGRE:</span>
                        <span className="text-sm font-bold text-orange-600">O+</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-600">EMPRESA:</span>
                        <span className="text-sm font-bold text-orange-600">PEPE CONSTRUCTION</span>
                    </div>
                </div>
                
                {/* Footer del carnet */}
                <div className="mt-3 pt-3 border-t border-gray-300">
                    <div className="flex justify-between">
                        <div className="text-xs text-gray-500">ID: PPC-2023-{Math.floor(Math.random() * 1000)}</div>
                        <div className="text-xs text-gray-500">Válido: 2025-2026</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

EmployeeCard.propTypes = {
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired
}; 