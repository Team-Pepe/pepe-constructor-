import React from "react";
import { Button } from "@/components/ui/button";
import { PiggyBank, TrendingUp, CreditCard, ArrowRight } from "lucide-react";
import { EventCard } from "./components/EventCard";

const events = [
  {
    id: 1,
    title: "Emergency Fund",
    subtitle: "3 months of expenses saved",
    icon: PiggyBank,
    status: "In Progress",
    progress: 65,
    target: 15000,
    date: "Dec 2024",
  },
  {
    id: 2,
    title: "Stock Portfolio",
    subtitle: "Tech sector investment plan",
    icon: TrendingUp,
    status: "Pending",
    progress: 30,
    target: 50000,
    date: "Jun 2024",
  },
  {
    id: 3,
    title: "Debt Repayment",
    subtitle: "Student loan payoff plan",
    icon: CreditCard,
    status: "In Progress",
    progress: 45,
    target: 25000,
    date: "Mar 2025",
  },
];

export default function UpcomingEvents() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Upcoming Events</h2>
        <Button variant="outline" size="sm">
          View All <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}

