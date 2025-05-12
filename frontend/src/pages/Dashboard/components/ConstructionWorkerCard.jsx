import React from "react";
import PropTypes from 'prop-types';
import obreroPepito from "../../../assets/obreroPepito.png";

export function ConstructionWorkerCard({ name, id, role, bloodType }) {
    return (
        <div className="bg-slate-50 rounded-lg shadow-lg overflow-hidden transform transition-all hover:scale-105 relative border-2 border-black">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-100 to-slate-200 opacity-30"></div>
            
            <div className="relative bg-gradient-to-r from-slate-200 to-slate-300 p-5 flex justify-center">
                <img 
                    src={obreroPepito}
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
                        <span className="text-sm font-bold text-orange-600">Constructor</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

ConstructionWorkerCard.propTypes = {
    name: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
    bloodType: PropTypes.string
};