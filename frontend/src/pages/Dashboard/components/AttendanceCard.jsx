import React from "react";
import PropTypes from 'prop-types';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AttendanceCard({ name, role, status, time }) {
    return (
        <div className="bg-slate-800/80 rounded-lg border border-slate-700/50 p-4 hover:border-orange-500/30 transition-colors">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Avatar className="border-2 border-orange-500/30">
                        <AvatarFallback className="bg-slate-700 text-orange-400">{name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="font-medium text-white">{name}</div>
                        <div className="text-sm text-slate-300">{role}</div>
                    </div>
                </div>
                <div className="text-right">
                    <Badge
                        variant="outline"
                        className={`${
                            status === "PRESENT"
                                ? "bg-green-500/20 text-green-400 border-green-500/50"
                                : "bg-red-500/20 text-red-400 border-red-500/50"
                        }`}
                    >
                        {status}
                    </Badge>
                    <div className="text-sm text-slate-300 mt-1">{time}</div>
                </div>
            </div>
        </div>
    );
}

AttendanceCard.propTypes = {
    name: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    time: PropTypes.string
}; 