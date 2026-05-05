# Documentación Técnica y Manual de Usuario: SGPE

## 1. Introducción
**SGPE (Sistema de Gestión de Proyectos Estratégicos)** es una plataforma web moderna diseñada para la gestión integral de proyectos, subtareas, presupuestos y seguimiento de tiempos. Utiliza una estética de "Liquid Glass" (vidrio líquido) con animaciones fluidas y una interfaz premium.

---

## 2. Estructura del Proyecto
El proyecto está dividido en una arquitectura **Monorepo** simplificada con dos componentes principales:

### 2.1. Estructura de Directorios Principal
```text
SGPE/
├── backend/                # Lógica del servidor, API y Base de Datos
│   ├── prisma/             # Esquema de base de datos (SQLite)
│   ├── src/                # Código fuente backend (TS)
│   │   ├── controllers/    # Controladores de rutas
│   │   ├── routes/         # Definición de endpoints API
│   │   ├── services/       # Lógica de negocio
│   │   └── index.ts        # Punto de entrada
│   └── package.json        
├── frontend/               # Interfaz de usuario (React)
│   ├── src/                # Código fuente frontend (TSX)
│   │   ├── components/     # Componentes reutilizables (UI, Layout)
│   │   ├── pages/          # Vistas principales de la aplicación
│   │   ├── context/        # Gestión de estado global
│   │   └── App.tsx         # Router y estructura principal
│   ├── tailwind.config.js  # Configuración de estilos
│   └── package.json        
├── SGPE.bat                # Script de inicio rápido
└── .env                    # Variables de entorno globales
```

---

## 3. Tecnologías y Lenguajes
SGPE utiliza tecnologías de vanguardia para asegurar rendimiento y estética.

### 3.1. Lenguajes y Frameworks Base
- **React 18 (TSX)**: La base de toda la interfaz de usuario, permitiendo una navegación fluida sin recargar la página.
- **TypeScript (95%+)**: Utilizado en todo el proyecto para asegurar un código robusto y evitar errores.
- **HTML5**: Estructura semántica de la web.
- **CSS3 (Tailwind CSS)**: Sistema de diseño moderno para la estética "Liquid Glass".
- **SQL (SQLite)**: Base de datos donde se guarda toda la información.

### 3.2. Stack Tecnológico
| Capa | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite | Biblioteca de UI y entorno de desarrollo rápido. |
| **Estilos** | Tailwind CSS + Framer Motion | Diseño responsivo y animaciones fluidas. |
| **Gráficos** | Three.js + Recharts | Elementos 3D interactivos y visualización de datos. |
| **Backend** | Express (Node.js) | Servidor API REST. |
| **BD / ORM** | Prisma + SQLite | Gestión de base de datos relacional. |
| **Seguridad** | JWT + Bcrypt | Autenticación y cifrado de contraseñas. |
| **Utilidades** | PDFKit / Nodemailer | Generación de reportes y envío de correos. |

---

## 4. Funcionalidades Principales
1.  **Dashboard Inteligente**: Visualización de métricas de proyectos en tiempo real con gráficos dinámicos.
2.  **Gestión de Proyectos y Tareas**: Creación, edición y seguimiento de subtareas con validación de fechas.
3.  **Tablero Kanban**: Visualización de flujo de trabajo interactiva.
4.  **Paleta de Comandos (Ctrl+K)**: Acceso rápido a funciones del sistema desde cualquier lugar.
5.  **Reportes PDF**: Exportación de estados de proyecto y presupuestos.
6.  **Sistema de Calendario**: Vista mensual/semanal de hitos y fechas límite.
7.  **Notificaciones**: Alertas internas sobre cambios y recordatorios.

---

## 5. Manual de Usuario (Resumen)

### Acceso al Sistema
- Ejecute el archivo `SGPE.bat` en la raíz del proyecto para iniciar tanto el servidor como el cliente.
- Acceda a `http://localhost:5173` (predeterminado).

### Navegación
- **Barra Lateral**: Acceso a Dashboard, Proyectos, Calendario y Configuración.
- **Comandos Rápidos**: Presione `Ctrl + K` para buscar proyectos o realizar acciones rápidas sin clics.

### Gestión de Proyectos
1.  Vaya a la sección **Proyectos**.
2.  Haga clic en "Nuevo Proyecto".
3.  Defina el nombre, presupuesto y fechas.
4.  Dentro de un proyecto, puede añadir **Subtareas**, asignar responsables y marcar el progreso.

### Reportes
- Dentro de la vista de detalle de un proyecto, utilice el botón de **Exportar Reporte** para generar un documento PDF con el resumen comercial y técnico.

---

## 6. Configuración de Desarrollo
Para realizar cambios en el sistema:
1.  **Instalación**: `npm install` en ambas carpetas (`frontend` y `backend`).
2.  **Base de Datos**: `npx prisma db push` en la carpeta `backend` para sincronizar el esquema.
3.  **Ejecución**: `npm run dev` en ambas carpetas.
