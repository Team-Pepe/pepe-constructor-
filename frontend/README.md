# Pepe Constructor Frontend

Este proyecto es una aplicación web desarrollada con React y Vite.

## Estructura del Proyecto

La estructura del proyecto está organizada de la siguiente manera:

```
src/
├── app/                  # Configuración principal de la aplicación
│   └── App.jsx           # Componente principal y configuración de rutas
├── assets/               # Recursos estáticos (imágenes, fuentes, etc.)
├── components/           # Componentes reutilizables
│   ├── common/           # Componentes comunes (botones, modales, etc.)
│   ├── dashboard/        # Componentes específicos del dashboard
│   ├── layout/           # Componentes de layout (header, footer, etc.)
│   └── ui/               # Componentes UI básicos (shadcn/ui)
├── context/              # Context Providers
├── features/             # Características organizadas por dominio
│   └── auth/             # Funcionalidad de autenticación
├── hooks/                # Custom hooks
├── lib/                  # Utilidades y bibliotecas
├── pages/                # Páginas principales
└── styles/               # Estilos globales
    └── global.css        # Estilos globales de la aplicación
```

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

## Construcción

```bash
npm run build
```

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript and enable type-aware lint rules. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
