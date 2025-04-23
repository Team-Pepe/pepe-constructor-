BACKEND  
---

# **Documentación de Controladores \- Backend Gestor de Obras**

## **Autenticación**

### **login(req, res)**

* **Función**: Inicia sesión del usuario.

* **Entrada**: email, password.

* **Proceso**: Verifica usuario, compara contraseña, genera token JWT y CSRF, guarda JWT en cookie.

* **Respuesta**: Usuario \+ token CSRF.

* **Errores**: 401 (credenciales), 500 (error interno).

### **register(req, res)**

* **Función**: Registra nuevo usuario.

* **Entrada**: id, email, password, username, bloodType.

* **Proceso**: Verifica duplicados, encripta contraseña, crea usuario (rol por defecto \= 2).

* **Respuesta**: Usuario registrado.

* **Errores**: 400 (duplicado), 500 (error).

---

## **Asistencia y Ubicación**

### **checkIn(req, res)**

* **Función**: Registro de entrada.

* **Entrada**: userId, lat, lng.

* **Proceso**: Crea nuevo registro en tabla `Attendance` con fecha/hora y ubicación.

* **Respuesta**: Registro creado.

* **Errores**: 400 (faltan datos), 500 (error).

### **checkOut(req, res)**

* **Función**: Registro de salida.

* **Entrada**: attendanceId, lat?, lng?

* **Proceso**: Actualiza el registro con hora de salida y posible ubicación.

* **Respuesta**: Registro actualizado.

* **Errores**: 400 (falta ID), 500 (error).

### **getUserAttendance(req, res)**

* **Función**: Consulta asistencias de un usuario.

* **Entrada**: userId (en URL).

* **Proceso**: Busca registros ordenados por check-in (desc).

* **Respuesta**: Lista de asistencias.

* **Errores**: 400 (sin ID), 500 (error).

### **getUsersNearby(req, res)**

* **Función**: Obtiene usuarios cercanos.

* **Entrada**: lat, lng, radius (opcional, default: 1000m).

* **Proceso**: Filtra asistencias activas dentro del radio usando fórmula de distancia.

* **Respuesta**: Lista de usuarios ordenada por cercanía.

* **Errores**: 400 (faltan coordenadas), 500 (error).

---

## **Recuperación de Contraseña**

### **requestPasswordReset(req, res)**

* **Función**: Solicita recuperación por email.

* **Entrada**: email.

* **Proceso**: Verifica existencia, elimina tokens anteriores, envía enlace.

* **Respuesta**: Mensaje genérico por seguridad.

* **Errores**: 400 (email faltante), 500 (error).

### **resetPassword(req, res)**

* **Función esperada**: Restablece contraseña con token.

* **Entrada esperada**: token, newPassword.

* **Proceso**: Validar token, verificar expiración, actualizar contraseña encriptada.

* **Errores esperados**: 400 (token inválido/expirado), 500 (error interno).

---

# **Documentación de Rutas (`routes/`)**

## **1\. `authRouter.js`**

**Propósito**: Maneja las rutas relacionadas con la autenticación de usuarios.  
 **Endpoints**:

* `POST /api/auth/login`: Autentica a un usuario y devuelve un token JWT y un token CSRF.

* `POST /api/auth/register`: Registra un nuevo usuario.

* `POST /api/auth/forgot-password`: Inicia el proceso de restablecimiento de contraseña.

* `POST /api/auth/reset-password`: Restablece la contraseña del usuario utilizando un token.

---

## **2\. `dashboard.js`**

**Propósito**: Administra las rutas relacionadas con las funcionalidades del dashboard principal.  
 **Endpoints**:

* Varios endpoints para recuperar y gestionar datos del dashboard, como actividades de usuarios, métricas generales y otra información relevante para administradores o supervisores.

---

## **3\. `api.js`**

**Propósito**: Sirve como enrutador central para los endpoints de la API.  
 **Endpoints**:

