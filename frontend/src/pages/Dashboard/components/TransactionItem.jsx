import React from "react";
import PropTypes from 'prop-types';
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export function TransactionItem({ transaction }) {
  return (
    <div className="flex items-center">
      <div className="flex-1">
        <p className="text-sm font-medium">{transaction.name}</p>
        <p className="text-xs text-muted-foreground">{transaction.date}</p>
      </div>
      <div className="flex items-center">
        <span
          className={`text-sm font-medium ${
            transaction.type === "income"
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}>
          {transaction.type === "income" ? "+" : "-"}${Math.abs(transaction.amount).toFixed(2)}
        </span>
        {transaction.type === "income" ? (
          <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400 ml-1" />
        ) : (
          <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-400 ml-1" />
        )}
      </div>
    </div>
  );
}

TransactionItem.propTypes = {
  transaction: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    amount: PropTypes.number.isRequired,
    date: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired
  }).isRequired
}; 