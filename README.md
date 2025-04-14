# 🏗️ Sistema de Gestión de Obras de Construcción

![Node.js](https://img.shields.io/badge/Node.js-18.3.1-green)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![Prisma](https://img.shields.io/badge/Prisma-5.10.2-2D3748)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.x-336791)
![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.3.5-38B2AC)

**Plataforma digital para optimizar la administración de obras, control de asistencia, gestión de materiales y cálculo de pagos.**  
*Desarrollado por estudiantes de la Universidad Tecnológica de Pereira para la materia TS683 Administracion Y Planeacion De Proyectos Software Gr. 401.*

---

## 🚀 Características Clave

| Módulo                  | Descripción                                                                 | Tecnologías Usadas                     |
|-------------------------|-----------------------------------------------------------------------------|----------------------------------------|
| 👥 **Gestión de Usuarios** | Registro de roles (supervisor, trabajador, administrador) con permisos.     | Node.js, JWT, PostgreSQL, React, bcrypt, prisma       |
| 📍 **Control de Asistencia** | Check-in/out con geolocalización y reportes en tiempo real.                 | Leaflet, React-Leaflet, Turf.js             |
| 🧱 **Gestión de Materiales** | Solicitud y aprobación de materiales con notificaciones instantáneas.       | Radix UI, Tailwind CSS |
| 💼 **Cálculo de Pagos**    | Automatización de horas trabajadas y generación de resúmenes descargables.  | PDFKit, Chart.js, Recharts, date-fns          |

---

## 📋 Requerimientos Funcionales (RF)

| **Código** | **Descripción**                                                                 | **Prioridad** | **Tiempo** |
|------------|---------------------------------------------------------------------------------|---------------|------------|
| **RF01**   | Gestión de usuarios y roles con autenticación JWT                               | Must Have     | 4 semanas  |
| **RF02**   | Control de asistencia con geolocalización y validación en tiempo real           | Should Have   | 3 semanas  |
| **RF03**   | Administración de materiales y aprobación de solicitudes                        | Must Have     | 2 semanas  |
| **RF04**   | Gestión de zonas de trabajo y asignación de tareas con evidencias fotográficas  | Must Have     | 2.5 semanas|
| **RF05**   | Panel de control con métricas y generación de reportes PDF                      | Should Have   | 2 semanas  |
| **RF06**   | Chat en tiempo real entre trabajadores y supervisores                           | Could Have    | 2 semanas  |
| **RF07**   | Funcionamiento offline con sincronización automática                            | Could Have    | 3 semanas  |
| **RF08**   | Cálculo automático de pagos basado en asistencia                                | Must Have     | 3 semanas  |
| **RF09**   | Generación de carnets digitales con código de barras                            | Should Have   | 1 semana   |

---

## 🛡️ Requerimientos No Funcionales (RNF)

| **Código** | **Descripción**                                                                 | **Prioridad** | **Dificultad** | **Tiempo** |
|------------|---------------------------------------------------------------------------------|---------------|----------------|------------|
| **RNF01**  | Rendimiento óptimo (<500ms respuesta) y soporte para alta concurrencia          | Must Have     | Fácil          | 2 semanas  |
| **RNF02**  | Seguridad en autenticación y protección de datos sensibles                      | Must Have     | Alta           | 3 semanas  |
| **RNF03**  | Escalabilidad para crecimiento de usuarios y obras                              | Should Have   | Fácil          | 1 semana   |
| **RNF04**  | Interfaz intuitiva y multi-dispositivo                                          | Won't Have    | Media          | 2 semanas  |
| **RNF05**  | Código documentado y mantenible                                                 | Should Have   | Media          | 2 semanas  |
| **RNF06**  | Integración con Google Maps y notificaciones en tiempo real                     | Could Have    | Alta           | 3 semanas  |


## 📌 Seguimiento del Proyecto

[![Project Progress](https://img.shields.io/badge/Progress-45%25-orange?logo=progress&style=for-the-badge)](https://github.com/orgs/Team-Pepe/projects/5/views/1)

[📊 Tablero completo de actividades](https://github.com/orgs/Team-Pepe/projects/5/views/1)

---

## 🛠️ Tecnologías

| Frontend | Backend | Base de Datos | Utilidades |
|----------|---------|---------------|------------|
| ![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react) | ![Node.js](https://img.shields.io/badge/Node.js-18.3.1-339933?logo=node.js) | ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.x-4169E1?logo=postgresql) |  ![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-199900?logo=leaflet) |
|  ![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF?logo=vite) |  ![Express](https://img.shields.io/badge/Express-4.18.2-000000?logo=express) ||  ![Recharts](https://img.shields.io/badge/Recharts-2.15.1-FF6384?logo=recharts) |
|  ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.3.5-38B2AC?logo=tailwind-css) | ![Prisma](https://img.shields.io/badge/Prisma-5.10.2-2D3748?logo=prisma) |
|  ![Radix](https://img.shields.io/badge/Radix_UI-varios-161618) | |

### Extracto de package.json
```json
// Frontend
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "vite": "^6.2.0",
  "tailwindcss": "^3.3.5",
  "@radix-ui/react-dropdown-menu": "^2.1.6",
  "leaflet": "^1.9.4",
  "recharts": "^2.15.1"
}

// Backend
{
  "express": "^4.18.2",
  "@prisma/client": "^5.10.2",
  "prisma": "^5.10.2"
}
```

---

## 📊 Arquitectura del Sistema

```mermaid
flowchart TD
    subgraph "Frontend"
        RoutesState["Routes & State Management\n(App.jsx, context, hooks)"]:::frontend
        Auth["Authentication Module\n(login-page.jsx, register.jsx, forgot-password.jsx)"]:::frontend
        subgraph "Shared Components"
            SharedCommon["Common Components"]:::frontend
            Layout["Layout Components"]:::frontend
            Dashboard["Dashboard Components"]:::frontend
        end
    end

    subgraph "Backend"
        Server["Main Server"]:::backend
        subgraph "Routes"
            APIRoutes["api.js"]:::backend
            GeoRoutes["geo.js"]:::backend
        end
        Controllers["Controllers\n(geoController.js)"]:::backend
        Config["Configurations\n(db.js, swagger.js)"]:::backend
        Utilities["Utilities\n(geoUtils.js)"]:::backend
    end

    RoutesState -->|"renders"| Auth
    Auth -->|"uses"| SharedCommon
    Auth -->|"uses"| Layout
    Auth -->|"uses"| Dashboard
    Auth -->|"HTTP_Request"| APIRoutes
    Server -->|"handles"| APIRoutes
    Server -->|"handles"| GeoRoutes
    APIRoutes -->|"calls"| Controllers
    GeoRoutes -->|"calls"| Controllers
    Controllers -->|"uses"| Config
    Controllers -->|"uses"| Utilities
    APIRoutes -->|"response"| Auth

    %% Click Events
    click Auth "https://github.com/team-pepe/pepe-constructor-/tree/main/frontend/src/features/auth"
    click SharedCommon "https://github.com/team-pepe/pepe-constructor-/tree/main/frontend/src/components/common"
    click Layout "https://github.com/team-pepe/pepe-constructor-/tree/main/frontend/src/components/layout"
    click Dashboard "https://github.com/team-pepe/pepe-constructor-/tree/main/frontend/src/components/dashboard"
    click RoutesState "https://github.com/team-pepe/pepe-constructor-/blob/main/frontend/src/app/App.jsx"
    click Server "https://github.com/team-pepe/pepe-constructor-/blob/main/backend/src/index.js"
    click Controllers "https://github.com/team-pepe/pepe-constructor-/blob/main/backend/src/controllers/geoController.js"
    click APIRoutes "https://github.com/team-pepe/pepe-constructor-/blob/main/backend/src/routes/api.js"
    click GeoRoutes "https://github.com/team-pepe/pepe-constructor-/blob/main/backend/src/routes/geo.js"
    click Config "https://github.com/team-pepe/pepe-constructor-/tree/main/backend/src/config"
    click Utilities "https://github.com/team-pepe/pepe-constructor-/tree/main/backend/src/utils"

    %% Styles
    class RoutesState,Auth,SharedCommon,Layout,Dashboard frontend
    class Server,APIRoutes,GeoRoutes,Controllers,Config,Utilities backend
    classDef frontend fill:#FFD580,stroke:#333,stroke-width:2px;
    classDef backend fill:#C1FFC1,stroke:#333,stroke-width:2px;
```
## 🗃️ Diagrama Entidad-Relación (PostgreSQL)

```mermaid
erDiagram
    User ||--o{ Message : "enviados como sender"
    User ||--o{ Message : "recibidos como receiver"
    User ||--o{ Request : "solicita"
    User ||--o{ Task : "asignado a"
    User ||--o{ WorkZone : "supervisa"
    Role ||--o{ User : "asignado a"
    
    WorkZone ||--o{ Task : "contiene"
    WorkZone ||--o{ Metric : "medido en"
    
    Material ||--o{ Request : "solicitado"
    
    User {
        int id PK
        string email
        string username
        int roleId FK
        string password
    }
    
    WorkZone {
        int id PK
        string name
        string description
        int supervisorId FK
        float latitud
        float longitud
    }
    
    Task {
        int id PK
        int workZoneId FK
        int assignedTo FK
        string description
        string status
        datetime completionDate
        string evidenceUrl
    }
    
    Material {
        int id PK
        string name
        string description
        int quantity
        string image_url
    }
    
    Request {
        int id PK
        int userId FK
        int materialId FK
        datetime requestDate
        string status
    }
    
    Attendance {
        int id PK
        int userId FK
        datetime checkIn
        datetime checkOut
        float latitud
        float longitud
    }
    
    Message {
        int id PK
        int senderId FK
        int receiverId FK
        string message
        datetime sentAt
    }
    
    Metric {
        int id PK
        int workZoneId FK
        string metricType
        float value
        datetime recordedAt
    }
    
    Role {
        int id PK
        string roleName
        string permissions
    }
