import React from "react";
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";

export function ActionButton({ icon: Icon, label }) {
    return (
        <Button
            variant="outline"
            className="h-20 flex flex-col items-center justify-center text-white border-white/30 bg-transparent hover:bg-white/10 hover:text-orange-400 hover:border-orange-500/50"
        >
            <Icon className="h-6 w-6 mb-2" />
            <span className="text-xs font-medium">{label}</span>
        </Button>
    );
}

ActionButton.propTypes = {
    icon: PropTypes.elementType.isRequired,
    label: PropTypes.string.isRequired
}; 