* Importa y registra rutas de módulos como `materiales`, `solicitudes`, etc., bajo la ruta base `/api`.

---

## **4\. `dashboardEmpleados.js`**

**Propósito**: Maneja rutas específicas para funcionalidades del dashboard de empleados.  
 **Endpoints**:

* Endpoints para ver materiales disponibles, enviar solicitudes de materiales, registrar uso de materiales y otras funciones relacionadas al rol del trabajador.

---

## **5\. `materialAssignments.js`**

**Propósito**: Maneja rutas para asignar materiales a zonas de trabajo.  
 **Endpoints**:

* `POST /api/material-assignments`: Asigna materiales a una zona de trabajo específica.

* `GET /api/material-assignments/zona/{id_zona}`: Recupera los materiales asignados a una zona específica.

---

## **6\. `materialRequests.js`**

**Propósito**: Administra rutas para solicitudes de materiales.  
 **Endpoints**:

* `POST /api/material-requests`: Crea una nueva solicitud de material.

* `GET /api/material-requests`: Recupera todas las solicitudes, con opción de filtrar por estado.

* `PATCH /api/material-requests/{id}/status`: Actualiza el estado de una solicitud específica.

---

## **7\. `geo.js`**

**Propósito**: Maneja rutas relacionadas con geolocalización y asistencia.  
 **Endpoints**:

* `POST /api/geo/check-in`: Registra la ubicación de entrada del usuario (check-in).

* `POST /api/geo/check-out`: Registra la ubicación de salida del usuario (check-out).

* `GET /api/geo/user/{userId}/attendance`: Recupera todos los registros de asistencia del usuario.

---

## **8\. `passwordRoutes.js`**

**Propósito**: Administra rutas de recuperación y restablecimiento de contraseñas.  
 **Endpoints**:

* `POST /api/forgot-password`: Solicita un restablecimiento de contraseña por email.

* `POST /api/reset-password`: Restablece la contraseña con un token de recuperación válido.

---

## **Estructura General**

* Cada archivo exporta un enrutador de Express con sus endpoints y controladores correspondientes.

* Las rutas están organizadas por funcionalidad para facilitar el mantenimiento y escalabilidad del proyecto.

## **Middleware**

* Muchas rutas utilizan middleware de autenticación (JWT) y protección CSRF para garantizar seguridad y control de acceso.

---

Aquí tienes la documentación organizada para que puedas copiar y pegar directamente en Google Docs sin problemas de formato:

---

# **Resto de Documentación de Archivos y Funcionalidades del Backend**

## **1\. `index.js`**

**Propósito**: Este es el punto de entrada de la aplicación. Configura el servidor Express y los middleware necesarios.  
 **Funcionalidades**:

* Carga las variables de entorno desde un archivo `.env`.

* Configura middleware como helmet, cors, y cookie-parser.

* Establece la conexión a la base de datos utilizando Prisma.

* Configura Swagger para la documentación de la API.

* Registra las rutas de autenticación y otras rutas protegidas.

* Maneja errores globales y arranca el servidor.

---

## **2\. `prisma/schema.prisma`**

**Propósito**: Define el esquema de la base de datos utilizando Prisma.  
 **Funcionalidades**:

* Contiene la definición de los modelos de datos, como User, WorkZone, Material, Request, Attendance, Message, Metric, ZonaMaterial, y MaterialRequest.

* Establece las relaciones entre los modelos y las propiedades de cada uno, como tipos de datos y restricciones.

---

## **3\. `config/db.js`**

**Propósito**: Configura la conexión a la base de datos utilizando Prisma.  
 **Funcionalidades**:

* Exporta una instancia de `PrismaClient` que se utiliza en toda la aplicación para interactuar con la base de datos.

---

## **4\. `middleware/authMiddleware.js`**

**Propósito**: Contiene middleware para la autenticación y protección CSRF.  
 **Funcionalidades**:

