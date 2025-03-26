import React from "react";
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";

export function NavItem({ icon: Icon, label, active }) {
    return (
        <Button
            variant="ghost"
            className={`w-full justify-start ${
                active
                    ? "bg-slate-800/70 text-orange-400"
                    : "text-slate-400 hover:text-slate-100"
            }`}
        >
            <Icon className="mr-2 h-4 w-4" />
            {label}
        </Button>
    );
}

NavItem.propTypes = {
    icon: PropTypes.elementType.isRequired,
    label: PropTypes.string.isRequired,
    active: PropTypes.bool
}; 