import React from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { LoginPage, Register, ForgotPassword as FPassword } from "@/features/auth"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirecciona la ruta raíz a la página de login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Página de login */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Otras rutas */}
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<FPassword />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
  