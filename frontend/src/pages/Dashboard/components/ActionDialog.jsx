import React from "react";
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { PlusCircle, SendHorizontal, CreditCard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ActionDialog({ title, description, actionText }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          {title === "Add Funds" && <PlusCircle className="mr-2 h-4 w-4" />}
          {title === "Send Money" && <SendHorizontal className="mr-2 h-4 w-4" />}
          {title === "Top Up" && <CreditCard className="mr-2 h-4 w-4" />}
          {title}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              className="col-span-3" />
          </div>
        </div>
        <Button type="submit">{actionText}</Button>
      </DialogContent>
    </Dialog>
  );
}

ActionDialog.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  actionText: PropTypes.string.isRequired
}; 