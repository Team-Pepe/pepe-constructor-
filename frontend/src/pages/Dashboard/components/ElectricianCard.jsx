import React from "react";
import PropTypes from 'prop-types';
import electricoPepe from "../../../assets/electricoPepe.png";

export function ElectricianCard({ name, id, role, bloodType }) {
    return (
        <div className="bg-slate-50 rounded-lg shadow-lg overflow-hidden transform transition-all hover:scale-105 relative border-2 border-black">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-100 to-slate-200 opacity-30"></div>
            
            <div className="relative bg-gradient-to-r from-slate-200 to-slate-300 p-5 flex justify-center">
                <img 
                    src={electricoPepe}
                    alt="PEPE CONSTRUCTION" 
                    className="h-16 w-auto"
                />
            </div>
            
            <div className="p-4 relative">
                <div className="text-center">
                    <h3 className="text-lg font-bold text-gray-800">{name}</h3>
                    <p className="text-sm text-slate-600 font-medium">{role}</p>
                    <p className="text-xs text-gray-600 mb-2">CC: {id}</p>
                </div>
                
                <div className="border-t border-gray-300 pt-3 mt-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-600">TIPO SANGRE:</span>
                        <span className="text-sm font-bold text-red-600">{bloodType}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-600">ESPECIALIDAD:</span>
                        <span className="text-sm font-bold text-blue-600">Electricista</span>
                    </div>
                </div>
                {/* Footer del carnet */}
                <div className="mt-3 pt-3 border-t border-gray-300">
                    <div className="flex justify-between">
                        <div className="text-xs text-gray-500">ID: PPC-JOB-{Math.floor(Math.random() * 1000)}</div>
                        <div className="text-xs text-gray-500">Válido: 2025-2026</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

ElectricianCard.propTypes = {
    name: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
    bloodType: PropTypes.string
};