import React from "react";
import PropTypes from 'prop-types';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AttendanceCard({ name, role, status, time }) {
    return (
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Avatar>
                        <AvatarFallback>{name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="font-medium">{name}</div>
                        <div className="text-sm text-slate-400">{role}</div>
                    </div>
                </div>
                <div className="text-right">
                    <Badge
                        variant="outline"
                        className={`${
                            status === "Presente"
                                ? "bg-green-500/20 text-green-400 border-green-500/50"
                                : "bg-red-500/20 text-red-400 border-red-500/50"
                        }`}
                    >
                        {status}
                    </Badge>
                    <div className="text-sm text-slate-400 mt-1">{time}</div>
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