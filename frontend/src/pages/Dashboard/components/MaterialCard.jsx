import React from "react";
import PropTypes from 'prop-types';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function MaterialCard({ name, used, total, unit }) {
    const percentage = (used / total) * 100;
    return (
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{name}</h3>
                <Badge variant="outline" className="bg-slate-700/50 text-slate-300">
                    {percentage.toFixed(0)}% Usado
                </Badge>
            </div>
            <Progress value={percentage} className="h-2 mb-2" />
            <div className="flex justify-between text-sm text-slate-400">
                <div>{used} {unit} usados</div>
                <div>{total - used} {unit} disponibles</div>
            </div>
        </div>
    );
}

MaterialCard.propTypes = {
    name: PropTypes.string.isRequired,
    used: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired,
    unit: PropTypes.string.isRequired
}; 