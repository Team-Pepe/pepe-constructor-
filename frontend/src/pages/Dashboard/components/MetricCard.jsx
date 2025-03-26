import React from "react";
import PropTypes from 'prop-types';

export function MetricCard({ title, value, icon: Icon, color, detail }) {
    const getColor = () => {
        switch (color) {
            case "cyan":
                return "from-orange-500 to-amber-500 border-orange-500/30";
            case "green":
                return "from-green-500 to-emerald-500 border-green-500/30";
            case "blue":
                return "from-blue-500 to-indigo-500 border-blue-500/30";
            case "purple":
                return "from-purple-500 to-pink-500 border-purple-500/30";
            default:
                return "from-cyan-500 to-blue-500 border-cyan-500/30";
        }
    };

    return (
        <div
            className={`bg-slate-800/50 rounded-lg border ${getColor()} p-4 relative overflow-hidden`}
        >
            <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-slate-400">{title}</div>
                <Icon className={`h-5 w-5 text-${color}-500`} />
            </div>
            <div className="text-2xl font-bold mb-1 bg-gradient-to-r bg-clip-text text-transparent from-slate-100 to-slate-300">
                {value}
            </div>
            <div className="text-xs text-slate-500">{detail}</div>
        </div>
    );
}

MetricCard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
    color: PropTypes.string.isRequired,
    detail: PropTypes.string.isRequired
}; 