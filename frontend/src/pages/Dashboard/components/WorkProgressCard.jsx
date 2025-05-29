import React from "react";
import PropTypes from 'prop-types';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

export function WorkProgressCard({ title, progress, workers, tasks }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ 
                opacity: 1, 
                scale: 1,
                transition: {
                    duration: 0.3
                }
            }}
            className="bg-slate-800/80 rounded-lg border border-slate-700/50 p-4 hover:border-orange-500/30 transition-colors"
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <Badge variant="outline" className="bg-slate-700/80 text-orange-400 border-orange-500/30">
                    {progress}% Completado
                </Badge>
            </div>
            <Progress value={progress} className="h-2 mb-4 bg-slate-700" indicatorClassName="bg-orange-500" />
            <div className="flex justify-between text-sm text-slate-300">
                <div>{workers} trabajadores</div>
                <div>{tasks} tareas pendientes</div>
            </div>
        </motion.div>
    );
}

WorkProgressCard.propTypes = {
    title: PropTypes.string.isRequired,
    progress: PropTypes.number.isRequired,
    workers: PropTypes.number.isRequired,
    tasks: PropTypes.number.isRequired
};