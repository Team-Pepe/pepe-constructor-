import React from "react";
import PropTypes from 'prop-types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

const statusColors = {
  Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  "In Progress": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

export function EventCard({ event }) {
  return (
    <Card key={event.id}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{event.title}</CardTitle>
        <event.icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{event.subtitle}</p>
        <div className="mt-2 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className={`px-2 py-1 rounded-full ${statusColors[event.status]}`}>{event.status}</span>
            <span className="text-muted-foreground">
              <Calendar className="inline mr-1 h-3 w-3" />
              {event.date}
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-1.5">
            <div
              className="bg-primary h-1.5 rounded-full"
              style={{ width: `${event.progress}%` }} />
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium">${event.target.toLocaleString()}</span>
            <span className="text-muted-foreground">{event.progress}% complete</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

EventCard.propTypes = {
  event: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
    status: PropTypes.string.isRequired,
    progress: PropTypes.number.isRequired,
    target: PropTypes.number.isRequired,
    date: PropTypes.string.isRequired
  }).isRequired
}; 