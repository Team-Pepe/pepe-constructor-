import React from "react";
import PropTypes from 'prop-types';

export function ActivityItem({ title, time, description }) {
    return (
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-sm text-slate-100">{title}</h3>
                <span className="text-sm text-slate-400">{time}</span>
            </div>
            <p className="text-sm text-slate-400">{description}</p>
        </div>
    );
}

ActivityItem.propTypes = {
    title: PropTypes.string.isRequired,
    time: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired
}; 