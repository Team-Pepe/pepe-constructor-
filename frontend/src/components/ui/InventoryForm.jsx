import React, { useState, useRef } from "react";
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Upload } from "lucide-react";

export function InventoryForm({ onSubmit, initialData = null, isEditing = false }) {
  const [formData, setFormData] = useState(initialData || {
    name: "",
    description: "",
    quantity: "",
    imageFile: null,
    imagePreview: null
  });
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          imageFile: file,
          imagePreview: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    
    try {
      // Guardar la imagen localmente
      let imagePath = null;
      if (formData.imageFile) {
        // En un entorno real, aquí se guardaría el archivo en el sistema de archivos local
        // Para fines de demostración, simplemente usaremos la URL de la vista previa
        imagePath = formData.imagePreview;
        
        // En un entorno de producción, se enviaría el archivo a un endpoint del servidor:
        // const formDataToSend = new FormData();
        // formDataToSend.append('image', formData.imageFile);
        // const response = await fetch('/api/upload-image', {
        //   method: 'POST',
        //   body: formDataToSend
        // });
        // const { filePath } = await response.json();
        // imagePath = filePath;
      }
      
      // Solo enviar a la base de datos los campos requeridos
      const dataToSubmit = {
        name: formData.name,
        description: formData.description,
        quantity: parseFloat(formData.quantity),
        // La URL de la imagen es local, no se guarda en la base de datos
        image: imagePath 
      };
      
      await onSubmit(dataToSubmit);
      
      // Reset form if not editing
      if (!isEditing) {
        setFormData({
          name: "",
          description: "",
          quantity: "",
          imageFile: null,
          imagePreview: null
        });
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (error) {
      console.error("Error al enviar el formulario:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="bg-slate-800/80 border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-white">{isEditing ? "Editar Material" : "Agregar Nuevo Material"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-slate-200">Nombre</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej. Cemento"
              required
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
          
          <div>
            <Label htmlFor="description" className="text-slate-200">Descripción</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe el material..."
              className="bg-slate-700 border-slate-600 text-white"
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="quantity" className="text-slate-200">Cantidad (kg)</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="Ej. 100"
              min="0"
              step="0.1"
              required
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
          
          <div>
            <Label htmlFor="image" className="text-slate-200">Imagen (opcional - guardada localmente)</Label>
            <div className="mt-1 flex items-center">
              <label className="block w-full">
                <span className="sr-only">Subir imagen</span>
                <Input
                  id="image"
                  name="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  ref={fileInputRef}
                  className="hidden"
                />
                <div className="flex items-center justify-center border-2 border-dashed border-slate-600 rounded-md h-32 bg-slate-700 hover:bg-slate-600 cursor-pointer">
                  {formData.imagePreview ? (
                    <img
                      src={formData.imagePreview}
                      alt="Vista previa"
                      className="h-full object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-slate-400" />
                      <span className="mt-2 block text-sm text-slate-400">
                        Subir imagen
                      </span>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          <CardFooter className="px-0 pt-2">
            <Button 
              type="submit" 
              className="w-full"
              disabled={isUploading}
            >
              {isUploading ? "Procesando..." : isEditing ? "Guardar Cambios" : "Agregar Material"}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}

InventoryForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  initialData: PropTypes.object,
  isEditing: PropTypes.bool
}; 