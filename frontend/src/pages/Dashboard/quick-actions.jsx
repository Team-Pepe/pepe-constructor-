"use client"

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActionDialog } from "./components/ActionDialog";

export default function QuickActions() {
  return (
    <Card className="border border-border">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <ActionDialog
          title="Add Funds"
          description="Add funds to your account"
          actionText="Add Funds" />
        <ActionDialog
          title="Send Money"
          description="Send money to another account"
          actionText="Send Money" />
        <ActionDialog title="Top Up" description="Top up your account" actionText="Top Up" />
      </CardContent>
    </Card>
  );
}