* `authenticateToken`: Verifica el token JWT en las solicitudes para asegurar que el usuario esté autenticado.

* `verifyCSRF`: Verifica el token CSRF para proteger contra ataques de solicitudes cruzadas.

---

## **5\. `services/emailService.js`**

**Propósito**: Maneja el envío de correos electrónicos, como los correos de recuperación de contraseña.  
 **Funcionalidades**:

* Contiene funciones para enviar correos electrónicos utilizando un servicio de correo (por ejemplo, SMTP o un servicio de terceros).

---

## **6\. `utils/fileUtils.js`**

**Propósito**: Proporciona utilidades para manejar archivos, como subir y eliminar imágenes.  
 **Funcionalidades**:

* Funciones para procesar imágenes y gestionar archivos en el sistema de almacenamiento.

---

## **7\. `utils/geoUtils.js`**

**Propósito**: Proporciona funciones relacionadas con la geolocalización.  
 **Funcionalidades**:

* Funciones para calcular distancias y verificar si un punto está dentro de un radio específico.

---

## **8\. `config/swagger.js`**

**Propósito**: Configura Swagger para la documentación de la API.  
 **Funcionalidades**:

* Define la configuración de Swagger, incluyendo la información de la API, los servidores y los esquemas de seguridad.

---

## **9\. `.env`**

**Propósito**: Archivo de configuración para variables de entorno.  
 **Funcionalidades**:

* Almacena información sensible y configuraciones, como la URL de la base de datos, el secreto del JWT, y otros parámetros de configuración.

---

## **Estructura General**

* Cada archivo tiene una funcionalidad bien definida para facilitar la gestión y mantenimiento de la aplicación.

* Las rutas, controladores y utilidades están organizados para mejorar la escalabilidad y la claridad del código.

## **Seguridad**

* Se implementan medidas de seguridad, como autenticación JWT y protección CSRF, para garantizar la protección de la aplicación y los datos de los usuarios.

---

FRONTEND  
---

**Carpeta General: components**

Esta carpeta contiene todos los componentes reutilizables de la aplicación. Los componentes están organizados en subcarpetas según su funcionalidad específica.

---

**📍 Carpeta: EmployeeMap**

Esta subcarpeta contiene componentes relacionados con la funcionalidad del mapa interactivo para empleados y zonas de trabajo.

**EmployeeMap.jsx**

**Función:** Renderiza un mapa interactivo que muestra la ubicación de los empleados y las zonas de trabajo guardadas.

* **Entrada:**  
  * workers: Lista de empleados con sus ubicaciones.  
  * defaultCenter: Coordenadas iniciales del mapa (latitud y longitud).  
  * defaultZoom: Nivel de zoom inicial del mapa.  
  * savedZones: Lista de zonas de trabajo guardadas con sus coordenadas y radios.  
* **Proceso:**  
1.  Configura el mapa utilizando react-leaflet y aplica un estilo oscuro.  
2.  Renderiza círculos para las zonas de trabajo guardadas.  
3.  Renderiza marcadores para los empleados, indicando si están dentro o fuera de una zona.  
4. Calcula dinámicamente si un empleado está dentro de una zona utilizando la fórmula de distancia.  
* **Respuesta:**  
  * Mapa interactivo con zonas y empleados.  
  * Popups con información detallada de cada empleado y zona.  
* **Errores:**  
  * Muestra un mensaje en la consola si una zona tiene datos inválidos.

---

**📍 Carpeta: WorkZoneMap**

Esta subcarpeta contiene componentes relacionados con la gestión de zonas de trabajo en el mapa.

**ViewMaterialsModal.jsx**

**Función:** Muestra un modal con la lista de materiales asignados a una zona de trabajo.

* **Entrada:**  
  * isOpen: Estado del modal (abierto/cerrado).  
  * onClose: Función para cerrar el modal.  
  * materials: Lista de materiales asignados a la zona.  
  * zoneName: Nombre de la zona de trabajo.  
