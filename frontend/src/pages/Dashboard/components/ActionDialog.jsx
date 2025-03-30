import React from "react";
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { PlusCircle, SendHorizontal, CreditCard, ArrowDownSquare } from "lucide-react";
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
  // Función para determinar qué icono mostrar según el título
  const getIcon = () => {
    if (title.includes("Agregar") || title.includes("Add")) {
      return <PlusCircle className="mr-2 h-4 w-4 text-orange-500" />;
    } else if (title.includes("Enviar") || title.includes("Send")) {
      return <SendHorizontal className="mr-2 h-4 w-4 text-orange-500" />;
    } else if (title.includes("Recargar") || title.includes("Top")) {
      return <CreditCard className="mr-2 h-4 w-4 text-orange-500" />;
    } else {
      return <ArrowDownSquare className="mr-2 h-4 w-4 text-orange-500" />;
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-start bg-transparent text-white border-white/30 hover:bg-white/10 hover:text-white hover:border-white/50"
        >
          {getIcon()}
          <span className="font-medium">{title}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-slate-800 text-slate-100 border-orange-500/30">
        <DialogHeader>
          <DialogTitle className="text-orange-500">{title}</DialogTitle>
          <DialogDescription className="text-slate-300">{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right text-slate-300">
              Monto
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="Ingrese monto"
              className="col-span-3 bg-slate-700 text-slate-100 border-slate-600 focus:border-orange-500" />
          </div>
        </div>
        <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white">{actionText}</Button>
      </DialogContent>
    </Dialog>
  );
}

ActionDialog.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  actionText: PropTypes.string.isRequired
}; 