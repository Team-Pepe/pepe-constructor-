import React from "react";
import PropTypes from 'prop-types';
import { motion } from "framer-motion";

export function ActivityItem({ title, time, description, type, status }) {
    // Determinar el color del borde y título según el tipo y estado
    const getActivityStyles = () => {
        if (type === "request_status_update") {
            switch (status) {
                case "approved":
                    return {
                        border: "border-green-500/30",
                        title: "text-green-400",
                        icon: "✅"
                    };
                case "rejected":
                    return {
                        border: "border-red-500/30",
                        title: "text-red-400",
                        icon: "❌"
                    };
                case "resolved":
                    return {
                        border: "border-blue-500/30",
                        title: "text-blue-400",
                        icon: "🔧"
                    };
                default:
                    return {
                        border: "border-slate-700/50",
                        title: "text-slate-100",
                        icon: "📋"
                    };
            }
        } else if (type === "material_request") {
            return {
                border: "border-orange-500/30",
                title: "text-orange-400",
                icon: "📦"
            };
        } else if (type === "request_error") {
            return {
                border: "border-red-500/50",
                title: "text-red-300",
                icon: "⚠️"
            };
        }
        
        // Por defecto
        return {
            border: "border-slate-700/50",
            title: "text-slate-100",
            icon: "📄"
        };
    };

    const styles = getActivityStyles();

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ 
                opacity: 1, 
                x: 0,
                transition: {
                    duration: 0.3
                }
            }}
            className={`bg-slate-800/50 rounded-lg border ${styles.border} p-4 hover:bg-slate-700/30 transition-colors`}
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs">{styles.icon}</span>
                    <h3 className={`font-medium text-sm ${styles.title}`}>{title}</h3>
                </div>
                <span className="text-sm text-slate-400">{time}</span>
            </div>
            <p className="text-sm text-slate-400">{description}</p>
        </motion.div>
    );
}

ActivityItem.propTypes = {
    title: PropTypes.string.isRequired,
    time: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    type: PropTypes.string,
    status: PropTypes.string
};