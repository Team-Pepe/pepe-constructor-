import React, { useState, useEffect } from "react";
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Upload, Loader2 } from "lucide-react";
import { uploadImage } from "@/services/supabaseService";

export function InventoryForm({ onSubmit, initialData = null, isEditing = false }) {
  const [formData, setFormData] = useState(initialData || {
    name: "",
    description: "",
    quantity: "",
    image_url: null
  });
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  // Establecer la vista previa de la imagen cuando hay datos iniciales
  useEffect(() => {
    if (initialData?.image_url) {
      setPreviewImage(initialData.image_url);
      setFormData(prev => ({
        ...prev,
        image_url: initialData.image_url
      }));
    } else if (initialData?.image) {
      setPreviewImage(initialData.image);
      setFormData(prev => ({
        ...prev,
        image_url: initialData.image
      }));
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpiar error cuando el usuario empieza a escribir
    setError(null);
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Validaciones
      if (!file.type.startsWith('image/')) {
        setError('Por favor selecciona un archivo de imagen válido');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen no debe exceder 5MB');
        return;
      }

      // Guardar el archivo seleccionado
      setSelectedFile(file);

      // Crear una URL para la vista previa
      const objectUrl = URL.createObjectURL(file);
      setPreviewImage(objectUrl);
      
      // Indicar que se está subiendo
      setIsImageUploading(true);
      setUploadProgress(10);

      // Simular progreso durante la carga
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 300);

      // Subir la imagen a Supabase
      const result = await uploadImage(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.error) {
        setError(`Error al subir la imagen: ${result.error}`);
        return;
      }

      // Guardar la URL de Supabase en el estado
      setFormData(prev => ({
        ...prev,
        image_url: result.url
      }));

      console.log('Imagen subida exitosamente:', result.url);
      
    } catch (err) {
      console.error('Error al procesar la imagen:', err);
      setError(`Error al procesar la imagen: ${err.message}`);
    } finally {
      setIsImageUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.name.trim()) {
      setError('El nombre del material es requerido');
      return;
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      setError('La cantidad debe ser mayor a 0');
      return;
    }

    if (!formData.image_url && !isEditing && !selectedFile) {
      setError('La imagen es requerida');
      return;
    }

    setIsUploading(true);
    
    try {
      if (isEditing) {
        // Para edición, crear un FormData con el ID y todos los datos
        const submitFormData = new FormData();
        
        // Añadir campos obligatorios, asegurando valores no nulos
        submitFormData.append('id', initialData.id.toString());
        submitFormData.append('name', formData.name.trim());
        submitFormData.append('description', formData.description || '');
        submitFormData.append('quantity', parseFloat(formData.quantity));
        
        // Añadir imagen si existe
        if (formData.image_url) {
          submitFormData.append('image_url', formData.image_url);
        }
        
        console.log('Enviando datos de edición:', 
          Object.fromEntries([...submitFormData.entries()]));
        
        await onSubmit(submitFormData);
      } else {
        // Para creación, usar FormData
        const submitFormData = new FormData();
        
        // Añadir campos obligatorios
        submitFormData.append('name', formData.name.trim());
        submitFormData.append('description', formData.description || '');
        submitFormData.append('quantity', parseFloat(formData.quantity));
        submitFormData.append('image_url', formData.image_url || '');
        
        // Si hay un archivo seleccionado, añadirlo
        if (selectedFile) {
          submitFormData.append('image', selectedFile);
        } else if (formData.image_url) {
          submitFormData.append('image_url', formData.image_url);
        }
        
        console.log('Enviando datos de nuevo material:', 
          Object.fromEntries([...submitFormData.entries()]));
          
        await onSubmit(submitFormData);
      }
      
      // Reset form if not editing
      if (!isEditing) {
        setFormData({
          name: "",
          description: "",
          quantity: "",
          image_url: null
        });
        setSelectedFile(null);
        setPreviewImage(null);
      }
      setError(null);
    } catch (err) {
      console.error("Error al enviar el formulario:", err);
      setError(`Error al guardar el material: ${err.message}`);
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
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded p-3 mb-4 text-red-200">
            {error}
          </div>
        )}
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
              value={formData.description || ''}
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
            <Label htmlFor="image" className="text-slate-200">Imagen</Label>
            <div className="mt-1 flex items-center">
              <label className="block w-full">
                <span className="sr-only">Subir imagen</span>
                <Input
                  id="image"
                  name="image"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif"
                  onChange={handleImageChange}
                  disabled={isImageUploading}
                  className="hidden"
                />
                <div className="flex items-center justify-center border-2 border-dashed border-slate-600 rounded-md h-32 bg-slate-700 hover:bg-slate-600 cursor-pointer relative">
                  {isImageUploading ? (
                    <div className="text-center">
                      <Loader2 className="mx-auto h-8 w-8 text-orange-400 animate-spin" />
                      <span className="mt-2 block text-sm text-slate-400">
                        Subiendo... {uploadProgress}%
                      </span>
                      <div className="w-full bg-slate-600 h-1 mt-2">
                        <div 
                          className="bg-orange-400 h-1" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  ) : previewImage ? (
                    <img
                      src={previewImage}
                      alt="Vista previa"
                      className="h-full object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-slate-400" />
                      <span className="mt-2 block text-sm text-slate-400">
                        {formData.image_url ? "Cambiar imagen" : "Subir imagen"}
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
              disabled={isUploading || isImageUploading || !formData.name || !formData.quantity || (!formData.image_url && !isEditing && !selectedFile)}
            >
              {isUploading ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </span>
              ) : isEditing ? "Guardar Cambios" : "Agregar Material"}
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