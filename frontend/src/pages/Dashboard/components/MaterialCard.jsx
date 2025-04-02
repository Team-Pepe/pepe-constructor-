import React from "react";
import PropTypes from 'prop-types';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function MaterialCard({ name, used, total, unit }) {
    const percentage = (used / total) * 100;
    return (
        <div className="bg-slate-800/80 rounded-lg border border-slate-700/50 p-4 hover:border-orange-500/30 transition-colors">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-white">{name}</h3>
                <Badge variant="outline" className="bg-slate-700/80 text-orange-400 border-orange-500/30">
                    {percentage.toFixed(0)}% Usado
                </Badge>
            </div>
            <Progress value={percentage} className="h-2 mb-2 bg-slate-700" indicatorClassName="bg-orange-500" />
            <div className="flex justify-between text-sm text-slate-300">
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