* **Proceso:**  
1. Si materials no es un array, muestra un mensaje de error.  
2. Si no hay materiales, muestra un mensaje indicando que no hay materiales asignados.  
3. Si hay materiales, los lista con su nombre, cantidad y unidad.  
* **Respuesta:**  
  * Modal con la lista de materiales asignados a la zona.  
  * Botón para cerrar el modal.  
* **Errores:**  
  * Muestra un mensaje si materials no es un array válido.

---

**📍 Componentes**

**AuthProvider.jsx**

**Función:** Proporciona el contexto de autenticación para toda la aplicación.

* **Entrada:**  
  * children: Componentes hijos que necesitan acceso al contexto de autenticación.  
* **Proceso:**  
1. Maneja el estado de autenticación (isAuthenticated).  
2.  Proporciona funciones para establecer el rol del usuario (setRoleId) y el token CSRF (setCsrfToken).  
3.  Permite a los componentes hijos acceder al contexto de autenticación.  
* **Respuesta:**  
  * Proporciona el estado y las funciones de autenticación a través de un AuthContext.

---

**ForgotPassword.jsx**

**Función:** Permite a los usuarios solicitar un enlace para restablecer su contraseña.

* **Entrada:**  
  * email: Correo electrónico del usuario.  
* **Proceso:**  
1. Valida que el correo electrónico esté presente.  
2. Envía una solicitud al backend para generar un enlace de recuperación.  
3. Muestra un mensaje genérico de éxito o error.  
* **Respuesta:**  
  * Mensaje indicando que se envió el enlace de recuperación (sin confirmar si el correo existe por seguridad).  
* **Errores:**  
  * Muestra un mensaje si el correo no es válido o si ocurre un error en el servidor.

---

**LoginPage.jsx**

**Función:** Permite a los usuarios iniciar sesión en la aplicación.

* **Entrada:**  
  * email: Correo electrónico del usuario.  
  * password: Contraseña del usuario.  
* **Proceso:**  
1. Valida las credenciales ingresadas.  
2. Envía una solicitud al backend para autenticar al usuario.  
3. Guarda el token JWT y el token CSRF en cookies/localStorage.  
4. Redirige al usuario según su rol (roleId).  
* **Respuesta:**  
  * Redirige al dashboard correspondiente según el rol del usuario.  
* **Errores:**  
  * Muestra mensajes de error para credenciales inválidas, acceso no autorizado o problemas de conexión.

---

**Register.jsx**

**Función:** Permite a los usuarios registrarse en la aplicación.

* **Entrada:**  
  * name: Nombre completo del usuario.  
  * document: Número de documento del usuario.  
  * bloodType: Tipo de sangre del usuario.  
  * email: Correo electrónico del usuario.  
  * password: Contraseña del usuario.  
* **Proceso:**  
1. Valida los datos ingresados.  
2. Envía una solicitud al backend para registrar al usuario.  
3. Redirige al login tras un registro exitoso.  
* **Respuesta:**  
  * Mensaje de éxito y redirección al login.  
* **Errores:**  
  * Muestra mensajes para datos duplicados o problemas en el servidor.

---

**ResetPassword.jsx**

**Función:** Permite a los usuarios restablecer su contraseña utilizando un token de recuperación.

* **Entrada:**  
  * password: Nueva contraseña.  
  * confirmPassword: Confirmación de la nueva contraseña.  
  * token: Token de recuperación obtenido desde la URL.  
* **Proceso:**  
1. Valida que el token esté presente en la URL.  
2. Verifica que las contraseñas coincidan.  
3. Envía la nueva contraseña al backend para actualizarla.  
* **Respuesta:**  
  * Mensaje de éxito si la contraseña se actualiza correctamente.  
  * Redirección al login tras el éxito.  
