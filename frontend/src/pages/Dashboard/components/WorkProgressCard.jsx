import React from "react";
import PropTypes from 'prop-types';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function WorkProgressCard({ title, progress, workers, tasks }) {
    return (
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{title}</h3>
                <Badge variant="outline" className="bg-slate-700/50 text-slate-300">
                    {progress}% Completado
                </Badge>
            </div>
            <Progress value={progress} className="h-2 mb-4" />
            <div className="flex justify-between text-sm text-slate-400">
                <div>{workers} trabajadores</div>
                <div>{tasks} tareas pendientes</div>
            </div>
        </div>
    );
}

WorkProgressCard.propTypes = {
    title: PropTypes.string.isRequired,
    progress: PropTypes.number.isRequired,
    workers: PropTypes.number.isRequired,
    tasks: PropTypes.number.isRequired
}; 