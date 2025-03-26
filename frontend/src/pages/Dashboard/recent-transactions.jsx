import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TransactionItem } from "./components/TransactionItem"

const transactions = [
  { id: 1, name: "Amazon.com", amount: -129.99, date: "2023-07-15", type: "expense" },
  { id: 2, name: "Whole Foods Market", amount: -89.72, date: "2023-07-10", type: "expense" },
  { id: 3, name: "Netflix Subscription", amount: -15.99, date: "2023-07-05", type: "expense" },
  { id: 4, name: "Freelance Payment", amount: 750, date: "2023-07-12", type: "income" },
  { id: 5, name: "Gas Station", amount: -45.5, date: "2023-07-18", type: "expense" },
]

export default function RecentTransactions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.slice(0, 3).map((transaction) => (
            <TransactionItem key={transaction.id} transaction={transaction} />
          ))}
        </div>
        <Button className="w-full mt-4" variant="outline">
          View All Transactions
        </Button>
      </CardContent>
    </Card>
  );
}