* **Errores:**  
  * Muestra un mensaje si las contraseñas no coinciden.  
  * Redirige al login si no hay token en la URL.

 

---

**Carpeta General: hooks**

Esta carpeta contiene hooks personalizados que encapsulan lógica reutilizable para diferentes partes de la aplicación.

---

**📍 Hooks**

**useIsMobile.js**

**Función:** Detecta si el dispositivo actual tiene un ancho de pantalla menor al breakpoint definido para dispositivos móviles.

* **Entrada:**  
  * Ninguna.  
* **Proceso:**  
1. Define un breakpoint móvil (MOBILE\_BREAKPOINT) de 768px.  
2. Usa window.matchMedia para detectar cambios en el tamaño de la ventana.  
3. Actualiza el estado isMobile cada vez que el ancho de la ventana cambia.  
* **Respuesta:**  
  * Devuelve un valor booleano (true o false) indicando si el dispositivo es móvil.  
* **Errores:**  
  * No maneja errores explícitos, pero requiere que el hook se use en un entorno donde window esté disponible (no en SSR).

---

**Carpeta General: lib**

Esta carpeta contiene funciones y utilidades reutilizables que encapsulan lógica común para ser utilizadas en diferentes partes de la aplicación.

---

**📍 Utilidades**

**utils.js**

Función: Combina clases de Tailwind CSS de manera eficiente, eliminando conflictos y redundancias.

* **Entrada:**  
  * ...inputs: Una lista de clases CSS como argumentos.  
* **Proceso**:  
1. Usa clsx para condicionar y combinar clases dinámicamente.  
2. Usa twMerge para resolver conflictos entre clases de Tailwind CSS (por ejemplo, bg-red-500 y bg-blue-500).  
* **Respuesta**:  
  * Devuelve una cadena de texto con las clases combinadas y optimizadas.  
* **Errores**:  
  * No maneja errores explícitos, pero requiere que las clases sean válidas para Tailwind CSS.

---

**Carpeta General: pages**

Esta carpeta contiene las interfaces principales de la aplicación, organizadas en subcarpetas según el tipo de usuario. Las interfaces están diseñadas para administradores y empleados, con funcionalidades específicas para cada rol.

---

**📍 Carpeta: Dashboard**

Esta subcarpeta contiene la interfaz principal para los administradores, donde pueden supervisar proyectos, trabajadores, inventarios y tareas.

**dashboard.jsx**

**Función:** Proporciona una vista general para los administradores, con métricas clave, mapas interactivos y herramientas de gestión.

* **Entrada:**  
  * roleId: Identifica el rol del usuario para mostrar contenido relevante.  
  * metrics: Métricas generales del sistema (proyectos activos, tareas, etc.).  
  * projects: Lista de proyectos en progreso.  
  * attendance: Registros de asistencia de los trabajadores.  
  * materials: Inventario de materiales.  
  * activities: Actividades recientes.  
  * workers: Lista de trabajadores.  
* **Proceso:**  
1. Carga los datos del dashboard desde el backend.  
2. Muestra métricas clave en tarjetas.  
3. Renderiza un mapa interactivo con zonas de trabajo y trabajadores.  
4. Proporciona pestañas para navegar entre resumen, asistencia e inventario.  
5. Permite realizar acciones rápidas como registrar asistencia o gestionar inventario.  
* **Respuesta:**  
  * Vista general con métricas clave.  
  * Mapa interactivo con zonas y trabajadores.  
  * Pestañas para navegar entre diferentes secciones.  
* **Errores:**  
  * Muestra mensajes de error si no se pueden cargar los datos.

---

**📍 Carpeta: DashboardWorkers**

Esta subcarpeta contiene la interfaz principal para los empleados, donde pueden gestionar sus tareas, asistencia y materiales.

**dashboard-empleados.jsx**

**Función:** Proporciona una vista específica para los empleados, con herramientas para gestionar su ubicación, asistencia y materiales asignados.

