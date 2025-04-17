import React, { useState, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';

export default function AddMaterialDialog({ open, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    try {
      const file = e.target.files[0];
      console.log('Archivo seleccionado:', file); // Debug log
      
      if (!file) {
        setError('Por favor seleccione una imagen');
        return;
      }

      // Validar tipo de archivo
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      console.log('Tipo de archivo:', file.type); // Debug log
      
      if (!validTypes.includes(file.type)) {
        setError('El archivo debe ser una imagen válida (JPG, PNG o GIF)');
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen no debe exceder 5MB');
        return;
      }

      setSelectedFile(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewImage(reader.result);
        setError('');
      };
      reader.onerror = () => {
        console.error('Error al leer el archivo'); // Debug log
        setError('Error al procesar la imagen');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error en handleImageChange:', error); // Debug log
      setError('Error al procesar la imagen: ' + error.message);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    try {
      // Validaciones
      if (!formData.name.trim()) {
        setError('El nombre del material es requerido');
        return;
      }

      if (!formData.quantity || formData.quantity <= 0) {
        setError('La cantidad debe ser mayor a 0');
        return;
      }

      if (!selectedFile) {
        setError('La imagen es requerida');
        return;
      }

      // Crear FormData para envío
      const submitFormData = new FormData();
      submitFormData.append('name', formData.name);
      submitFormData.append('quantity', formData.quantity);
      submitFormData.append('image', selectedFile, selectedFile.name); // Agregamos el nombre del archivo

      // Debug logs
      console.log('FormData contenido:');
      for (let pair of submitFormData.entries()) {
        console.log(pair[0], pair[1]);
      }

      // Si todo está bien, enviar datos
      await onSubmit(submitFormData);
      
      // Limpiar el formulario
      setFormData({ name: '', quantity: '' });
      setSelectedFile(null);
      setPreviewImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Limpiar el input file
      }
      onClose();
    } catch (error) {
      console.error('Error en handleSubmit:', error); // Debug log
      setError('Error al guardar el material: ' + error.message);
    }
  };

  const handleClose = () => {
    // Limpiar el formulario al cerrar
    setFormData({ name: '', quantity: '' });
    setSelectedFile(null);
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Agregar Nuevo Material</DialogTitle>
      <DialogContent>
        {error && (
          <div className="text-red-500 mb-4 p-2 bg-red-100 rounded">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <TextField
            fullWidth
            margin="normal"
            label="Nombre del Material"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Cantidad"
            name="quantity"
            type="number"
            value={formData.quantity}
            onChange={handleChange}
            required
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif"
            onChange={handleImageChange}
            className="w-full mt-4 p-2 border rounded"
            required
          />
          {previewImage && (
            <div className="mt-4 text-center">
              <img 
                src={previewImage} 
                alt="Vista previa" 
                className="max-w-full max-h-[200px] object-contain rounded"
              />
            </div>
          )}
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={!selectedFile || !formData.name || !formData.quantity}
        >
          Agregar
        </Button>
      </DialogActions>
    </Dialog>
  );
} 