* **Entrada:**  
  * activeSection: Sección activa seleccionada por el usuario (mapa, inventario, zonas guardadas, etc.).  
  * savedZones: Zonas de trabajo guardadas.  
  * workerLocation: Ubicación actual del trabajador.  
  * currentWorker: Información del trabajador actual.  
* **Proceso:**  
1. Muestra un mapa interactivo con la ubicación del trabajador y las zonas cercanas.  
2. Permite al trabajador registrar su asistencia (check-in/check-out).  
3. Proporciona acceso al inventario de materiales asignados.  
4. Muestra las zonas de trabajo guardadas.  
* **Respuesta:**  
  * Mapa interactivo con la ubicación del trabajador.  
  * Inventario de materiales asignados.  
  * Registro de asistencia.  
* **Errores:**  
  * Muestra mensajes si no se puede obtener la ubicación o cargar los datos.

 

---

### **📍`routes/materialRoutes.js`**

**Propósito:** Define las rutas relacionadas con la gestión de materiales.  
 **Funcionalidades:**

* Permite a los supervisores registrar nuevos materiales en el sistema.

* Permite editar materiales existentes, incluyendo nombre, descripción, cantidad y foto.

* Permite a los trabajadores consultar los materiales disponibles según su zona.

* Incluye protección con middleware para verificar roles y autenticación.

---

### **📍 `controllers/materialController.js`**

**Propósito:** Maneja la lógica de negocio para las operaciones relacionadas con materiales.  
 **Funcionalidades:**

* Recibe datos del frontend para crear, editar y listar materiales.

* Interactúa con Prisma para realizar operaciones CRUD en la base de datos.

* Filtra los materiales por zona cuando la solicitud proviene de un trabajador.

* Valida la información antes de guardar o actualizar los registros.

---

### **📍. `services/materialService.js`**

**Propósito:** Centraliza las operaciones con la base de datos relacionadas con materiales.  
 **Funcionalidades:**

* Contiene funciones reutilizables para crear, actualizar, buscar o filtrar materiales.

* Implementa la lógica para asociar materiales con zonas específicas.

* Maneja posibles errores de las consultas y devuelve información estructurada.

---

### **📍`middleware/roleMiddleware.js`**

**Propósito:** Verifica el rol del usuario antes de permitir ciertas acciones.  
 **Funcionalidades:**

* Permite el acceso a rutas solo si el usuario tiene el rol adecuado (ej. supervisor o jefe de obra).

* Previene accesos no autorizados a funcionalidades de edición o registro de materiales.

* Puede ser reutilizado en otras rutas que requieran verificación por rol.

---

**Carpeta General: utils**

Esta carpeta contiene funciones utilitarias que encapsulan lógica común y son reutilizables en diferentes partes de la aplicación.

---

📍 **Utilidades**

**cookies.js**

**Función**: Maneja la obtención de cookies específicas, como el token de autenticación.

* **Funciones**:  
  1. **getCookie(name)**  
     * **Descripción**: Obtiene el valor de una cookie específica.  
     * Entrada:  
       * name: Nombre de la cookie que se desea obtener.  
     * **Proceso**:  
1. Usa una expresión regular para buscar la cookie por su nombre en document.cookie.  
2.  Devuelve el valor de la cookie si se encuentra.  
   * **Respuesta**:  
     * Valor de la cookie (si existe) o null (si no se encuentra).  
   2. **getAuthToken()**  
      * **Descripción**: Obtiene el token de autenticación almacenado en las cookies.  
      * **Entrada**:  
        * Ninguna.  
      * **Proceso**:  
1. Llama a getCookie('token') para obtener el valor de la cookie token.  
   * **Respuesta**:  
     * Valor del token de autenticación (si existe) o null (si no se encuentra).  
* **Errores**:  
  * No maneja errores explícitos, pero requiere que document.cookie esté disponible (no funciona en SSR).
